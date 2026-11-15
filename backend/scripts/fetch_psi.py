"""Fetch NASA PSI combustion-science investigations and build a local snapshot.

Usage:
    python backend/scripts/fetch_psi.py

The script is intentionally dependency-light: httpx + the standard library.
It writes raw payloads to data/raw and a normalized snapshot to
data/psi_snapshot.json. Spanish translations are generated through the public
Google Translate web endpoint and cached in data/translations_es.json. If the
translation endpoint is unavailable, the original English text is kept.
"""

from __future__ import annotations

import json
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
SNAPSHOT_PATH = DATA_DIR / "psi_snapshot.json"
TRANSLATION_CACHE_PATH = DATA_DIR / "translations_es.json"
FINDINGS_OVERRIDES_PATH = DATA_DIR / "psi_findings_overrides.json"

PSI_BASE = "https://psi.nasa.gov"
SEARCH_URL = f"{PSI_BASE}/geode-py/ws/repo/search"
TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single"

RESEARCH_AREA = "combustion science"

PHASE_KEYWORDS = {
    "prevention": [
        "flammability",
        "flammable",
        "ignition",
        "material",
        "materials",
        "flame spread",
        "oxygen concentration",
        "oxygen",
        "limiting oxygen",
        "burn",
        "burning",
        "combustion",
        "fuel",
    ],
    "detection": [
        "smoke",
        "aerosol",
        "detection",
        "detect",
        "sensor",
        "particulate",
        "dust",
    ],
    "suppression": [
        "suppression",
        "suppress",
        "extinguishment",
        "extinguish",
        "extinction",
        "co2",
        "carbon dioxide",
        "helium",
        "water mist",
        "fire suppress",
        "fire extinguishing",
    ],
}

ENVIRONMENT_KEYWORDS = {
    "spacecraft": ["spacecraft", "iss", "international space station", "space station", "vehicle", "crew"],
    "lunar_base": ["lunar", "moon", "lunar base", "lunar surface"],
    "mars_base": ["mars", "martian"],
    "rover": ["rover", "pressurized rover"],
    "earth": ["earth", "terrestrial", "normal gravity", "ground"],
    "partial_gravity": ["partial gravity", "lunar-g", "mars-g", "reduced gravity"],
}

FUEL_KEYWORDS = {
    "solid": ["solid", "pmma", "poly", "fabric", "plastic", "paper", "cellulose", "sample"],
    "liquid": ["liquid", "droplet", "heptane", "decane", "fuel droplet", "mdca"],
    "gas": ["gas", "gaseous", "methane", "ethylene", "propane", "fuel jet", "burner", "flame"],
}

GRAVITY_KEYWORDS = {
    "microgravity": ["microgravity", "micro-g", "free fall", "iss", "space station"],
    "normal_gravity": ["normal gravity", "earth gravity", "1-g", "terrestrial", "ground"],
    "partial_gravity": ["partial gravity", "lunar-g", "mars-g", "reduced gravity"],
}

SENSOR_KEYWORDS = [
    "thermocouple",
    "radiometer",
    "camera",
    "video",
    "plif",
    "oh plif",
    "co plif",
    "spectrometer",
    "laser",
    "interferometer",
    "thermography",
    "aerosol",
    "smoke",
    "particle",
    "pressure transducer",
    "load cell",
    "scale",
    "microscope",
    "temperature",
    "heat flux",
]

STOPWORDS = {
    "the", "and", "for", "with", "that", "this", "from", "were", "was", "are", "into",
    "their", "using", "used", "have", "has", "been", "which", "will", "can", "not",
    "study", "investigation", "experiment", "experiments", "data", "results", "objective",
    "objectives", "also", "such", "more", "than", "between", "during", "under", "over",
}

