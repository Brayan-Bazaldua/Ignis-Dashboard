from __future__ import annotations


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "ignis-api"}


def test_list_returns_seeded_investigations(client):
    response = client.get("/api/investigations")
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 30
    assert len(payload["items"]) == 30
    assert {"accession", "title", "acronym", "phases", "relevance_score"}.issubset(
        payload["items"][0]
    )
    accessions = {item["accession"] for item in payload["items"]}
    assert {"PSI-106", "NASA-SP-9918", "NASA-SP-9407", "NASA-FCF"}.issubset(accessions)


def test_search_accepts_tag_variants_and_names(client):
    for query in ("PSI-106", "psi 106", "psi_106", "PSI106"):
        payload = client.get("/api/investigations", params={"q": query}).json()
        assert payload["total"] == 1, query
        assert payload["items"][0]["accession"] == "PSI-106", query

    by_name = client.get("/api/investigations", params={"q": "Structure and Liftoff"}).json()
    assert any(item["accession"] == "PSI-106" for item in by_name["items"])

    nasa = client.get("/api/investigations", params={"q": "NASA-SP-9407"}).json()
    assert nasa["total"] == 1
    assert nasa["items"][0]["accession"] == "NASA-SP-9407"
    assert nasa["items"][0]["source_url"].startswith("https://spinoff.nasa.gov/")


def test_search_and_filters(client):
    search = client.get("/api/investigations", params={"q": "Saffire"}).json()
    assert search["total"] == 3
    assert {item["accession"] for item in search["items"]} == {"PSI-98", "PSI-99", "PSI-100"}
    assert all("SAFFIRE" in item["acronym"] for item in search["items"])

    detection = client.get("/api/investigations", params={"phase": "detection"}).json()
    assert detection["total"] > 0
    assert all("detection" in item["phases"] for item in detection["items"])

    page = client.get("/api/investigations", params={"limit": 5, "offset": 5}).json()
    assert len(page["items"]) == 5
    assert page["total"] == 30


def test_detail_exposes_curated_bilingual_synthesis(client):
    response = client.get("/api/investigations/PSI-100")
    assert response.status_code == 200
    item = response.json()

    assert len(item["key_findings"]) == 3
    assert len(item["key_findings_es"]) == 3
    assert len(item["limitations"]) == 2
    assert len(item["limitations_es"]) == 2
    assert any("Saffire-III" in finding for finding in item["key_findings"])
    assert item["limitations"][0] not in item["key_findings"]
    assert all(finding not in item["summary_en"] for finding in item["key_findings"])


def test_missing_investigation_returns_404(client):
    response = client.get("/api/investigations/PSI-9999")
    assert response.status_code == 404


def test_compare_requires_two_to_four_accessions(client):
    assert client.get("/api/compare", params={"ids": "PSI-25"}).status_code == 400
    assert (
        client.get("/api/compare", params={"ids": "PSI-25,PSI-69,PSI-100,PSI-10,PSI-20"}).status_code
        == 400
    )

    response = client.get("/api/compare", params={"ids": "PSI-25,PSI-69"})
    assert response.status_code == 200
    payload = response.json()
    assert [item["accession"] for item in payload["items"]] == ["PSI-25", "PSI-69"]
    assert payload["differences"]
    assert payload["similarities"] is not None


def test_gap_matrix_has_twelve_empty_cells(client):
    response = client.get("/api/gaps")
    assert response.status_code == 200
    payload = response.json()

    cells = payload["cells"]
    assert len(payload["phases"]) == 3
    assert len(payload["environments"]) == 6
    assert len(cells) == 18
    assert sum(1 for cell in cells if cell["count"] == 0) == 12
    assert payload["total"] == 30
    assert len(payload["gaps"]) == 12


def test_meta_summarizes_snapshot(client):
    response = client.get("/api/meta")
    assert response.status_code == 200
    payload = response.json()

    assert payload["count"] == 30
    assert payload["publications"] >= 300
    assert payload["experimental_tables"] == 0
    assert all(phase["count"] > 0 for phase in payload["phases"])


