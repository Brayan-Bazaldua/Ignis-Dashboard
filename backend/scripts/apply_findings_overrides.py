"""Apply the curated EN/ES findings and limitations to the local PSI snapshot.

Usage:
    python backend/scripts/apply_findings_overrides.py

The overrides live in data/psi_findings_overrides.json. Running this script is
idempotent: it only replaces the four synthesis fields for each accession and
leaves the rest of the snapshot untouched. Re-run seed.py afterwards to push
the updated content into PostgreSQL.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SNAPSHOT_PATH = ROOT / "data" / "psi_snapshot.json"
OVERRIDES_PATH = ROOT / "data" / "psi_findings_overrides.json"

FIELDS = ("key_findings", "key_findings_es", "limitations", "limitations_es")


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    snapshot = load_json(SNAPSHOT_PATH)
    overrides = load_json(OVERRIDES_PATH)
    records = {item["accession"]: item for item in snapshot["investigations"]}

    applied = 0
    missing = []
    for accession, values in overrides.items():
        if accession.startswith("_"):
            continue
        record = records.get(accession)
        if record is None:
            missing.append(accession)
            continue
        for field in FIELDS:
            record[field] = values[field]
        applied += 1

    SNAPSHOT_PATH.write_text(
        json.dumps(snapshot, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"Applied curated findings/limitations to {applied} investigations")
    if missing:
        print(f"Accessions not present in snapshot: {', '.join(sorted(missing))}")


if __name__ == "__main__":
    main()