# Curated classification for the 24 PSI combustion-science investigations.
# The automatic keyword classifier is useful for new records, but the curated
# map avoids false positives (for example, "normal gravity" comparisons being
# mistaken for Earth applications, or every experiment being tagged as
# detection because it contains the word "measurement").
CURATED_CLASSIFICATION: dict[str, dict[str, list[str]]] = {
    "PSI-10": {"phases": ["prevention"], "environments": ["spacecraft"], "fuel_types": ["gas"], "gravity_types": ["microgravity"], "sensors": ["radiometer", "camera", "thermocouple"]},
    "PSI-20": {"phases": ["prevention"], "environments": ["spacecraft"], "fuel_types": ["gas"], "gravity_types": ["microgravity"], "sensors": ["thermocouple", "camera", "radiometer"]},
    "PSI-21": {"phases": ["prevention"], "environments": ["spacecraft"], "fuel_types": ["gas"], "gravity_types": ["microgravity"], "sensors": ["thermocouple", "camera", "radiometer"]},
    "PSI-22": {"phases": ["prevention"], "environments": ["spacecraft"], "fuel_types": ["gas"], "gravity_types": ["microgravity"], "sensors": ["thermocouple", "camera", "plif"]},
    "PSI-23": {"phases": ["prevention"], "environments": ["spacecraft"], "fuel_types": ["gas"], "gravity_types": ["microgravity"], "sensors": ["thermocouple", "camera", "radiometer"]},
    "PSI-25": {"phases": ["prevention", "suppression"], "environments": ["spacecraft", "earth"], "fuel_types": ["solid"], "gravity_types": ["microgravity"], "sensors": ["thermocouple", "camera", "heat flux"]},
    "PSI-26": {"phases": ["prevention", "suppression"], "environments": ["spacecraft", "earth"], "fuel_types": ["solid"], "gravity_types": ["microgravity"], "sensors": ["thermocouple", "camera", "heat flux"]},
    "PSI-39": {"phases": ["prevention"], "environments": ["spacecraft"], "fuel_types": ["liquid"], "gravity_types": ["microgravity"], "sensors": ["thermocouple", "camera", "radiometer"]},
    "PSI-47": {"phases": ["detection"], "environments": ["spacecraft"], "fuel_types": [], "gravity_types": ["microgravity"], "sensors": ["aerosol", "smoke", "particle"]},
    "PSI-60": {"phases": ["prevention"], "environments": ["spacecraft"], "fuel_types": ["gas"], "gravity_types": ["microgravity"], "sensors": ["camera", "radiometer"]},
    "PSI-62": {"phases": ["prevention"], "environments": ["spacecraft"], "fuel_types": ["solid"], "gravity_types": ["microgravity"], "sensors": ["camera", "thermocouple", "tomography"]},
    "PSI-68": {"phases": ["suppression"], "environments": ["spacecraft"], "fuel_types": ["liquid"], "gravity_types": ["microgravity"], "sensors": ["thermocouple", "camera", "radiometer"]},
    "PSI-69": {"phases": ["prevention", "suppression"], "environments": ["spacecraft"], "fuel_types": ["liquid"], "gravity_types": ["microgravity"], "sensors": ["thermocouple", "camera", "radiometer"]},
    "PSI-98": {"phases": ["prevention", "detection", "suppression"], "environments": ["spacecraft", "earth"], "fuel_types": ["solid"], "gravity_types": ["microgravity"], "sensors": ["thermocouple", "camera", "smoke", "heat flux"]},
    "PSI-99": {"phases": ["prevention", "detection", "suppression"], "environments": ["spacecraft", "earth"], "fuel_types": ["solid"], "gravity_types": ["microgravity"], "sensors": ["thermocouple", "camera", "smoke", "heat flux"]},
    "PSI-100": {"phases": ["prevention", "detection", "suppression"], "environments": ["spacecraft", "earth"], "fuel_types": ["solid"], "gravity_types": ["microgravity"], "sensors": ["thermocouple", "camera", "smoke", "heat flux"]},
    "PSI-101": {"phases": ["detection"], "environments": ["spacecraft"], "fuel_types": [], "gravity_types": ["microgravity"], "sensors": ["aerosol", "smoke", "particle"]},
    "PSI-102": {"phases": ["detection"], "environments": ["spacecraft"], "fuel_types": [], "gravity_types": ["microgravity"], "sensors": ["aerosol", "smoke", "particle"]},
    "PSI-106": {"phases": ["prevention"], "environments": ["spacecraft"], "fuel_types": ["gas"], "gravity_types": ["microgravity"], "sensors": ["thermocouple", "camera", "radiometer"]},
    "PSI-107": {"phases": ["prevention"], "environments": ["spacecraft"], "fuel_types": ["gas"], "gravity_types": ["microgravity"], "sensors": ["camera", "radiometer", "thermocouple"]},
    "PSI-115": {"phases": ["detection"], "environments": ["spacecraft"], "fuel_types": [], "gravity_types": ["microgravity"], "sensors": ["aerosol", "smoke", "particle"]},
    "PSI-117": {"phases": ["prevention"], "environments": ["spacecraft"], "fuel_types": ["liquid"], "gravity_types": ["microgravity"], "sensors": ["thermocouple", "camera"]},
    "PSI-142": {"phases": ["prevention"], "environments": ["spacecraft"], "fuel_types": ["liquid"], "gravity_types": ["microgravity"], "sensors": ["thermocouple", "camera", "radiometer"]},
    "PSI-159": {"phases": ["prevention"], "environments": ["spacecraft"], "fuel_types": ["gas"], "gravity_types": ["microgravity"], "sensors": ["thermocouple", "camera", "radiometer"]},
}


