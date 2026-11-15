from __future__ import annotations

import re
from typing import Any

import httpx
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import ChatLog, Investigation
from app.schemas import ChatRequest, ChatResponse, Citation
from app.services.investigations import (
    bm25_scores,
    compare_investigations,
    get_investigation,
    tokenize,
)
from sqlalchemy import select

settings = get_settings()

ES_EN_EXPANSIONS = {
    "llama": "flame",
    "llamas": "flames",
    "fuego": "fire",
    "incendio": "fire",
    "incendios": "fires",
    "humo": "smoke",
    "extincion": "extinguishment",
    "extinción": "extinguishment",
    "extinguir": "extinguish",
    "inflamabilidad": "flammability",
    "oxigeno": "oxygen",
    "oxígeno": "oxygen",
    "combustible": "fuel",
    "combustibles": "fuels",
    "gravedad": "gravity",
    "microgravedad": "microgravity",
    "lunar": "lunar",
    "luna": "moon",
    "marte": "mars",
    "marciano": "mars",
    "tripulacion": "crew",
    "tripulación": "crew",
    "nave": "spacecraft",
    "estacion": "station",
    "estación": "station",
    "material": "material",
    "materiales": "materials",
    "sensor": "sensor",
    "sensores": "sensors",
    "medicion": "measurement",
    "medición": "measurement",
    "presion": "pressure",
    "presión": "pressure",
    "flujo": "flow",
    "aire": "air",
    "supresion": "suppression",
    "supresión": "suppression",
    "deteccion": "detection",
    "detección": "detection",
    "prevencion": "prevention",
    "prevención": "prevention",
    "gravedad parcial": "partial gravity",
    "base lunar": "lunar base",
    "rover": "rover",
}

PHASE_HINTS = {
    "detection": ["deteccion", "detección", "detection", "humo", "smoke", "aerosol", "sensor"],
    "suppression": ["supresion", "supresión", "suppression", "extincion", "extinción", "extinguishment", "extinguish", "co2", "helio", "helium", "niebla"],
    "prevention": ["prevencion", "prevención", "prevention", "inflamabilidad", "flammability", "ignicion", "ignition", "material", "oxygen", "oxigeno", "oxígeno"],
}
ENV_HINTS = {
    "lunar_base": ["lunar", "luna", "moon"],
    "mars_base": ["marte", "mars", "marciano"],
    "rover": ["rover"],
    "partial_gravity": ["gravedad parcial", "partial gravity"],
    "earth": ["tierra", "earth", "terrestre"],
    "spacecraft": ["iss", "estacion", "estación", "spacecraft", "nave", "crew", "tripulacion", "tripulación"],
}
FUEL_HINTS = {
    "solid": ["solido", "sólido", "solid", "material"],
    "liquid": ["liquido", "líquido", "liquid", "gota", "droplet"],
    "gas": ["gas", "gaseoso", "gaseous", "metano", "methane", "propano", "propane"],
}

SUGGESTIONS = {
    "es": [
        "¿Qué evidencia existe para diseñar la atmósfera de una base lunar?",
        "Compara BASS-II con Saffire-II.",
        "¿Qué experimentos estudian la detección de humo?",
        "¿Qué investigación respalda la supresión con CO₂ o helio?",
        "¿Dónde están los vacíos de datos para gravedad parcial?",
    ],
    "en": [
        "What evidence exists for designing a lunar base atmosphere?",
        "Compare BASS-II with Saffire-II.",
        "Which experiments study smoke detection?",
        "Which research supports CO₂ or helium suppression?",
        "Where are the data gaps for partial gravity?",
    ],
}


def expand_question(question: str) -> str:
    low = question.lower()
    expansions = [english for spanish, english in ES_EN_EXPANSIONS.items() if spanish in low]
    return f"{question} {' '.join(expansions)}"


def detect_filters(question: str) -> dict[str, str]:
    low = question.lower()
    filters: dict[str, str] = {}
    for phase, hints in PHASE_HINTS.items():
        if any(hint in low for hint in hints):
            filters["phase"] = phase
            break
    for environment, hints in ENV_HINTS.items():
        if any(hint in low for hint in hints):
            filters["environment"] = environment
            break
    for fuel, hints in FUEL_HINTS.items():
        if any(hint in low for hint in hints):
            filters["fuel_type"] = fuel
            break
    return filters


