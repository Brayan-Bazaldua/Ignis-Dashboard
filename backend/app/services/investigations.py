from __future__ import annotations

import math
import re
from collections import Counter
from typing import Any

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models import Investigation

PHASES = ["prevention", "detection", "suppression"]
ENVIRONMENTS = ["spacecraft", "lunar_base", "mars_base", "rover", "partial_gravity", "earth"]

PHASE_LABELS = {
    "prevention": {"es": "Prevención", "en": "Prevention"},
    "detection": {"es": "Detección", "en": "Detection"},
    "suppression": {"es": "Supresión", "en": "Suppression"},
}
ENVIRONMENT_LABELS = {
    "spacecraft": {"es": "Nave / estación", "en": "Spacecraft / station"},
    "lunar_base": {"es": "Base lunar", "en": "Lunar base"},
    "mars_base": {"es": "Base marciana", "en": "Mars base"},
    "rover": {"es": "Rover presurizado", "en": "Pressurized rover"},
    "partial_gravity": {"es": "Gravedad parcial", "en": "Partial gravity"},
    "earth": {"es": "Tierra", "en": "Earth"},
}
FUEL_LABELS = {
    "solid": {"es": "Sólido", "en": "Solid"},
    "liquid": {"es": "Líquido", "en": "Liquid"},
    "gas": {"es": "Gaseoso", "en": "Gas"},
}
GRAVITY_LABELS = {
    "microgravity": {"es": "Microgravedad", "en": "Microgravity"},
    "normal_gravity": {"es": "Gravedad terrestre", "en": "Normal gravity"},
    "partial_gravity": {"es": "Gravedad parcial", "en": "Partial gravity"},
}


def _tag_patterns(q: str) -> list[str]:
    """Accept PSI-106, psi 106, psi_106 and PSI106 as the same tag."""

    raw = q.strip()
    normalized = re.sub(r"\bpsi[\s\-_#]*(\d+)\b", r"PSI-\1", raw, flags=re.IGNORECASE)
    compact = re.sub(r"\s+", "", normalized)
    return list({f"%{raw}%", f"%{normalized}%", f"%{compact}%"}) if raw else []


def _text_query(query, q: str):
    raw = q.strip()
    pattern = f"%{raw}%"
    tag_clauses = [Investigation.accession.ilike(value) for value in _tag_patterns(raw)]
    return query.where(
        or_(
            Investigation.title.ilike(pattern),
            Investigation.title_es.ilike(pattern),
            Investigation.acronym.ilike(pattern),
            Investigation.summary_en.ilike(pattern),
            Investigation.summary_es.ilike(pattern),
            Investigation.objective.ilike(pattern),
            Investigation.approach.ilike(pattern),
            Investigation.research_impacts.ilike(pattern),
            Investigation.description.ilike(pattern),
            *tag_clauses,
        )
    )


def list_investigations(
    db: Session,
    q: str = "",
    phase: str = "",
    environment: str = "",
    fuel_type: str = "",
    gravity_type: str = "",
    readiness: str = "",
    min_score: float = 0.0,
    sort: str = "relevance",
    limit: int = 50,
    offset: int = 0,
) -> tuple[int, list[Investigation]]:
    query = select(Investigation)
    if q.strip():
        query = _text_query(query, q)
    if phase:
        query = query.where(Investigation.phases.contains([phase]))
    if environment:
        if environment == "partial_gravity":
            query = query.where(Investigation.gravity_types.contains(["partial_gravity"]))
        else:
            query = query.where(Investigation.environments.contains([environment]))
    if fuel_type:
        query = query.where(Investigation.fuel_types.contains([fuel_type]))
    if gravity_type:
        query = query.where(Investigation.gravity_types.contains([gravity_type]))
    if readiness:
        query = query.where(Investigation.data_readiness == readiness)
    if min_score:
        query = query.where(Investigation.relevance_score >= min_score)

    if sort == "title":
        query = query.order_by(Investigation.title.asc())
    elif sort == "date_desc":
        query = query.order_by(Investigation.start_date.desc().nullslast())
    elif sort == "score_asc":
        query = query.order_by(Investigation.relevance_score.asc())
    else:
        query = query.order_by(Investigation.relevance_score.desc(), Investigation.accession.asc())

    all_rows = list(db.scalars(query).all())
    total = len(all_rows)
    return total, all_rows[offset : offset + limit]