def clean_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        return "\n".join(clean_text(v) for v in value if v)
    if isinstance(value, dict):
        for key in ("annotationValue", "value", "name", "title"):
            if value.get(key):
                return clean_text(value[key])
        return ""
    text = str(value)
    text = text.replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def first_sentences(text: str, count: int = 3, max_chars: int = 900) -> str:
    text = clean_text(text)
    if not text:
        return ""
    # Split on sentence endings while keeping abbreviations reasonably intact.
    parts = re.split(r"(?<=[.!?])\s+", text)
    out: list[str] = []
    for part in parts:
        if not part.strip():
            continue
        out.append(part.strip())
        if len(out) >= count:
            break
    result = " ".join(out)
    if len(result) > max_chars:
        result = result[: max_chars - 1].rsplit(" ", 1)[0] + "…"
    return result


def extract_sentences(text: str, needles: list[str], limit: int = 3) -> list[str]:
    text = clean_text(text)
    if not text:
        return []
    parts = re.split(r"(?<=[.!?])\s+", text)
    hits: list[str] = []
    for part in parts:
        low = part.lower()
        if any(needle in low for needle in needles):
            cleaned = part.strip()
            if len(cleaned) > 40 and cleaned not in hits:
                hits.append(cleaned)
        if len(hits) >= limit:
            break
    return hits


def classify(text: str, mapping: dict[str, list[str]]) -> list[str]:
    low = text.lower()
    found: list[str] = []
    for label, needles in mapping.items():
        if any(needle in low for needle in needles):
            found.append(label)
    return found


def extract_sensors(text: str) -> list[str]:
    low = text.lower()
    return [sensor for sensor in SENSOR_KEYWORDS if sensor in low]


def split_keywords(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, (list, dict)):
        text = clean_text(value)
    else:
        # Preserve the original separators: PSI uses multiple spaces between
        # keywords, and clean_text() would collapse them before splitting.
        text = str(value).replace("\r", "\n")
    if not text:
        return []
    parts = re.split(r"\s{2,}|[;\n]", text)
    out: list[str] = []
    for part in parts:
        part = clean_text(part).strip(" ,.")
        if part and part.lower() not in STOPWORDS and len(part) > 2 and part not in out:
            out.append(part)
    return out