def test_chat_returns_answer_with_citations(client):
    response = client.post(
        "/api/chat",
        json={
            "question": "¿Qué evidencia existe para la detección de humo en microgravedad?",
            "locale": "es",
            "mode": "engineer",
        },
    )
    assert response.status_code == 200
    payload = response.json()

    assert len(payload["answer"]) > 80
    assert len(payload["citations"]) >= 2
    assert 0 < payload["confidence"] <= 1
    assert payload["provider"] == "mock"
    assert all(
        citation["accession"].startswith("PSI-") or citation["accession"].startswith("NASA-")
        for citation in payload["citations"]
    )


def test_science_scenario_is_localized(client):
    request = {
        "o2_fraction": 0.30,
        "pressure_pa": 70326.5,
        "gravity_m_s2": 0.0,
        "environment": "microgravity",
        "locale": "en",
    }
    response = client.post("/api/science/scenario", json=request)
    assert response.status_code == 200
    payload = response.json()

    assert payload["o2_partial_pressure_psi"] == 3.06
    assert payload["grashof"] == 0
    assert any("microgravity" in note for note in payload["notes"])
    assert payload["assumptions"][0].startswith("Ideal gas")


def test_science_assessment_builds_prioritized_action_plan(client):
    response = client.post(
        "/api/science/scenario",
        json={
            "o2_fraction": 0.30,
            "pressure_pa": 70326.5,
            "gravity_m_s2": 1.62,
            "environment": "lunar_base",
            "locale": "es",
        },
    )
    assert response.status_code == 200
    assessment = response.json()["assessment"]

    assert assessment["habitat"] == "lunar_base"
    assert assessment["habitat_label"] == "Base lunar"
    assert assessment["risk_level"] == "high"
    assert assessment["risk_score"] == 68
    assert len(assessment["actions"]) == 5
    assert {action["phase"] for action in assessment["actions"]} == {
        "prevention",
        "detection",
        "suppression",
    }
    assert all(action["evidence"] for action in assessment["actions"])
    references = {reference["accession"] for reference in assessment["references"]}
    assert {
        "NASA-SP-9918",
        "NASA-SP-9582",
        "NASA-SP-9407",
        "NASA-FCF",
        "NASA-COMBUSTION",
        "NASA-FLUID",
        "PSI-106",
    }.issubset(references)


def test_science_playbook_contract_and_resource_conditions(client):
    base = {
        "o2_fraction": 0.30,
        "pressure_pa": 70326.5,
        "gravity_m_s2": 1.62,
        "environment": "lunar_base",
        "locale": "es",
    }

    default_response = client.post("/api/science/scenario", json=base)
    assert default_response.status_code == 200
    playbook = default_response.json()["playbook"]
    assert playbook["coverage"] == "partial"
    assert len(playbook["steps"]) == 6
    assert [step["stage"] for step in playbook["steps"]] == [
        "alarm",
        "protect",
        "isolate",
        "suppress",
        "verify",
        "recover",
    ]
    assert playbook["resources"] == ["water_mist", "ventilation", "detector", "scba"]
    assert playbook["contraindications"]
    assert playbook["references"]

    limited_response = client.post(
        "/api/science/scenario",
        json={**base, "resources": []},
    )
    assert limited_response.status_code == 200
    limited = limited_response.json()["playbook"]
    assert limited["coverage"] == "limited"
    assert "No declaraste recursos" in limited["summary"]
    suppress = next(step for step in limited["steps"] if step["stage"] == "suppress")
    assert "No intentes suprimir" in suppress["action"]

    co2_response = client.post(
        "/api/science/scenario",
        json={**base, "resources": ["co2", "scba"]},
    )
    assert co2_response.status_code == 200
    co2 = co2_response.json()["playbook"]
    assert co2["coverage"] == "partial"
    assert any("CO₂" in item for item in co2["contraindications"])
