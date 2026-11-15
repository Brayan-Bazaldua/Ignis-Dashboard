from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import (
    ChatRequest,
    ChatResponse,
    CompareResponse,
    GapMatrix,
    InvestigationCard,
    InvestigationDetail,
    InvestigationList,
    ScienceRequest,
    ScienceResponse,
    ScenarioPreset,
    SimilarInvestigation,
)
from app.services.ai import answer_question
from app.services.investigations import (
    ENVIRONMENTS,
    PHASES,
    compare_investigations,
    gap_matrix,
    get_investigation,
    list_investigations,
    metadata,
    similar_investigations,
)
from app.services.science import calculate_scenario, preset_payload

router = APIRouter(prefix="/api")


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ignis-api"}


@router.get("/investigations", response_model=InvestigationList)
def investigations(
    q: str = "",
    phase: str = "",
    environment: str = "",
    fuel_type: str = "",
    gravity_type: str = "",
    readiness: str = "",
    min_score: float = Query(0.0, ge=0.0, le=1.0),
    sort: Literal["relevance", "title", "date_desc", "score_asc"] = "relevance",
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> InvestigationList:
    total, rows = list_investigations(
        db,
        q=q,
        phase=phase,
        environment=environment,
        fuel_type=fuel_type,
        gravity_type=gravity_type,
        readiness=readiness,
        min_score=min_score,
        sort=sort,
        limit=limit,
        offset=offset,
    )
    return InvestigationList(
        total=total,
        items=[InvestigationCard.model_validate(row) for row in rows],
        query=q,
        filters={
            "phase": phase,
            "environment": environment,
            "fuel_type": fuel_type,
            "gravity_type": gravity_type,
            "readiness": readiness,
        },
    )


@router.get("/investigations/{accession}", response_model=InvestigationDetail)
def investigation_detail(accession: str, db: Session = Depends(get_db)) -> InvestigationDetail:
    item = get_investigation(db, accession)
    if not item:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return InvestigationDetail.model_validate(item)


@router.get("/investigations/{accession}/similar", response_model=list[SimilarInvestigation])
def similar(accession: str, limit: int = Query(4, ge=1, le=8), db: Session = Depends(get_db)):
    entries = similar_investigations(db, accession, limit=limit)
    return [
        SimilarInvestigation(
            item=InvestigationCard.model_validate(entry["item"]),
            similarity=entry["similarity"],
            reasons=entry["reasons"],
        )
        for entry in entries
    ]


@router.get("/compare", response_model=CompareResponse)
def compare(ids: str = Query(..., description="Comma-separated PSI accessions"), db: Session = Depends(get_db)):
    accessions = [value.strip() for value in ids.split(",") if value.strip()]
    if len(accessions) < 2:
        raise HTTPException(status_code=400, detail="At least two accessions are required")
    if len(accessions) > 4:
        raise HTTPException(status_code=400, detail="At most four accessions are supported")
    payload = compare_investigations(db, accessions)
    return CompareResponse(
        items=[InvestigationDetail.model_validate(item) for item in payload["items"]],
        similarities=payload["similarities"],
        differences=payload["differences"],
        shared_attributes=payload["shared_attributes"],
    )


@router.get("/gaps", response_model=GapMatrix)
def gaps(db: Session = Depends(get_db)) -> GapMatrix:
    return GapMatrix.model_validate(gap_matrix(db))


@router.get("/meta")
def meta(db: Session = Depends(get_db)) -> dict:
    return {
        **metadata(db),
        "phases_order": PHASES,
        "environments_order": ENVIRONMENTS,
    }


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db)) -> ChatResponse:
    return answer_question(db, request)


@router.get("/science/presets", response_model=list[ScenarioPreset])
def science_presets() -> list[ScenarioPreset]:
    return [ScenarioPreset.model_validate(item) for item in preset_payload()]


@router.post("/science/scenario", response_model=ScienceResponse)
def science_scenario(request: ScienceRequest) -> ScienceResponse:
    return calculate_scenario(request)