def get_investigation(db: Session, accession: str) -> Investigation | None:
    return db.get(Investigation, accession)


def _jaccard(a: set[str], b: set[str]) -> float:
    if not a and not b:
        return 0.0
    return len(a & b) / max(1, len(a | b))


def similar_investigations(db: Session, accession: str, limit: int = 4) -> list[dict[str, Any]]:
    base = db.get(Investigation, accession)
    if not base:
        return []
    all_rows = list(db.scalars(select(Investigation)).all())
    scored: list[dict[str, Any]] = []
    for item in all_rows:
        if item.accession == accession:
            continue
        phase_score = _jaccard(set(base.phases or []), set(item.phases or []))
        env_score = _jaccard(set(base.environments or []), set(item.environments or []))
        fuel_score = _jaccard(set(base.fuel_types or []), set(item.fuel_types or []))
        gravity_score = _jaccard(set(base.gravity_types or []), set(item.gravity_types or []))
        sensor_score = _jaccard(set(base.sensors or []), set(item.sensors or []))
        keyword_score = _jaccard(
            {k.lower() for k in (base.keywords or [])},
            {k.lower() for k in (item.keywords or [])},
        )
        similarity = (
            0.30 * phase_score
            + 0.18 * env_score
            + 0.15 * fuel_score
            + 0.10 * gravity_score
            + 0.12 * sensor_score
            + 0.15 * keyword_score
        )
        reasons: list[str] = []
        if phase_score > 0:
            reasons.append("Fases de seguridad compartidas")
        if env_score > 0:
            reasons.append("Mismo entorno de aplicación")
        if fuel_score > 0:
            reasons.append("Tipo de combustible compartido")
        if gravity_score > 0:
            reasons.append("Régimen de gravedad compartido")
        if sensor_score > 0:
            reasons.append("Sensores o mediciones en común")
        if keyword_score > 0:
            reasons.append("Temas científicos relacionados")
        scored.append(
            {
                "item": item,
                "similarity": round(similarity, 3),
                "reasons": reasons or ["Coincidencia temática general"],
            }
        )
    scored.sort(key=lambda entry: entry["similarity"], reverse=True)
    return scored[:limit]


def compare_investigations(db: Session, accessions: list[str]) -> dict[str, Any]:
    items = [db.get(Investigation, accession) for accession in accessions]
    items = [item for item in items if item is not None]
    shared: dict[str, list[str]] = {}
    similarities: list[str] = []
    differences: list[str] = []

    dimensions = {
        "phases": "fase de seguridad",
        "environments": "entorno",
        "fuel_types": "tipo de combustible",
        "gravity_types": "régimen de gravedad",
        "sensors": "sensores",
    }
    for field, label in dimensions.items():
        sets = [set(getattr(item, field) or []) for item in items]
        common = set.intersection(*sets) if sets else set()
        if common:
            shared[field] = sorted(common)
            similarities.append(f"Comparten {label}: {', '.join(sorted(common))}.")
        union = set.union(*sets) if sets else set()
        if union - common:
            differences.append(
                f"Difieren en {label}: " + ", ".join(sorted(union - common)) + "."
            )

    if items:
        titles = ", ".join(item.acronym or item.accession for item in items)
        differences.append(
            f"La comparación cubre {len(items)} investigaciones ({titles}); "
            "los resultados deben interpretarse dentro de sus condiciones experimentales."
        )
    return {
        "items": items,
        "similarities": similarities,
        "differences": differences,
        "shared_attributes": shared,
    }


def _evidence_level(count: int) -> str:
    if count <= 0:
        return "none"
    if count == 1:
        return "low"
    if count <= 3:
        return "medium"
    return "high"


def gap_matrix(db: Session) -> dict[str, Any]:
    rows = list(db.scalars(select(Investigation)).all())
    cells = []
    for environment in ENVIRONMENTS:
        for phase in PHASES:
            matches = []
            for item in rows:
                if phase not in (item.phases or []):
                    continue
                if environment == "partial_gravity":
                    if "partial_gravity" in (item.gravity_types or []):
                        matches.append(item.accession)
                elif environment in (item.environments or []):
                    matches.append(item.accession)
            cells.append(
                {
                    "phase": phase,
                    "environment": environment,
                    "count": len(matches),
                    "accessions": matches,
                    "evidence_level": _evidence_level(len(matches)),
                }
            )
    cells_sorted = sorted(cells, key=lambda cell: cell["count"], reverse=True)
    return {
        "phases": PHASES,
        "environments": ENVIRONMENTS,
        "cells": cells,
        "total": len(rows),
        "strongest": cells_sorted[:5],
        "gaps": [cell for cell in cells if cell["count"] == 0],
    }