def split_people(value: Any) -> list[dict[str, str]]:
    people = []
    if not isinstance(value, list):
        return people
    for person in value:
        if not isinstance(person, dict):
            continue
        name = " ".join(
            part
            for part in [
                clean_text(person.get("firstName")),
                clean_text(person.get("midInitials")),
                clean_text(person.get("lastName")),
            ]
            if part
        ).strip()
        if not name:
            continue
        roles = person.get("roles") or []
        role = ""
        if roles and isinstance(roles, list):
            role = clean_text(roles[0])
        people.append(
            {
                "name": name,
                "affiliation": clean_text(person.get("affiliation")),
                "role": role,
                "email": clean_text(person.get("email")),
            }
        )
    return people


def normalize_publication(pub: Any) -> dict[str, Any] | None:
    if not isinstance(pub, dict):
        return None
    title = clean_text(pub.get("title"))
    if not title:
        return None
    return {
        "title": title,
        "authors": clean_text(pub.get("authorList")),
        "doi": clean_text(pub.get("doi")),
        "pubMedID": clean_text(pub.get("pubMedID")),
        "url": f"https://doi.org/{clean_text(pub.get('doi'))}" if pub.get("doi") else "",
    }


def normalize_hardware(value: Any) -> list[str]:
    items = value if isinstance(value, list) else [value]
    out: list[str] = []
    for item in items:
        text = clean_text(item)
        if text and text not in out:
            out.append(text)
    return out


def translate_es(text: str, cache: dict[str, str], client: httpx.Client) -> str:
    text = clean_text(text)
    if not text:
        return ""
    if text in cache:
        return cache[text]
    # Keep translation requests within a safe length.
    chunks = []
    remaining = text
    while remaining:
        if len(remaining) <= 1800:
            chunks.append(remaining)
            break
        cut = remaining.rfind(". ", 0, 1800)
        if cut < 200:
            cut = remaining.rfind(" ", 0, 1800)
        if cut < 0:
            cut = 1800
        chunks.append(remaining[: cut + 1])
        remaining = remaining[cut + 1 :]
    translated_chunks: list[str] = []
    try:
        for chunk in chunks:
            response = client.get(
                TRANSLATE_URL,
                params={"client": "gtx", "sl": "en", "tl": "es", "dt": "t", "q": chunk},
                timeout=30,
            )
            response.raise_for_status()
            payload = response.json()
            translated_chunks.append("".join(segment[0] for segment in payload[0] if segment and segment[0]))
            time.sleep(0.15)
    except Exception:
        return text
    result = " ".join(translated_chunks).strip()
    cache[text] = result
    return result


def fetch_search(client: httpx.Client) -> list[dict[str, Any]]:
    response = client.get(
        SEARCH_URL,
        params={
            "source": "psi",
            "type": "investigation",
            "ffield": "Research Area",
            "fvalue": RESEARCH_AREA,
            "size": 100,
        },
        timeout=60,
    )
    response.raise_for_status()
    payload = response.json()
    return [hit["_source"] for hit in payload.get("hits", {}).get("hits", [])]


def fetch_detail(client: httpx.Client, accession: str) -> dict[str, Any]:
    response = client.get(f"{PSI_BASE}/geode-py/ws/repo/investigations/{accession}", timeout=60)
    response.raise_for_status()
    return response.json()


