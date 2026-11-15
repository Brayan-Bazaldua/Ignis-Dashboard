"""Load the local PSI snapshot into PostgreSQL.

Usage:
    python backend/scripts/seed.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))

from app.db import Base, SessionLocal, engine, ensure_extensions  # noqa: E402
from app.models import Investigation  # noqa: E402

SNAPSHOT = ROOT / "data" / "psi_snapshot.json"
SUPPLEMENT = ROOT / "data" / "nasa_sources.json"
SNAPSHOTS = [SNAPSHOT, SUPPLEMENT]

FIELDS = [
    "title",
    "title_es",
    "acronym",
    "research_area",
    "sub_research_area",
    "project_type",
    "flight_platform",
    "start_date",
    "end_date",
    "sponsoring_agency",
    "managing_center",
    "objective",
    "approach",
    "research_impacts",
    "description",
    "summary_en",
    "summary_es",
    "keywords",
    "hardware",
    "publications",
    "contacts",
    "phases",
    "environments",
    "fuel_types",
    "gravity_types",
    "sensors",
    "key_findings",
    "key_findings_es",
    "limitations",
    "limitations_es",
    "experimental_table",
    "doi",
    "thumbnail",
    "source_url",
    "data_readiness",
    "classification_source",
    "relevance_score",
]


def main() -> None:
    for path in SNAPSHOTS:
        if not path.exists():
            raise SystemExit(f"Snapshot not found: {path}")

    ensure_extensions()
    Base.metadata.create_all(engine)

    with SessionLocal() as db:
        for path in SNAPSHOTS:
            payload = json.loads(path.read_text(encoding="utf-8"))
            for record in payload["investigations"]:
                accession = record["accession"]
                item = db.get(Investigation, accession)
                if item is None:
                    item = Investigation(accession=accession)
                    db.add(item)
                for field in FIELDS:
                    setattr(item, field, record.get(field))
                item.raw = record
        db.commit()
        count = db.query(Investigation).count()
    print(f"Seeded {count} investigations from {len(SNAPSHOTS)} snapshots")


if __name__ == "__main__":
    main()