def _counter(values: list[str]) -> list[dict[str, Any]]:
    return [{"value": value, "count": count} for value, count in Counter(values).most_common()]


def metadata(db: Session) -> dict[str, Any]:
    rows = list(db.scalars(select(Investigation)).all())
    phases = [phase for item in rows for phase in (item.phases or [])]
    environments = [env for item in rows for env in (item.environments or [])]
    fuels = [fuel for item in rows for fuel in (item.fuel_types or [])]
    gravity = [value for item in rows for value in (item.gravity_types or [])]
    sensors = [sensor for item in rows for sensor in (item.sensors or [])]
    hardware = [value for item in rows for value in (item.hardware or [])]
    publications = sum(len(item.publications or []) for item in rows)
    tables = sum(1 for item in rows if item.experimental_table)
    return {
        "count": len(rows),
        "publications": publications,
        "experimental_tables": tables,
        "phases": [
            {"value": item["value"], "count": item["count"], "label": PHASE_LABELS.get(item["value"], {})}
            for item in _counter(phases)
        ],
        "environments": [
            {"value": item["value"], "count": item["count"], "label": ENVIRONMENT_LABELS.get(item["value"], {})}
            for item in _counter(environments)
        ],
        "fuel_types": [
            {"value": item["value"], "count": item["count"], "label": FUEL_LABELS.get(item["value"], {})}
            for item in _counter(fuels)
        ],
        "gravity_types": [
            {"value": item["value"], "count": item["count"], "label": GRAVITY_LABELS.get(item["value"], {})}
            for item in _counter(gravity)
        ],
        "sensors": _counter(sensors)[:20],
        "hardware": _counter(hardware)[:20],
        "data_readiness": _counter([item.data_readiness for item in rows]),
        "source": "NASA Physical Sciences Informatics (PSI)",
        "source_url": "https://psi.nasa.gov/",
        "research_area": "Combustion Science",
    }


def search_text(item: Investigation) -> str:
    return " ".join(
        [
            item.accession or "",
            item.title or "",
            item.title_es or "",
            item.acronym or "",
            item.summary_en or "",
            item.summary_es or "",
            item.objective or "",
            item.approach or "",
            item.research_impacts or "",
            " ".join(item.keywords or []),
            " ".join(item.hardware or []),
        ]
    ).lower()


def tokenize(text: str) -> list[str]:
    tokens = re.findall(r"[a-z0-9áéíóúüñ][a-z0-9áéíóúüñ\-]{2,}", text.lower())
    stop = {
        "para", "como", "sobre", "entre", "desde", "hasta", "este", "esta", "estos",
        "estas", "con", "por", "una", "uno", "unos", "unas", "que", "del", "las",
        "los", "the", "and", "for", "with", "from", "that", "this", "are", "was",
        "were", "have", "has", "been", "into", "their", "about", "which", "will",
    }
    return [token for token in tokens if token not in stop]


def bm25_scores(question: str, items: list[Investigation]) -> list[tuple[Investigation, float]]:
    """Small, dependency-free BM25 implementation for the 24-record MVP."""

    query_tokens = tokenize(question)
    if not query_tokens:
        return [(item, 0.0) for item in items]
    docs = [tokenize(search_text(item)) for item in items]
    n_docs = len(docs)
    avg_len = sum(len(doc) for doc in docs) / max(1, n_docs)
    doc_freq: Counter[str] = Counter()
    for doc in docs:
        doc_freq.update(set(doc))
    k1, b = 1.5, 0.75
    results: list[tuple[Investigation, float]] = []
    for item, doc in zip(items, docs, strict=False):
        score = 0.0
        counts = Counter(doc)
        for token in query_tokens:
            if token not in counts:
                continue
            idf = math.log(1 + (n_docs - doc_freq[token] + 0.5) / (doc_freq[token] + 0.5))
            tf = counts[token]
            score += idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * len(doc) / max(avg_len, 1)))
        results.append((item, score))
    results.sort(key=lambda entry: entry[1], reverse=True)
    return results