def build_investigation(source: dict[str, Any], detail: dict[str, Any], cache: dict[str, str], client: httpx.Client) -> dict[str, Any]:
    accession = clean_text(detail.get("accession") or source.get("Accession"))
    title = clean_text(detail.get("title") or source.get("Title"))
    acronym = clean_text(detail.get("investigationAcronym") or source.get("Acronym"))
    objective = clean_text(detail.get("objective") or source.get("Objectives"))
    approach = clean_text(detail.get("approach") or source.get("Approach"))
    impacts = clean_text(detail.get("researchImpacts"))
    description = clean_text(detail.get("description"))
    keywords = split_keywords(source.get("Keywords"))
    hardware = normalize_hardware(detail.get("experimentHardware"))
    publications = [
        pub
        for pub in (normalize_publication(p) for p in (detail.get("publications") or []))
        if pub
    ]
    contacts = split_people(detail.get("contacts"))
    text_for_classification = " ".join([title, objective, approach, impacts, description, " ".join(keywords), " ".join(hardware)])

    curated = CURATED_CLASSIFICATION.get(accession)
    if curated:
        phases = curated["phases"]
        environments = curated["environments"]
        fuel_types = curated["fuel_types"]
        gravity_types = curated["gravity_types"]
        sensors = curated["sensors"]
        classification_source = "curated"
    else:
        phases = classify(text_for_classification, PHASE_KEYWORDS)
        environments = classify(text_for_classification, ENVIRONMENT_KEYWORDS)
        fuel_types = classify(text_for_classification, FUEL_KEYWORDS)
        gravity_types = classify(text_for_classification, GRAVITY_KEYWORDS)
        sensors = extract_sensors(text_for_classification)
        classification_source = "keyword"

    # A simple, explainable relevance score. It is intentionally not a black box.
    score = 0.45
    score += 0.15 * min(len(phases), 3)
    score += 0.10 if "spacecraft" in environments else 0
    score += 0.05 if "earth" in environments else 0
    score += 0.04 if publications else 0
    score += 0.03 if detail.get("experimentalTable") else 0
    score = round(min(score, 0.99), 2)

    summary_en = first_sentences(objective, 2) or first_sentences(approach, 2) or first_sentences(description, 2)
    if impacts:
        summary_en = f"{summary_en} {first_sentences(impacts, 1)}".strip()
    key_findings = extract_sentences(impacts or approach, ["found", "showed", "observed", "demonstrated", "result", "revealed", "measured", "indicated"], 3)
    if not key_findings:
        key_findings = [first_sentences(impacts, 2)] if impacts else []
    # Avoid promoting generic mission-benefit sentences to limitations. Only
    # keep explicit caveats that are not already used as findings or summary.
    limitations = extract_sentences(
        impacts or approach,
        ["limited", "further study", "further work", "not yet", "remains unknown", "needs", "uncertainty", "constraint"],
        2,
    )
    limitations = [
        item
        for item in limitations
        if item not in key_findings and item not in summary_en
    ]

    title_es = translate_es(title, cache, client) if title else ""
    summary_es = translate_es(summary_en, cache, client) if summary_en else ""
    key_findings_es = [translate_es(item, cache, client) for item in key_findings]
    limitations_es = [translate_es(item, cache, client) for item in limitations]

    experimental_table = detail.get("experimentalTable")
    experimental_table_info = None
    if isinstance(experimental_table, dict):
        experimental_table_info = {
            "file_name": clean_text(experimental_table.get("file_name")),
            "file_size": experimental_table.get("file_size"),
            "remote_url": clean_text(experimental_table.get("remote_url")),
            "restricted": bool(experimental_table.get("restricted")),
        }

    return {
        "accession": accession,
        "title": title,
        "title_es": title_es,
        "acronym": acronym,
        "research_area": clean_text(detail.get("researchArea") or source.get("Research Area")),
        "sub_research_area": clean_text(detail.get("subResearchArea") or source.get("SubResearch Area")),
        "project_type": clean_text(detail.get("projectType") or source.get("Project Type")),
        "flight_platform": clean_text(detail.get("flightProgram") or source.get("Flight Platform")),
        "start_date": clean_text(detail.get("investigationStartDate") or source.get("Investigation Start Date")),
        "end_date": clean_text(detail.get("investigationEndDate") or source.get("Investigation End Date")),
        "sponsoring_agency": clean_text(detail.get("sponsoringAgency") or source.get("Sponsoring Agency")),
        "managing_center": clean_text(detail.get("managingNasaCenter") or source.get("Monitoring Center")),
        "objective": objective,
        "approach": approach,
        "research_impacts": impacts,
        "description": description,
        "keywords": keywords,
        "hardware": hardware,
        "publications": publications,
        "contacts": contacts,
        "doi": clean_text(detail.get("doi")),
        "thumbnail": f"{PSI_BASE}/geode-py/ws/investigations/{accession}/image" if accession else "",
        "source_url": f"{PSI_BASE}/physci/repo/data/investigations/{accession}" if accession else "",
        "phases": phases,
        "environments": environments,
        "fuel_types": fuel_types,
        "gravity_types": gravity_types,
        "sensors": sensors,
        "classification_source": classification_source,
        "relevance_score": score,
        "summary_en": summary_en,
        "summary_es": summary_es,
        "key_findings": key_findings,
        "key_findings_es": key_findings_es,
        "limitations": limitations,
        "limitations_es": limitations_es,
        "experimental_table": experimental_table_info,
        "data_readiness": "experimental_table" if experimental_table_info else ("metadata" if objective else "limited"),
    }