def named_investigations(db: Session, question: str) -> list[Investigation]:
    rows = list(db.scalars(select(Investigation)).all())
    low = question.lower()
    found: list[Investigation] = []
    for item in rows:
        identifiers = [item.accession.lower(), (item.acronym or "").lower()]
        if any(identifier and identifier in low for identifier in identifiers):
            found.append(item)
    # Preserve order and uniqueness.
    seen: set[str] = set()
    unique: list[Investigation] = []
    for item in found:
        if item.accession not in seen:
            seen.add(item.accession)
            unique.append(item)
    return unique


def retrieve(db: Session, question: str, limit: int = 6) -> list[tuple[Investigation, float]]:
    rows = list(db.scalars(select(Investigation)).all())
    expanded = expand_question(question)
    scores = bm25_scores(expanded, rows)
    filters = detect_filters(question)
    boosted: list[tuple[Investigation, float]] = []
    for item, score in scores:
        boost = 0.0
        if filters.get("phase") and filters["phase"] in (item.phases or []):
            boost += 4.0
        if filters.get("environment"):
            if filters["environment"] == "partial_gravity" and "partial_gravity" in (item.gravity_types or []):
                boost += 4.0
            elif filters["environment"] in (item.environments or []):
                boost += 4.0
        if filters.get("fuel_type") and filters["fuel_type"] in (item.fuel_types or []):
            boost += 3.0
        boosted.append((item, score + boost))
    boosted.sort(key=lambda entry: entry[1], reverse=True)
    return boosted[:limit]


def make_citation(item: Investigation, score: float, index: int) -> Citation:
    quote = item.summary_es or item.summary_en or item.objective or item.title
    if len(quote) > 280:
        quote = quote[:277].rsplit(" ", 1)[0] + "…"
    field = "summary_es" if item.summary_es else "summary_en"
    return Citation(
        accession=item.accession,
        title=item.title,
        title_es=item.title_es,
        url=item.source_url,
        quote=quote,
        field=field,
        score=round(max(0.0, min(1.0, 0.35 + score / 20 + index * 0.02)), 3),
    )


def _labels(values: list[str], locale: str) -> str:
    if not values:
        return "no reportado" if locale == "es" else "not reported"
    return ", ".join(values)


