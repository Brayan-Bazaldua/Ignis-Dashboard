from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class InvestigationCard(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    accession: str
    title: str
    title_es: str = ""
    acronym: str = ""
    research_area: str = ""
    sub_research_area: str = ""
    summary_en: str = ""
    summary_es: str = ""
    phases: list[str] = Field(default_factory=list)
    environments: list[str] = Field(default_factory=list)
    fuel_types: list[str] = Field(default_factory=list)
    gravity_types: list[str] = Field(default_factory=list)
    sensors: list[str] = Field(default_factory=list)
    relevance_score: float = 0.0
    data_readiness: str = "metadata"
    thumbnail: str = ""
    source_url: str = ""
    start_date: str = ""
    end_date: str = ""
    publications_count: int = 0


class Publication(BaseModel):
    title: str = ""
    authors: str = ""
    doi: str = ""
    pubMedID: str = ""
    url: str = ""


class Contact(BaseModel):
    name: str = ""
    affiliation: str = ""
    role: str = ""
    email: str = ""


class InvestigationDetail(InvestigationCard):
    project_type: str = ""
    flight_platform: str = ""
    sponsoring_agency: str = ""
    managing_center: str = ""
    objective: str = ""
    approach: str = ""
    research_impacts: str = ""
    description: str = ""
    keywords: list[str] = Field(default_factory=list)
    hardware: list[str] = Field(default_factory=list)
    publications: list[Publication] = Field(default_factory=list)
    contacts: list[Contact] = Field(default_factory=list)
    key_findings: list[str] = Field(default_factory=list)
    key_findings_es: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    limitations_es: list[str] = Field(default_factory=list)
    experimental_table: dict[str, Any] | None = None
    doi: str = ""
    classification_source: str = "keyword"


class InvestigationList(BaseModel):
    total: int
    items: list[InvestigationCard]
    query: str = ""
    filters: dict[str, str] = Field(default_factory=dict)


class GapCell(BaseModel):
    phase: str
    environment: str
    count: int
    accessions: list[str] = Field(default_factory=list)
    evidence_level: Literal["none", "low", "medium", "high"] = "none"


class GapMatrix(BaseModel):
    phases: list[str]
    environments: list[str]
    cells: list[GapCell]
    total: int
    strongest: list[GapCell] = Field(default_factory=list)
    gaps: list[GapCell] = Field(default_factory=list)


class SimilarInvestigation(BaseModel):
    item: InvestigationCard
    similarity: float
    reasons: list[str] = Field(default_factory=list)


class CompareResponse(BaseModel):
    items: list[InvestigationDetail]
    similarities: list[str]
    differences: list[str]
    shared_attributes: dict[str, list[str]] = Field(default_factory=dict)


class Citation(BaseModel):
    accession: str
    title: str
    title_es: str = ""
    url: str = ""
    quote: str = ""
    field: str = ""
    score: float = 0.0


class ChatRequest(BaseModel):
    question: str = Field(min_length=2, max_length=2000)
    locale: Literal["es", "en"] = "es"
    mode: Literal["student", "engineer"] = "engineer"
    accession: str | None = None


class ChatResponse(BaseModel):
    answer: str
    citations: list[Citation]
    confidence: float
    provider: str
    suggested_questions: list[str] = Field(default_factory=list)
    mode: str = "engineer"
    locale: str = "es"


class ScienceRequest(BaseModel):
    o2_fraction: float = Field(default=0.21, ge=0.01, le=1.0)
    pressure_pa: float = Field(default=101325, gt=0)
    temperature_k: float = Field(default=298.15, gt=0)
    gravity_m_s2: float = Field(default=9.81, ge=0)
    flow_velocity_m_s: float = Field(default=0.05, ge=0)
    length_m: float = Field(default=0.05, gt=0)
    beta_1_k: float = Field(default=0.0033, gt=0)
    delta_t_k: float = Field(default=100, ge=0)
    nu_m2_s: float = Field(default=1.57e-5, gt=0)
    pr: float = Field(default=0.71, gt=0)
    sc: float = Field(default=0.6, gt=0)
    tau_flow_s: float = Field(default=0.01, gt=0)
    tau_chem_s: float = Field(default=0.001, gt=0)
    fuel: str = "methane"
    environment: str = "custom"
    locale: Literal["es", "en"] = "es"
    resources: list[str] = Field(
        default_factory=lambda: ["water_mist", "scba", "detector", "ventilation"]
    )


class ScienceAction(BaseModel):
    id: str
    phase: Literal["prevention", "detection", "suppression"]
    priority: Literal["low", "medium", "high", "critical"]
    title: str
    detail: str
    evidence: list[str] = Field(default_factory=list)


class ScienceReference(BaseModel):
    accession: str
    title: str
    title_es: str = ""
    url: str = ""
    reason: str = ""


class ScienceAssessment(BaseModel):
    habitat: str
    habitat_label: str
    risk_level: Literal["low", "moderate", "high", "critical"]
    risk_score: int = Field(ge=0, le=100)
    headline: str
    summary: str
    drivers: list[str] = Field(default_factory=list)
    actions: list[ScienceAction] = Field(default_factory=list)
    references: list[ScienceReference] = Field(default_factory=list)


class PlaybookStep(BaseModel):
    id: str
    stage: Literal["alarm", "protect", "isolate", "suppress", "verify", "recover"]
    condition: str
    action: str
    fallback: str = ""
    caution: str = ""
    evidence: list[str] = Field(default_factory=list)


class ResponsePlaybook(BaseModel):
    coverage: Literal["partial", "limited"]
    headline: str
    summary: str
    resources: list[str] = Field(default_factory=list)
    steps: list[PlaybookStep] = Field(default_factory=list)
    contraindications: list[str] = Field(default_factory=list)
    references: list[ScienceReference] = Field(default_factory=list)


class ScienceResponse(BaseModel):
    environment: str
    o2_fraction: float
    pressure_pa: float
    o2_partial_pressure_pa: float
    o2_partial_pressure_psi: float
    equivalence_ratio: float | None = None
    adiabatic_flame_temperature_k: float | None = None
    adiabatic_flame_temperature_source: str = ""
    grashof: float
    rayleigh: float
    reynolds: float
    peclet: float
    damkohler: float
    radiative_loss_w_m2: float
    assumptions: list[str] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)
    assessment: ScienceAssessment
    playbook: ResponsePlaybook


class ScenarioPreset(BaseModel):
    id: str
    name_es: str
    name_en: str
    description_es: str
    description_en: str
    o2_fraction: float
    pressure_pa: float
    gravity_m_s2: float
    flow_velocity_m_s: float
    temperature_k: float = 298.15
    environment: str = "custom"