def apply_findings_overrides(investigations: list[dict[str, Any]]) -> int:
    """Replace auto-extracted synthesis fields with curated EN/ES text.

    The public PSI metadata is rich on objectives and impacts but does not
    expose experiment tables or result values. Curated overrides keep the
    product honest while preserving the reproducible ingestion pipeline.
    """
    if not FINDINGS_OVERRIDES_PATH.exists():
        return 0
    overrides = json.loads(FINDINGS_OVERRIDES_PATH.read_text(encoding="utf-8"))
    applied = 0
    for item in investigations:
        values = overrides.get(item.get("accession"))
        if not values:
            continue
        for field in ("key_findings", "key_findings_es", "limitations", "limitations_es"):
            item[field] = values[field]
        applied += 1
    return applied


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    cache: dict[str, str] = {}
    if TRANSLATION_CACHE_PATH.exists():
        try:
            cache = json.loads(TRANSLATION_CACHE_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            cache = {}

    with httpx.Client(headers={"User-Agent": "IGNIS-SpaceApps/1.0"}) as client:
        sources = fetch_search(client)
        print(f"Found {len(sources)} investigations")
        investigations: list[dict[str, Any]] = []
        for index, source in enumerate(sources, start=1):
            accession = clean_text(source.get("Accession"))
            if not accession:
                continue
            print(f"[{index}/{len(sources)}] {accession}")
            try:
                detail = fetch_detail(client, accession)
            except Exception as exc:
                print(f"  ! detail failed: {exc}")
                detail = {}
            raw_path = RAW_DIR / f"{accession}.json"
            raw_path.write_text(json.dumps({"source": source, "detail": detail}, indent=2, ensure_ascii=False), encoding="utf-8")
            try:
                investigation = build_investigation(source, detail, cache, client)
            except Exception as exc:
                print(f"  ! normalization failed: {exc}")
                continue
            investigations.append(investigation)
            # Persist the translation cache incrementally.
            TRANSLATION_CACHE_PATH.write_text(json.dumps(cache, indent=2, ensure_ascii=False), encoding="utf-8")
            time.sleep(0.1)

    investigations.sort(key=lambda item: (item.get("relevance_score", 0), item.get("accession", "")), reverse=True)
    curated_count = apply_findings_overrides(investigations)
    snapshot = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "NASA Physical Sciences Informatics (PSI)",
        "source_url": PSI_BASE,
        "research_area": "Combustion Science",
        "count": len(investigations),
        "investigations": investigations,
    }
    SNAPSHOT_PATH.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {SNAPSHOT_PATH} with {len(investigations)} investigations")
    print(f"Curated findings/limitations applied: {curated_count}")
    print(f"Translation cache: {len(cache)} entries")


if __name__ == "__main__":
    main()