def mock_answer(db: Session, request: ChatRequest, retrieved: list[tuple[Investigation, float]]) -> ChatResponse:
    locale = request.locale
    if not retrieved:
        answer = (
            "No encontré evidencia suficientemente específica en el snapshot de PSI. "
            "Prueba con una pregunta sobre inflamabilidad, detección de humo, supresión, "
            "microgravedad, Base Lunar o un experimento concreto."
            if locale == "es"
            else "I could not find sufficiently specific evidence in the PSI snapshot. "
            "Try asking about flammability, smoke detection, suppression, microgravity, "
            "the Lunar Base, or a specific experiment."
        )
        return ChatResponse(
            answer=answer,
            citations=[],
            confidence=0.2,
            provider="mock",
            suggested_questions=SUGGESTIONS[locale],
            mode=request.mode,
            locale=locale,
        )

    citations = [make_citation(item, score, index) for index, (item, score) in enumerate(retrieved[:5])]
    named = named_investigations(db, request.question)
    if len(named) >= 2:
        comparison = compare_investigations(db, [item.accession for item in named[:4]])
        lines = [
            (
                "Comparación de las investigaciones mencionadas:"
                if locale == "es"
                else "Comparison of the mentioned investigations:"
            )
        ]
        for item in comparison["items"]:
            summary = item.summary_es if locale == "es" and item.summary_es else item.summary_en
            lines.append(
                f"\n**{item.acronym or item.accession} — {item.accession}**\n"
                f"{summary}\n"
                f"- {'Fases' if locale == 'es' else 'Phases'}: {_labels(item.phases, locale)}\n"
                f"- {'Entorno' if locale == 'es' else 'Environment'}: {_labels(item.environments, locale)}\n"
                f"- {'Combustible' if locale == 'es' else 'Fuel'}: {_labels(item.fuel_types, locale)}\n"
                f"- {'Gravedad' if locale == 'es' else 'Gravity'}: {_labels(item.gravity_types, locale)}"
            )
        if comparison["similarities"]:
            lines.append("\n**Similitudes:**" if locale == "es" else "\n**Similarities:**")
            lines.extend(f"- {text}" for text in comparison["similarities"])
        if comparison["differences"]:
            lines.append("\n**Diferencias:**" if locale == "es" else "\n**Differences:**")
            lines.extend(f"- {text}" for text in comparison["differences"])
        answer = "\n".join(lines)
        return ChatResponse(
            answer=answer,
            citations=citations,
            confidence=0.86,
            provider="mock",
            suggested_questions=SUGGESTIONS[locale],
            mode=request.mode,
            locale=locale,
        )

    top = retrieved[0][0]
    summary = top.summary_es if locale == "es" and top.summary_es else top.summary_en
    if locale == "es":
        lines = [
            f"Encontré {len(retrieved)} investigaciones relevantes en PSI. La más cercana es **{top.acronym or top.accession} — {top.accession}**.",
            "",
            summary,
            "",
            "**Por qué es relevante para seguridad contra incendios:**",
            f"- Fases: {_labels(top.phases, locale)}.",
            f"- Entorno: {_labels(top.environments, locale)}.",
            f"- Combustible: {_labels(top.fuel_types, locale)}.",
            f"- Gravedad: {_labels(top.gravity_types, locale)}.",
            f"- Sensores: {_labels(top.sensors, locale)}.",
        ]
        if top.key_findings_es or top.key_findings:
            findings = top.key_findings_es if top.key_findings_es else top.key_findings
            lines.extend(["", "**Hallazgos principales:**"])
            lines.extend(f"- {finding}" for finding in findings[:3])
        if top.limitations_es or top.limitations:
            limitations = top.limitations_es if top.limitations_es else top.limitations
            lines.extend(["", "**Limitaciones:**"])
            lines.extend(f"- {limitation}" for limitation in limitations[:2])
        if request.mode == "student":
            lines.extend(
                [
                    "",
                    "**En palabras simples:** la microgravedad cambia cómo se mueve el oxígeno y el calor. Sin flotabilidad, la llama depende más de la difusión y del flujo de aire, por eso los resultados de la Tierra no se pueden copiar directamente al espacio.",
                ]
            )
        lines.extend(
            [
                "",
                "**Otras investigaciones relacionadas:** "
                + ", ".join(f"{item.acronym or item.accession} ({item.accession})" for item, _ in retrieved[1:4]),
                "",
                "**Fuentes:** " + ", ".join(f"[{citation.accession}]" for citation in citations),
            ]
        )
        answer = "\n".join(lines)
    else:
        lines = [
            f"I found {len(retrieved)} relevant PSI investigations. The closest match is **{top.acronym or top.accession} — {top.accession}**.",
            "",
            summary,
            "",
            "**Why it matters for fire safety:**",
            f"- Phases: {_labels(top.phases, locale)}.",
            f"- Environment: {_labels(top.environments, locale)}.",
            f"- Fuel: {_labels(top.fuel_types, locale)}.",
            f"- Gravity: {_labels(top.gravity_types, locale)}.",
            f"- Sensors: {_labels(top.sensors, locale)}.",
        ]
        if top.key_findings:
            lines.extend(["", "**Key findings:**"])
            lines.extend(f"- {finding}" for finding in top.key_findings[:3])
        if top.limitations:
            lines.extend(["", "**Limitations:**"])
            lines.extend(f"- {limitation}" for limitation in top.limitations[:2])
        if request.mode == "student":
            lines.extend(
                [
                    "",
                    "**In plain words:** microgravity changes how oxygen and heat move. Without buoyancy, the flame depends more on diffusion and airflow, so Earth results cannot be copied directly to space.",
                ]
            )
        lines.extend(
            [
                "",
                "**Related investigations:** "
                + ", ".join(f"{item.acronym or item.accession} ({item.accession})" for item, _ in retrieved[1:4]),
                "",
                "**Sources:** " + ", ".join(f"[{citation.accession}]" for citation in citations),
            ]
        )
        answer = "\n".join(lines)

    confidence = round(min(0.95, 0.45 + retrieved[0][1] / 25), 3)
    return ChatResponse(
        answer=answer,
        citations=citations,
        confidence=confidence,
        provider="mock",
        suggested_questions=SUGGESTIONS[locale],
        mode=request.mode,
        locale=locale,
    )


