from __future__ import annotations

import pytest

from app.schemas import ScienceRequest
from app.services.science import PSI_TO_PA, calculate_scenario, preset_payload


def test_partial_pressure_and_dimensionless_numbers():
    request = ScienceRequest(
        o2_fraction=0.30,
        pressure_pa=10.2 * PSI_TO_PA,
        gravity_m_s2=1.62,
        locale="es",
    )
    result = calculate_scenario(request)

    assert result.o2_partial_pressure_pa == pytest.approx(0.30 * 10.2 * PSI_TO_PA, abs=0.1)
    assert result.o2_partial_pressure_psi == pytest.approx(3.06, abs=0.01)
    assert result.grashof > 0
    assert result.rayleigh == pytest.approx(result.grashof * request.pr, rel=1e-6)
    assert result.reynolds == pytest.approx(
        request.flow_velocity_m_s * request.length_m / request.nu_m2_s, rel=1e-6
    )
    assert result.peclet == pytest.approx(result.reynolds * request.sc, rel=1e-6)
    assert any("30" in note for note in result.notes)


def test_microgravity_removes_buoyancy():
    result = calculate_scenario(ScienceRequest(gravity_m_s2=0.0, o2_fraction=0.21, locale="es"))

    assert result.grashof == 0
    assert result.rayleigh == 0
    assert any("microgravedad" in note for note in result.notes)


def test_science_notes_are_localized():
    english = calculate_scenario(ScienceRequest(gravity_m_s2=0.0, locale="en"))
    spanish = calculate_scenario(ScienceRequest(gravity_m_s2=0.0, locale="es"))

    assert any("microgravity" in note for note in english.notes)
    assert any("microgravedad" in note for note in spanish.notes)
    assert english.assumptions[0].startswith("Ideal gas")
    assert spanish.assumptions[0].startswith("Gas ideal")
    assert english.adiabatic_flame_temperature_source in {
        "Cantera 3.2 / GRI 3.0 (HP equilibrium)",
        "Literature reference value",
    }


def test_presets_cover_earth_and_lunar_scenarios():
    presets = preset_payload()
    ids = {preset["id"] for preset in presets}

    assert len(presets) == 6
    assert {"earth", "iss", "lunar_base", "mars_habitat", "rover"}.issubset(ids)
    lunar = next(preset for preset in presets if preset["id"] == "lunar_base")
    assert lunar["o2_fraction"] == pytest.approx(0.30)
    assert lunar["gravity_m_s2"] == pytest.approx(1.62)


def test_assessment_recommends_actions_and_nasa_references():
    lunar = calculate_scenario(
        ScienceRequest(
            o2_fraction=0.30,
            pressure_pa=70326.5,
            gravity_m_s2=1.62,
            environment="lunar_base",
            locale="es",
        )
    )

    assessment = lunar.assessment
    assert assessment.risk_level == "high"
    assert assessment.risk_score == 68
    assert assessment.habitat_label == "Base lunar"
    assert len(assessment.actions) == 5
    assert {action.phase for action in assessment.actions} == {
        "prevention",
        "detection",
        "suppression",
    }
    assert all(action.priority in {"low", "medium", "high", "critical"} for action in assessment.actions)
    assert any("Presión parcial de O₂" in driver for driver in assessment.drivers)

    accessions = {reference.accession for reference in assessment.references}
    assert {
        "NASA-SP-9918",
        "NASA-SP-9582",
        "NASA-SP-9407",
        "NASA-FCF",
        "NASA-COMBUSTION",
        "NASA-FLUID",
        "PSI-102",
        "PSI-99",
        "PSI-106",
    }.issubset(accessions)


def test_assessment_is_localized_and_earth_scores_lower():
    english = calculate_scenario(
        ScienceRequest(
            o2_fraction=0.30,
            pressure_pa=70326.5,
            gravity_m_s2=1.62,
            environment="lunar_base",
            locale="en",
        )
    )
    earth = calculate_scenario(
        ScienceRequest(
            o2_fraction=0.21,
            pressure_pa=101325,
            gravity_m_s2=9.81,
            environment="earth",
            locale="es",
        )
    )

    assert english.assessment.headline != calculate_scenario(
        ScienceRequest(
            o2_fraction=0.30,
            pressure_pa=70326.5,
            gravity_m_s2=1.62,
            environment="lunar_base",
            locale="es",
        )
    ).assessment.headline
    assert english.assessment.references[0].reason.startswith(
        "ISS combustion science framework"
    )
    assert earth.assessment.risk_level == "low"
    assert earth.assessment.risk_score < english.assessment.risk_score


def test_playbook_is_conditional_on_declared_resources():
    base = dict(
        o2_fraction=0.30,
        pressure_pa=70326.5,
        gravity_m_s2=1.62,
        environment="lunar_base",
        locale="es",
    )
    partial = calculate_scenario(ScienceRequest(**base)).playbook

    assert partial.coverage == "partial"
    assert [step.stage for step in partial.steps] == [
        "alarm",
        "protect",
        "isolate",
        "suppress",
        "verify",
        "recover",
    ]
    assert {"water_mist", "scba", "detector", "ventilation"}.issubset(set(partial.resources))
    assert partial.references
    assert all(step.action for step in partial.steps)
    assert all(step.fallback for step in partial.steps if step.stage != "recover")

    limited = calculate_scenario(ScienceRequest(**base, resources=[])).playbook
    assert limited.coverage == "limited"
    assert "No declaraste recursos" in limited.summary
    suppress = next(step for step in limited.steps if step.stage == "suppress")
    assert "No intentes suprimir" in suppress.action
    assert any("Sin SCBA" in item for item in limited.contraindications)


def test_playbook_warns_about_co2_and_localizes():
    spanish = calculate_scenario(
        ScienceRequest(resources=["co2", "scba"], locale="es")
    ).playbook
    english = calculate_scenario(
        ScienceRequest(resources=["co2", "scba"], locale="en")
    ).playbook

    spanish_suppress = next(step for step in spanish.steps if step.stage == "suppress")
    english_suppress = next(step for step in english.steps if step.stage == "suppress")
    assert "volumen cerrado y desocupado" in spanish_suppress.action
    assert "closed, unoccupied volume" in english_suppress.action
    assert any("CO₂" in item for item in spanish.contraindications)
    assert any("inert gases" in item for item in english.contraindications)
    assert spanish.headline != english.headline
    assert spanish.references[0].reason != english.references[0].reason

