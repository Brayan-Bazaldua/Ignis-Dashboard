from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import Computed, DateTime, Float, Index, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Investigation(Base):
    __tablename__ = "investigations"

    accession: Mapped[str] = mapped_column(String(32), primary_key=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    title_es: Mapped[str] = mapped_column(Text, default="")
    acronym: Mapped[str] = mapped_column(String(128), default="", index=True)
    research_area: Mapped[str] = mapped_column(String(128), default="")
    sub_research_area: Mapped[str] = mapped_column(String(128), default="")
    project_type: Mapped[str] = mapped_column(String(128), default="")
    flight_platform: Mapped[str] = mapped_column(String(256), default="")
    start_date: Mapped[str] = mapped_column(String(64), default="")
    end_date: Mapped[str] = mapped_column(String(64), default="")
    sponsoring_agency: Mapped[str] = mapped_column(Text, default="")
    managing_center: Mapped[str] = mapped_column(Text, default="")

    objective: Mapped[str] = mapped_column(Text, default="")
    approach: Mapped[str] = mapped_column(Text, default="")
    research_impacts: Mapped[str] = mapped_column(Text, default="")
    description: Mapped[str] = mapped_column(Text, default="")
    summary_en: Mapped[str] = mapped_column(Text, default="")
    summary_es: Mapped[str] = mapped_column(Text, default="")

    keywords: Mapped[list[str]] = mapped_column(JSONB, default=list)
    hardware: Mapped[list[str]] = mapped_column(JSONB, default=list)
    publications: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, default=list)
    contacts: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, default=list)
    phases: Mapped[list[str]] = mapped_column(JSONB, default=list)
    environments: Mapped[list[str]] = mapped_column(JSONB, default=list)
    fuel_types: Mapped[list[str]] = mapped_column(JSONB, default=list)
    gravity_types: Mapped[list[str]] = mapped_column(JSONB, default=list)
    sensors: Mapped[list[str]] = mapped_column(JSONB, default=list)
    key_findings: Mapped[list[str]] = mapped_column(JSONB, default=list)
    key_findings_es: Mapped[list[str]] = mapped_column(JSONB, default=list)
    limitations: Mapped[list[str]] = mapped_column(JSONB, default=list)
    limitations_es: Mapped[list[str]] = mapped_column(JSONB, default=list)
    experimental_table: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)

    doi: Mapped[str] = mapped_column(String(256), default="")
    thumbnail: Mapped[str] = mapped_column(Text, default="")
    source_url: Mapped[str] = mapped_column(Text, default="")
    data_readiness: Mapped[str] = mapped_column(String(32), default="metadata")
    classification_source: Mapped[str] = mapped_column(String(32), default="keyword")
    relevance_score: Mapped[float] = mapped_column(Float, default=0.5, index=True)

    raw: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    search_vector: Mapped[Any] = mapped_column(
        TSVECTOR,
        Computed(
            "to_tsvector('simple', "
            "coalesce(title, '') || ' ' || coalesce(title_es, '') || ' ' || "
            "coalesce(acronym, '') || ' ' || coalesce(objective, '') || ' ' || "
            "coalesce(approach, '') || ' ' || coalesce(research_impacts, '') || ' ' || "
            "coalesce(summary_en, '') || ' ' || coalesce(summary_es, '')"
            ")",
            persisted=True,
        ),
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    @property
    def publications_count(self) -> int:
        return len(self.publications or [])

    __table_args__ = (
        Index("ix_investigations_search_vector", "search_vector", postgresql_using="gin"),
        Index("ix_investigations_phases", "phases", postgresql_using="gin"),
        Index("ix_investigations_environments", "environments", postgresql_using="gin"),
        Index("ix_investigations_fuel_types", "fuel_types", postgresql_using="gin"),
        Index("ix_investigations_gravity_types", "gravity_types", postgresql_using="gin"),
    )


class ChatLog(Base):
    __tablename__ = "chat_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, default="")
    locale: Mapped[str] = mapped_column(String(8), default="es")
    mode: Mapped[str] = mapped_column(String(16), default="engineer")
    provider: Mapped[str] = mapped_column(String(32), default="mock")
    citations: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