def build_context(retrieved: list[tuple[Investigation, float]]) -> str:
    blocks: list[str] = []
    for item, _ in retrieved:
        blocks.append(
            "\n".join(
                [
                    f"[{item.accession}] {item.acronym or ''} — {item.title}",
                    f"Title (ES): {item.title_es}",
                    f"Summary: {item.summary_en}",
                    f"Summary (ES): {item.summary_es}",
                    f"Objective: {item.objective}",
                    f"Approach: {item.approach}",
                    f"Research impacts: {item.research_impacts}",
                    f"Phases: {', '.join(item.phases or [])}",
                    f"Environments: {', '.join(item.environments or [])}",
                    f"Fuels: {', '.join(item.fuel_types or [])}",
                    f"Gravity: {', '.join(item.gravity_types or [])}",
                    f"Sensors: {', '.join(item.sensors or [])}",
                    f"Key findings: {' | '.join(item.key_findings or [])}",
                    f"Limitations: {' | '.join(item.limitations or [])}",
                    f"URL: {item.source_url}",
                ]
            )
        )
    return "\n\n---\n\n".join(blocks)


def llm_answer(request: ChatRequest, retrieved: list[tuple[Investigation, float]], citations: list[Citation]) -> str | None:
    if settings.llm_provider == "mock":
        return None
    language = "español" if request.locale == "es" else "English"
    mode = "estudiante de pregrado" if request.mode == "student" else "ingeniero aeroespacial"
    prompt = f"""Eres IGNIS, un copiloto científico especializado en combustión en baja gravedad y seguridad contra incendios en exploración espacial.
Responde en {language}. Adapta la explicación a un {mode}.
Usa únicamente el contexto proporcionado. No inventes datos. Cita las investigaciones con el formato [PSI-XX].
Si el contexto no responde la pregunta, dilo explícitamente y sugiere qué evidencia falta.
Incluye una sección breve de implicaciones para seguridad contra incendios y otra de limitaciones.

Pregunta: {request.question}

Contexto:
{build_context(retrieved)}
"""
    try:
        if settings.llm_provider == "gemini" and settings.gemini_api_key:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent"
            response = httpx.post(
                url,
                params={"key": settings.gemini_api_key},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.2, "maxOutputTokens": 1200},
                },
                timeout=90,
            )
            response.raise_for_status()
            return response.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
        if settings.llm_provider == "openai" and settings.openai_api_key:
            response = httpx.post(
                f"{settings.openai_base_url.rstrip('/')}/chat/completions",
                headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                json={
                    "model": settings.openai_model,
                    "temperature": 0.2,
                    "messages": [
                        {"role": "system", "content": "You are IGNIS, a scientific fire-safety copilot."},
                        {"role": "user", "content": prompt},
                    ],
                },
                timeout=90,
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"].strip()
        if settings.llm_provider == "ollama":
            response = httpx.post(
                f"{settings.ollama_base_url.rstrip('/')}/api/chat",
                json={
                    "model": settings.ollama_model,
                    "stream": False,
                    "messages": [
                        {"role": "system", "content": "You are IGNIS, a scientific fire-safety copilot."},
                        {"role": "user", "content": prompt},
                    ],
                },
                timeout=180,
            )
            response.raise_for_status()
            return response.json()["message"]["content"].strip()
    except Exception:
        return None
    return None


def answer_question(db: Session, request: ChatRequest) -> ChatResponse:
    retrieved = retrieve(db, request.question, limit=6)
    mock = mock_answer(db, request, retrieved)
    if settings.llm_provider != "mock" and request.accession:
        named = get_investigation(db, request.accession)
        if named:
            retrieved = [(named, 10.0)] + [(item, score) for item, score in retrieved if item.accession != named.accession]
    llm_text = llm_answer(request, retrieved, mock.citations)
    if llm_text:
        mock.answer = llm_text
        mock.provider = settings.llm_provider
        mock.confidence = max(mock.confidence, 0.8)
    log = ChatLog(
        question=request.question,
        answer=mock.answer,
        locale=request.locale,
        mode=request.mode,
        provider=mock.provider,
        citations=[citation.model_dump() for citation in mock.citations],
    )
    db.add(log)
    db.commit()
    return mock


def token_debug(question: str) -> list[str]:
    return tokenize(expand_question(question))


def extract_accession(question: str) -> str | None:
    match = re.search(r"PSI-\d+", question.upper())
    return match.group(0) if match else None
