from __future__ import annotations

import math
from typing import Any

from app.schemas import (
    PlaybookStep,
    ResponsePlaybook,
    ScenarioPreset,
    ScienceAction,
    ScienceAssessment,
    ScienceReference,
    ScienceRequest,
    ScienceResponse,
)

PSI_TO_PA = 6894.757293168
EARTH_O2_PSI = 0.21 * 101325 / PSI_TO_PA
SIGMA = 5.670374419e-8

HABITAT_LABELS = {
    "earth": {"es": "Tierra", "en": "Earth"},
    "iss": {"es": "ISS, microgravedad", "en": "ISS, microgravity"},
    "spacecraft": {"es": "Nave / estación", "en": "Spacecraft / station"},
    "microgravity": {"es": "Microgravedad", "en": "Microgravity"},
    "lunar_base": {"es": "Base lunar", "en": "Lunar base"},
    "mars_base": {"es": "Hábitat marciano presurizado", "en": "Pressurized Mars habitat"},
    "rover": {"es": "Rover presurizado", "en": "Pressurized rover"},
    "partial_gravity": {"es": "Gravedad parcial", "en": "Partial gravity"},
    "custom": {"es": "Escenario personalizado", "en": "Custom scenario"},
}

REFERENCE_LIBRARY: dict[str, dict[str, str]] = {
    "NASA-COMBUSTION": {
        "title": "Combustion Science Focus Area",
        "title_es": "Área de ciencia de la combustión",
        "url": "https://science.nasa.gov/biological-physical/focus-areas/combustion-science/",
    },
    "NASA-SP-9918": {
        "title": "New Technology for the Fire Attire",
        "title_es": "Nueva tecnología para el equipo de protección de bomberos",
        "url": "https://spinoff.nasa.gov/node/9918",
    },
    "NASA-SP-9407": {
        "title": "Fire Detector",
        "title_es": "Detector de incendios",
        "url": "https://spinoff.nasa.gov/node/9407",
    },
    "NASA-SP-9582": {
        "title": "Fireman's Air Tanks",
        "title_es": "Tanques de aire para bomberos",
        "url": "https://spinoff.nasa.gov/node/9582",
    },
    "NASA-FCF": {
        "title": "Fluids and Combustion Facility (FCF)",
        "title_es": "Instalación de fluidos y combustión (FCF)",
        "url": "https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/science-facilities-on-the-iss/fluids-combustion-facility/",
    },
    "NASA-FLUID": {
        "title": "Fluid Science",
        "title_es": "Ciencia de fluidos",
        "url": "https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/fluid-science/",
    },
    "PSI-102": {
        "title": "Smoke and Aerosol Measurement Experiment",
        "title_es": "Experimento de medición de humo y aerosoles",
        "url": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-102",
    },
    "PSI-101": {
        "title": "Smoke Aerosol Measurement Experiment-Reflight",
        "title_es": "Repetición del experimento de medición de humo y aerosoles",
        "url": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-101",
    },
    "PSI-100": {
        "title": "Spacecraft Fire Experiment-III",
        "title_es": "Experimento de seguridad contra incendios en naves espaciales III",
        "url": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-100",
    },
    "PSI-99": {
        "title": "Spacecraft Fire Experiment-II",
        "title_es": "Experimento de seguridad contra incendios en naves espaciales II",
        "url": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-99",
    },
    "PSI-69": {
        "title": "Flame Extinguishment Experiment",
        "title_es": "Experimento de extinción de llama",
        "url": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-69",
    },
    "PSI-26": {
        "title": "Burning and Suppression of Solids",
        "title_es": "Combustión y supresión de sólidos",
        "url": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-26",
    },
    "PSI-25": {
        "title": "Burning and Suppression of Solids - II",
        "title_es": "Combustión y supresión de sólidos - II",
        "url": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-25",
    },
    "PSI-106": {
        "title": "Structure and Liftoff In Combustion Experiment",
        "title_es": "Experimento de estructura y despegue en combustión",
        "url": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-106",
    },
}

REFERENCE_REASONS = {
    "NASA-COMBUSTION": {
        "es": "Marco de ciencia de la combustión en la ISS y riesgo de incendio en naves.",
        "en": "ISS combustion science framework and spacecraft fire risk.",
    },
    "NASA-SP-9918": {
        "es": "Materiales ignífugos y protección térmica derivados de Apollo para equipos de bomberos.",
        "en": "Apollo-derived fire-resistant and thermal-protection materials for firefighter gear.",
    },
    "NASA-SP-9407": {
        "es": "Detección temprana de partículas de combustión con discriminación de polvo.",
        "en": "Early combustion-particle detection with dust discrimination.",
    },
    "NASA-SP-9582": {
        "es": "Aire autónomo ligero y alarma personal de baja presión para respuesta en incendios.",
        "en": "Lightweight self-contained air and personal low-pressure alarms for fire response.",
    },
    "NASA-FCF": {
        "es": "Racks CIR y FIR: ensayos de combustión y fluidos en la ISS.",
        "en": "CIR and FIR racks: combustion and fluid experiments on the ISS.",
    },
    "NASA-FLUID": {
        "es": "Transporte de fluidos, ebullición y control térmico en baja gravedad.",
        "en": "Fluid transport, boiling, and thermal control in low gravity.",
    },
    "PSI-102": {
        "es": "Mediciones de humo y aerosoles en microgravedad para detectores de nave.",
        "en": "Microgravity smoke and aerosol measurements for spacecraft detectors.",
    },
    "PSI-101": {
        "es": "Repetición de SAME con matriz ampliada para detectores de humo de naves.",
        "en": "SAME reflight with an expanded matrix for spacecraft smoke detectors.",
    },
    "PSI-100": {
        "es": "Crecimiento y propagación de llama a escala en una nave no tripulada.",
        "en": "Large-scale flame growth and spread in an uncrewed spacecraft.",
    },
    "PSI-99": {
        "es": "Propagación y supresión de incendios en una nave espacial real.",
        "en": "Flame spread and suppression in a real spacecraft.",
    },
    "PSI-69": {
        "es": "Eficacia de CO₂, helio y SF₆ como agentes supresores en microgravedad.",
        "en": "Effectiveness of CO₂, helium, and SF₆ as suppressants in microgravity.",
    },
    "PSI-26": {
        "es": "Eficacia de un agente gaseoso inerte similar al sistema de la ISS.",
        "en": "Effectiveness of an inert gaseous agent similar to the ISS system.",
    },
    "PSI-25": {
        "es": "Límites de extinción y modelos de detección y supresión en flujo forzado.",
        "en": "Extinction limits and detection/suppression models under forced flow.",
    },
    "PSI-106": {
        "es": "Estructura y estabilidad de llamas laminares sin flotabilidad.",
        "en": "Structure and stability of laminar flames without buoyancy.",
    },
}

RESPONSE_RESOURCE_LABELS = {
    "water_mist": {"es": "niebla fina de agua", "en": "fine water mist"},
    "co2": {"es": "extintor de CO₂", "en": "CO₂ extinguisher"},
    "inert_gas": {"es": "gas inerte (N₂/He/SF₆)", "en": "inert gas (N₂/He/SF₆)"},
    "ventilation": {"es": "control de ventilación", "en": "ventilation control"},
    "detector": {"es": "detección de humo/partículas", "en": "smoke/particle detection"},
    "scba": {"es": "protección respiratoria autónoma", "en": "self-contained breathing apparatus"},
}

PLAYBOOK_REFERENCE_ACCESSIONS = [
    "PSI-102",
    "PSI-101",
    "NASA-SP-9407",
    "NASA-SP-9582",
    "NASA-SP-9918",
    "PSI-99",
    "PSI-26",
    "PSI-69",
    "NASA-FCF",
    "NASA-FLUID",
]

STOICH_O2_PER_FUEL = {
    "methane": 2.0,
    "ethylene": 3.0,
    "propane": 5.0,
    "hydrogen": 0.5,
}

FUEL_FORMULAS = {
    "methane": "CH4",
    "ethylene": "C2H4",
    "propane": "C3H8",
    "hydrogen": "H2",
}

FALLBACK_FLAME_TEMPERATURES = {
    "methane": 2220.0,
    "ethylene": 2370.0,
    "propane": 2260.0,
    "hydrogen": 2480.0,
}

PRESETS: list[ScenarioPreset] = [
    ScenarioPreset(
        id="earth",
        name_es="Tierra, nivel del mar",
        name_en="Earth, sea level",
        description_es="Referencia terrestre: 21 % de O₂ y 101.3 kPa.",
        description_en="Terrestrial reference: 21% O₂ and 101.3 kPa.",
        o2_fraction=0.21,
        pressure_pa=101325,
        gravity_m_s2=9.81,
        flow_velocity_m_s=0.05,
    ),
    ScenarioPreset(
        id="iss",
        name_es="ISS, microgravedad",
        name_en="ISS, microgravity",
        description_es="Atmósfera terrestre en caída libre; la flotabilidad desaparece.",
        description_en="Earth-like atmosphere in free fall; buoyancy disappears.",
        o2_fraction=0.21,
        pressure_pa=101325,
        gravity_m_s2=0.0,
        flow_velocity_m_s=0.05,
        environment="microgravity",
    ),
    ScenarioPreset(
        id="lunar_base",
        name_es="Base lunar",
        name_en="Lunar base",
        description_es="10.2 psi y 30 % de O₂: más oxígeno disponible y materiales más inflamables.",
        description_en="10.2 psi and 30% O₂: more available oxygen and more flammable materials.",
        o2_fraction=0.30,
        pressure_pa=10.2 * PSI_TO_PA,
        gravity_m_s2=1.62,
        flow_velocity_m_s=0.05,
        environment="lunar_base",
    ),
    ScenarioPreset(
        id="mars_habitat",
        name_es="Hábitat marciano presurizado",
        name_en="Pressurized Mars habitat",
        description_es="Hábitat presurizado a presión terrestre con gravedad marciana.",
        description_en="Earth-pressure habitat under Martian gravity.",
        o2_fraction=0.21,
        pressure_pa=101325,
        gravity_m_s2=3.71,
        flow_velocity_m_s=0.05,
        environment="mars_base",
    ),
    ScenarioPreset(
        id="rover",
        name_es="Rover presurizado",
        name_en="Pressurized rover",
        description_es="Atmósfera de 10.2 psi y 30 % de O₂ con gravedad lunar.",
        description_en="10.2 psi and 30% O₂ atmosphere under lunar gravity.",
        o2_fraction=0.30,
        pressure_pa=10.2 * PSI_TO_PA,
        gravity_m_s2=1.62,
        flow_velocity_m_s=0.10,
        environment="rover",
    ),
    ScenarioPreset(
        id="microgravity_high_o2",
        name_es="Microgravedad con 30 % de O₂",
        name_en="Microgravity with 30% O₂",
        description_es="Escenario de prueba para estudiar el efecto de una atmósfera enriquecida en oxígeno.",
        description_en="Test scenario to study the effect of an oxygen-enriched atmosphere.",
        o2_fraction=0.30,
        pressure_pa=101325,
        gravity_m_s2=0.0,
        flow_velocity_m_s=0.05,
        environment="microgravity",
    ),
]


def _adiabatic_flame_temperature(request: ScienceRequest, phi: float | None) -> tuple[float | None, str]:
    fuel_formula = FUEL_FORMULAS.get(request.fuel)
    fallback_label = (
        "Literature reference value" if request.locale == "en" else "Valor de referencia de la literatura"
    )
    if not fuel_formula:
        return FALLBACK_FLAME_TEMPERATURES.get(request.fuel), fallback_label
    try:
        import cantera as ct

        gas = ct.Solution("gri30.yaml")
        gas.TP = request.temperature_k, request.pressure_pa
        oxidizer = {"O2": max(request.o2_fraction, 0.01), "N2": max(1 - request.o2_fraction, 0.01)}
        gas.set_equivalence_ratio(phi if phi and phi > 0 else 1.0, fuel_formula, oxidizer)
        gas.equilibrate("HP")
        source = (
            "Cantera 3.2 / GRI 3.0 (HP equilibrium)"
            if request.locale == "en"
            else "Cantera 3.2 / GRI 3.0 (equilibrio HP)"
        )
        return round(float(gas.T), 1), source
    except Exception:
        return FALLBACK_FLAME_TEMPERATURES.get(request.fuel), fallback_label


def _equivalence_ratio(request: ScienceRequest) -> float | None:
    # The request schema currently does not include a fuel mole fraction; return
    # None rather than inventing a mixture composition. The UI explains that a
    # full mixture composition is required for phi.
    return None


def _number(value: float, digits: int, locale: str) -> str:
    text = f"{value:.{digits}f}"
    return text.replace(".", ",") if locale == "es" else text


def _habitat_label(environment: str, locale: str) -> str:
    labels = HABITAT_LABELS.get(environment)
    if labels:
        return labels[locale]
    return environment.replace("_", " ").title()


def _risk_score(
    request: ScienceRequest,
    o2_partial_psi: float,
    damkohler: float,
) -> int:
    score = 10
    o2 = request.o2_fraction
    environment = request.environment
    gravity = request.gravity_m_s2

    if o2 >= 0.40:
        score += 35
    elif o2 >= 0.30:
        score += 20
    elif o2 >= 0.25:
        score += 10

    if o2_partial_psi >= 5.0:
        score += 30
    elif o2_partial_psi >= 3.5:
        score += 20
    elif o2_partial_psi >= 3.0:
        score += 10

    if request.pressure_pa < 50_000:
        score += 10
    elif request.pressure_pa < 80_000:
        score += 5

    if gravity <= 0.1:
        score += 15
    elif gravity < 8.0:
        score += 8

    if environment in {"spacecraft", "microgravity", "iss"}:
        score += 12
    elif environment in {"lunar_base", "rover"}:
        score += 10
    elif environment == "mars_base":
        score += 6

    if damkohler >= 10:
        score += 5

    if environment == "earth":
        score -= 22 if o2 <= 0.22 else 5

    return max(0, min(100, score))


def _risk_level(score: int) -> str:
    if score >= 70:
        return "critical"
    if score >= 50:
        return "high"
    if score >= 30:
        return "moderate"
    return "low"


def _risk_headline(level: str, locale: str) -> str:
    headlines = {
        "critical": {
            "es": "Atención crítica: la atmósfera y el entorno exigen controles redundantes",
            "en": "Critical attention: the atmosphere and environment require redundant controls",
        },
        "high": {
            "es": "Atención alta: hay factores que pueden ampliar la ignición y la propagación",
            "en": "High attention: several factors may widen ignition and spread",
        },
        "moderate": {
            "es": "Atención moderada: el escenario requiere verificación dirigida",
            "en": "Moderate attention: the scenario requires targeted verification",
        },
        "low": {
            "es": "Configuración de referencia: mantén el control y la vigilancia",
            "en": "Reference configuration: keep monitoring and controls in place",
        },
    }
    return headlines[level][locale]


def _risk_summary(
    request: ScienceRequest,
    o2_partial_psi: float,
    locale: str,
) -> str:
    environment = request.environment
    o2_percent = _number(request.o2_fraction * 100, 0, locale)
    pressure = _number(request.pressure_pa / 1000, 1, locale)
    gravity = _number(request.gravity_m_s2, 2, locale)
    psi = _number(o2_partial_psi, 2, locale)

    if environment in {"spacecraft", "microgravity", "iss"}:
        return (
            f"En microgravedad no hay flotabilidad: el humo no forma un penacho ascendente y "
            f"la detección depende del muestreo forzado. Con {o2_percent} % de O₂, {psi} psi de "
            f"presión parcial y {pressure} kPa, el plan prioriza ventilación, sensores redundantes "
            f"y supresión por zonas."
            if locale == "es"
            else f"In microgravity there is no buoyancy: smoke does not form a rising plume and "
            f"detection depends on forced sampling. With {o2_percent}% O₂, {psi} psi partial "
            f"pressure, and {pressure} kPa, the plan prioritizes ventilation, redundant sensors, "
            f"and zoned suppression."
        )
    if environment == "lunar_base":
        return (
            f"La base lunar combina {pressure} kPa, {o2_percent} % de O₂ ({psi} psi) y "
            f"g = {gravity} m/s². La baja presión obliga a calificar materiales en la mezcla real; "
            f"la gravedad parcial reduce la convección y cambia el transporte de humo."
            if locale == "es"
            else f"The lunar base combines {pressure} kPa, {o2_percent}% O₂ ({psi} psi), and "
            f"g = {gravity} m/s². Low pressure requires material qualification in the actual mixture; "
            f"partial gravity reduces convection and changes smoke transport."
        )
    if environment == "rover":
        return (
            f"El rover es un volumen confinado y móvil: {o2_percent} % de O₂, {psi} psi y "
            f"{pressure} kPa. La respuesta debe ser rápida, con detección local, aislamiento por "
            f"zonas y protección respiratoria para la tripulación."
            if locale == "es"
            else f"The rover is a confined, mobile volume: {o2_percent}% O₂, {psi} psi, and "
            f"{pressure} kPa. Response must be fast, with local detection, zoned isolation, and "
            f"crew respiratory protection."
        )
    if environment == "mars_base":
        return (
            f"El hábitat marciano combina {o2_percent} % de O₂, {psi} psi y g = {gravity} m/s². "
            f"La gravedad parcial y la larga duración hacen críticos el control de materiales y la "
            f"verificación periódica de detectores."
            if locale == "es"
            else f"The Mars habitat combines {o2_percent}% O₂, {psi} psi, and g = {gravity} m/s². "
            f"Partial gravity and long duration make material control and periodic detector "
            f"verification critical."
        )
    if environment == "earth":
        return (
            f"Referencia terrestre: {o2_percent} % de O₂, {psi} psi y {pressure} kPa. Úsala como "
            f"línea base, pero no traslades estos resultados a una atmósfera enriquecida o de baja "
            f"presión sin repetir los ensayos."
            if locale == "es"
            else f"Earth reference: {o2_percent}% O₂, {psi} psi, and {pressure} kPa. Use it as a "
            f"baseline, but do not transfer these results to an enriched or low-pressure atmosphere "
            f"without repeating the tests."
        )
    return (
        f"Escenario personalizado con {o2_percent} % de O₂, {psi} psi, {pressure} kPa y "
        f"g = {gravity} m/s². El plan se genera a partir de estos datos; confirma que representan "
        f"la atmósfera y la gravedad del hábitat que quieres evaluar."
        if locale == "es"
        else f"Custom scenario with {o2_percent}% O₂, {psi} psi, {pressure} kPa, and "
        f"g = {gravity} m/s². The plan is generated from these inputs; confirm they represent the "
        f"habitat atmosphere and gravity you intend to evaluate."
    )


def _build_actions(
    request: ScienceRequest,
    o2_partial_psi: float,
    grashof: float,
    damkohler: float,
    risk_score: int,
    locale: str,
) -> list[ScienceAction]:
    o2_percent = _number(request.o2_fraction * 100, 0, locale)
    pressure = _number(request.pressure_pa / 1000, 1, locale)
    gravity = _number(request.gravity_m_s2, 2, locale)
    psi = _number(o2_partial_psi, 2, locale)
    grashof_text = _number(grashof, 3, locale)
    enriched = request.o2_fraction >= 0.30 or o2_partial_psi >= 3.5
    low_gravity = request.gravity_m_s2 < 8.0

    atmosphere_priority = (
        "critical"
        if request.o2_fraction >= 0.40 or o2_partial_psi >= 5.0
        else "high"
        if enriched
        else "medium"
    )
    materials_priority = (
        "critical"
        if risk_score >= 70 and enriched
        else "high"
        if enriched or risk_score >= 50
        else "medium"
    )
    detection_priority = (
        "critical"
        if risk_score >= 70 and low_gravity
        else "high"
        if low_gravity or risk_score >= 50
        else "medium"
    )
    suppression_priority = (
        "critical"
        if risk_score >= 70
        else "high"
        if low_gravity or risk_score >= 50
        else "medium"
    )
    verification_priority = (
        "critical" if risk_score >= 70 else "high" if risk_score >= 50 else "medium"
    )

    if locale == "es":
        return [
            ScienceAction(
                id="atmosphere",
                phase="prevention",
                priority=atmosphere_priority,
                title="Fijar la atmósfera objetivo y su margen de O₂",
                detail=(
                    f"La mezcla calculada tiene {o2_percent} % de O₂, {pressure} kPa y "
                    f"{psi} psi de presión parcial. Define un límite operativo verificable y una "
                    f"alarma de p(O₂), no solo de presión total."
                ),
                evidence=["NASA-COMBUSTION", "NASA-FCF"],
            ),
            ScienceAction(
                id="materials",
                phase="prevention",
                priority=materials_priority,
                title="Calificar materiales y textiles en la mezcla real",
                detail=(
                    f"Evalúa ignición, propagación y humo a {o2_percent} % de O₂ y {pressure} kPa. "
                    f"No importes límites de inflamabilidad de aire terrestre sin verificar la "
                    f"atmósfera del hábitat."
                ),
                evidence=["NASA-SP-9918", "NASA-COMBUSTION"],
            ),
            ScienceAction(
                id="detection",
                phase="detection",
                priority=detection_priority,
                title="Diseñar detección para el transporte de humo local",
                detail=(
                    f"Con g = {gravity} m/s² y Gr = {grashof_text}, la convección no transporta el "
                    f"humo como en la Tierra. Combina muestreo forzado, detección de partículas y "
                    f"discriminación de polvo para evitar falsas alarmas."
                ),
                evidence=["NASA-SP-9407", "PSI-102"],
            ),
            ScienceAction(
                id="suppression",
                phase="suppression",
                priority=suppression_priority,
                title="Seleccionar agente y respuesta por zonas",
                detail=(
                    f"Verifica la distribución del agente a {pressure} kPa y g = {gravity} m/s². "
                    f"Añade aislamiento de zonas, ventilación de emergencia y protección "
                    f"respiratoria; la supresión no termina hasta confirmar la extinción."
                ),
                evidence=["NASA-SP-9582", "PSI-99"],
            ),
            ScienceAction(
                id="verification",
                phase="prevention",
                priority=verification_priority,
                title="Validar el plan con un ensayo representativo",
                detail=(
                    f"Reproduce presión, gravedad y composición en una prueba de humo trazador. "
                    f"Registra tiempo de detección, respuesta de supresión y condiciones de "
                    f"Da = {_number(damkohler, 2, locale)} antes de declarar el diseño listo."
                ),
                evidence=["NASA-FCF", "NASA-FLUID"],
            ),
        ]

    return [
        ScienceAction(
            id="atmosphere",
            phase="prevention",
            priority=atmosphere_priority,
            title="Set the target atmosphere and its O₂ margin",
            detail=(
                f"The calculated mixture has {o2_percent}% O₂, {pressure} kPa, and {psi} psi "
                f"partial pressure. Define a verifiable operating limit and a p(O₂) alarm, not "
                f"only a total-pressure alarm."
            ),
            evidence=["NASA-COMBUSTION", "NASA-FCF"],
        ),
        ScienceAction(
            id="materials",
            phase="prevention",
            priority=materials_priority,
            title="Qualify materials and textiles in the actual mixture",
            detail=(
                f"Evaluate ignition, spread, and smoke at {o2_percent}% O₂ and {pressure} kPa. "
                f"Do not import terrestrial-air flammability limits without validating the "
                f"habitat atmosphere."
            ),
            evidence=["NASA-SP-9918", "NASA-COMBUSTION"],
        ),
        ScienceAction(
            id="detection",
            phase="detection",
            priority=detection_priority,
            title="Design detection for local smoke transport",
            detail=(
                f"At g = {gravity} m/s² and Gr = {grashof_text}, convection does not transport "
                f"smoke as it does on Earth. Combine forced sampling, particle detection, and dust "
                f"discrimination to avoid false alarms."
            ),
            evidence=["NASA-SP-9407", "PSI-102"],
        ),
        ScienceAction(
            id="suppression",
            phase="suppression",
            priority=suppression_priority,
            title="Select the agent and zone-based response",
            detail=(
                f"Verify agent distribution at {pressure} kPa and g = {gravity} m/s². Add zone "
                f"isolation, emergency ventilation, and respiratory protection; suppression is not "
                f"complete until extinguishment is confirmed."
            ),
            evidence=["NASA-SP-9582", "PSI-99"],
        ),
        ScienceAction(
            id="verification",
            phase="prevention",
            priority=verification_priority,
            title="Validate the plan with a representative test",
            detail=(
                f"Reproduce pressure, gravity, and composition in a tracer-smoke test. Record "
                f"detection time, suppression response, and Da = {_number(damkohler, 2, locale)} "
                f"before declaring the design ready."
            ),
            evidence=["NASA-FCF", "NASA-FLUID"],
        ),
    ]


def _build_references(
    request: ScienceRequest,
    risk_score: int,
    locale: str,
) -> list[ScienceReference]:
    accessions = [
        "NASA-COMBUSTION",
        "NASA-SP-9918",
        "NASA-SP-9407",
        "NASA-SP-9582",
        "NASA-FCF",
        "NASA-FLUID",
        "PSI-102",
        "PSI-99",
    ]
    if request.gravity_m_s2 < 8.0:
        accessions.append("PSI-106")

    references: list[ScienceReference] = []
    for accession in accessions:
        metadata = REFERENCE_LIBRARY[accession]
        reason = REFERENCE_REASONS[accession][locale]
        references.append(
            ScienceReference(
                accession=accession,
                title=metadata["title"],
                title_es=metadata["title_es"],
                url=metadata["url"],
                reason=reason,
            )
        )
    return references


def _selected_resources(request: ScienceRequest) -> list[str]:
    allowed = ["water_mist", "co2", "inert_gas", "ventilation", "detector", "scba"]
    selected = set(request.resources)
    return [resource for resource in allowed if resource in selected]


def _resource_list_text(resources: list[str], locale: str) -> str:
    labels = [RESPONSE_RESOURCE_LABELS[resource][locale] for resource in resources]
    if not labels:
        return "ninguno declarado" if locale == "es" else "none declared"
    if len(labels) == 1:
        return labels[0]
    if locale == "es":
        return f"{', '.join(labels[:-1])} y {labels[-1]}"
    return f"{', '.join(labels[:-1])}, and {labels[-1]}"


def _playbook_references(locale: str) -> list[ScienceReference]:
    references: list[ScienceReference] = []
    for accession in PLAYBOOK_REFERENCE_ACCESSIONS:
        metadata = REFERENCE_LIBRARY[accession]
        references.append(
            ScienceReference(
                accession=accession,
                title=metadata["title"],
                title_es=metadata["title_es"],
                url=metadata["url"],
                reason=REFERENCE_REASONS[accession][locale],
            )
        )
    return references


def _build_playbook(request: ScienceRequest, o2_partial_psi: float) -> ResponsePlaybook:
    locale = request.locale
    resources = _selected_resources(request)
    has_scba = "scba" in resources
    suppressants = [item for item in ("water_mist", "co2", "inert_gas") if item in resources]
    has_suppressant = bool(suppressants)
    low_gravity = request.gravity_m_s2 < 8.0
    enriched = request.o2_fraction >= 0.30 or o2_partial_psi >= 3.5
    coverage = "partial" if has_scba and has_suppressant else "limited"
    o2_percent = _number(request.o2_fraction * 100, 0, locale)
    pressure = _number(request.pressure_pa / 1000, 1, locale)
    resources_text = _resource_list_text(resources, locale)

    if locale == "es":
        alarm_action = (
            "Confirma la zona y registra la hora; no reinicies la alarma. "
            + (
                "En microgravedad el humo no asciende: usa muestreo forzado y revisa "
                "partículas y CO."
                if low_gravity
                else "Revisa partículas, CO y calor local antes de acercarte."
            )
        )
        alarm_fallback = (
            "Si no tienes detector, trata olor, irritación, calor local o decoloración "
            "como indicio y evacúa."
        )
        alarm_caution = "No abras la zona para inspeccionar sin protección."

        if has_scba:
            protect_action = (
                "Colócate el equipo de respiración autónoma; verifica presión y alarma de "
                "baja presión antes de entrar."
            )
            protect_fallback = (
                "Si el equipo falla o la presión es baja, sal de la zona y no intentes una entrada."
            )
        else:
            protect_action = (
                "Sin protección respiratoria no entres ni permanezcas en humo: cierra la "
                "zona y evacúa."
            )
            protect_fallback = "Pide apoyo al equipo entrenado y no reabras la zona."
        protect_caution = (
            "La protección respiratoria es el límite entre intentar suprimir y exponerse."
        )

        isolate_action = (
            "Desenergiza el equipo afectado, cierra la escotilla o barrera de la zona y "
            "detén la ventilación solo si el procedimiento del hábitat lo indica. No abras "
            "la zona para inspeccionar."
        )
        if "ventilation" in resources:
            isolate_action += (
                " Tienes control de ventilación: úsalo para aislar, no para empujar humo "
                "hacia el resto del hábitat."
            )
        isolate_fallback = (
            "Si no puedes aislar sin exponerte, evacúa y entrega la ubicación exacta al "
            "equipo de respuesta."
        )
        isolate_caution = (
            "En microgravedad, cambiar la ventilación redistribuye el humo y puede alimentar "
            "la llama; sigue el procedimiento local."
            if low_gravity
            else "Cortar la ventilación puede acumular humo; sigue el procedimiento local y "
            "no la reinicies sin autorización."
        )

        if has_suppressant:
            suppress_parts: list[str] = []
            if "water_mist" in resources:
                suppress_parts.append(
                    "Niebla fina: aplica pulsos cortos hacia la zona de llama, deja que la "
                    "niebla alcance la base y verifica re-ignición; no descargues sobre equipo "
                    "energizado."
                )
            if "co2" in resources:
                suppress_parts.append(
                    "CO₂: úsalo solo con SCBA en un volumen cerrado y desocupado; desplaza "
                    "oxígeno y puede permitir re-ignición de sólidos."
                )
            if "inert_gas" in resources:
                suppress_parts.append(
                    "Gas inerte: úsalo solo en un volumen sellado, con monitoreo de O₂ y "
                    "presión; nunca en un volumen ocupado sin SCBA."
                )
            suppress_action = " ".join(suppress_parts)
        else:
            suppress_action = (
                "No intentes suprimir sin un agente calificado: aísla, evacúa y espera al "
                "equipo entrenado."
            )
        suppress_condition = (
            "Si hay llama visible y puedes actuar con SCBA y un agente compatible:"
        )
        suppress_fallback = (
            "Sin SCBA, no intentes suprimir: evacúa."
            if not has_scba
            else "Si el agente no es compatible con el material o el equipo sigue energizado, "
            "no lo uses."
        )
        suppress_caution = (
            "Un extintor de CO₂ o gas inerte en un volumen pequeño puede reducir el O₂ por "
            "debajo de lo respirable; úsalo solo con SCBA y procedimiento."
        )

        verify_action = (
            "Mide temperatura, CO y partículas; observa re-ignición. No declares extinción "
            "solo porque no ves llama. "
            + (
                "En microgravedad la llama puede ser tenue o azul."
                if low_gravity
                else "Confirma la ausencia de focos ocultos."
            )
        )
        verify_fallback = (
            "Si no tienes instrumentos, mantén la zona aislada y vigilada; no la reabras."
        )
        verify_caution = "La ausencia de llama visible no confirma la extinción."

        recover_action = (
            "Ventila o renueva la atmósfera solo con monitoreo; revisa contaminantes y "
            "daños, y conserva registros, fotos y tiempos para el análisis posterior."
        )
        recover_fallback = "Si no puedes monitorear la atmósfera, no reocupes la zona."

        contraindications = [
            "No uses CO₂ ni gases inertes en un volumen ocupado sin SCBA: desplazan el oxígeno.",
            "No uses agua sobre equipo energizado ni sobre metales reactivos; desenergiza y "
            "confirma compatibilidad.",
            "No abras escotillas para ventilar sin procedimiento: el aire nuevo puede alimentar "
            "la llama y redistribuir humo.",
            "La ausencia de llama visible no confirma la extinción.",
        ]
        if enriched:
            contraindications.append(
                f"La atmósfera tiene {o2_percent} % de O₂: los materiales comunes pueden arder "
                "más rápido; no importes un procedimiento de aire terrestre."
            )
        if request.pressure_pa < 80_000:
            contraindications.append(
                f"A {pressure} kPa, la respuesta de detectores y la descarga del agente deben "
                "estar calificadas para esta presión."
            )
        if not has_scba:
            contraindications.append(
                "Sin SCBA, la supresión en un volumen ocupado no es una opción; prioriza "
                "aislamiento y evacuación."
            )
        if low_gravity:
            contraindications.append(
                "En gravedad reducida el humo no forma un penacho: no asumas que la zona "
                "'de arriba' está libre de humo."
            )

        if coverage == "partial":
            headline = "Respuesta parcial: protege, aísla y usa solo el agente compatible"
            summary = (
                f"Protocolo orientativo con {resources_text}. Cubre alarma, protección, "
                "aislamiento, supresión y verificación; no es un procedimiento de emergencia "
                "certificado. Ajusta cada paso al procedimiento del hábitat y al entrenamiento "
                "de la tripulación."
            )
        else:
            headline = "Respuesta limitada: aísla y evacúa; no improvises la supresión"
            if not resources:
                summary = (
                    "No declaraste recursos de respuesta: el protocolo se limita a alarma, "
                    "protección, aislamiento y evacuación. No intentes suprimir sin un agente "
                    "compatible y SCBA."
                )
            else:
                summary = (
                    f"Con los recursos declarados ({resources_text}) la respuesta es limitada: "
                    "prioriza alarma, protección, aislamiento y evacuación. No intentes una "
                    "supresión sin agente compatible y SCBA."
                )
    else:
        alarm_action = (
            "Confirm the zone and record the time; do not reset the alarm. "
            + (
                "In microgravity smoke does not rise: use forced sampling and check particles "
                "and CO."
                if low_gravity
                else "Check particles, CO, and local heat before approaching."
            )
        )
        alarm_fallback = (
            "If you have no detector, treat odor, irritation, local heat, or discoloration as "
            "an indicator and evacuate."
        )
        alarm_caution = "Do not open the area to inspect it without protection."

        if has_scba:
            protect_action = (
                "Don self-contained breathing apparatus; verify pressure and the low-pressure "
                "alarm before entering."
            )
            protect_fallback = (
                "If the equipment fails or pressure is low, leave the area and do not attempt "
                "an entry."
            )
        else:
            protect_action = (
                "Without respiratory protection, do not enter or remain in smoke: close the "
                "area and evacuate."
            )
            protect_fallback = "Request support from the trained team and do not reopen the area."
        protect_caution = (
            "Respiratory protection is the boundary between attempting suppression and "
            "exposing yourself."
        )

        isolate_action = (
            "De-energize the affected equipment, close the hatch or zone barrier, and stop "
            "ventilation only if the habitat procedure calls for it. Do not open the area to "
            "inspect it."
        )
        if "ventilation" in resources:
            isolate_action += (
                " You have ventilation control: use it to isolate, not to push smoke into the "
                "rest of the habitat."
            )
        isolate_fallback = (
            "If you cannot isolate without exposure, evacuate and give the exact location to "
            "the response team."
        )
        isolate_caution = (
            "In microgravity, changing ventilation redistributes smoke and may feed the flame; "
            "follow the local procedure."
            if low_gravity
            else "Shutting down ventilation can accumulate smoke; follow the local procedure "
            "and do not restart it without authorization."
        )

        if has_suppressant:
            suppress_parts = []
            if "water_mist" in resources:
                suppress_parts.append(
                    "Fine water mist: apply short pulses toward the flame zone, let the mist "
                    "reach the base, and check for re-ignition; do not discharge onto energized "
                    "equipment."
                )
            if "co2" in resources:
                suppress_parts.append(
                    "CO₂: use it only with SCBA in a closed, unoccupied volume; it displaces "
                    "oxygen and may allow solid fuels to re-ignite."
                )
            if "inert_gas" in resources:
                suppress_parts.append(
                    "Inert gas: use it only in a sealed volume with O₂ and pressure monitoring; "
                    "never in an occupied volume without SCBA."
                )
            suppress_action = " ".join(suppress_parts)
        else:
            suppress_action = (
                "Do not attempt suppression without a qualified agent: isolate, evacuate, and "
                "wait for the trained team."
            )
        suppress_condition = (
            "If flame is visible and you can act with SCBA and a compatible agent:"
        )
        suppress_fallback = (
            "Without SCBA, do not attempt suppression: evacuate."
            if not has_scba
            else "If the agent is incompatible with the material or the equipment remains "
            "energized, do not use it."
        )
        suppress_caution = (
            "A CO₂ or inert-gas extinguisher in a small volume can reduce O₂ below breathable "
            "levels; use it only with SCBA and a procedure."
        )

        verify_action = (
            "Measure temperature, CO, and particles; watch for re-ignition. Do not declare "
            "extinguishment just because you see no flame. "
            + (
                "In microgravity the flame may be faint or blue."
                if low_gravity
                else "Confirm there are no hidden hot spots."
            )
        )
        verify_fallback = (
            "If you have no instruments, keep the area isolated and monitored; do not reopen it."
        )
        verify_caution = "The absence of visible flame does not confirm extinguishment."

        recover_action = (
            "Ventilate or refresh the atmosphere only with monitoring; check contaminants and "
            "damage, and preserve records, photos, and timelines for later analysis."
        )
        recover_fallback = "If you cannot monitor the atmosphere, do not reoccupy the area."

        contraindications = [
            "Do not use CO₂ or inert gases in an occupied volume without SCBA: they displace "
            "oxygen.",
            "Do not use water on energized equipment or reactive metals; de-energize and "
            "confirm compatibility.",
            "Do not open hatches to ventilate without a procedure: fresh air can feed the flame "
            "and redistribute smoke.",
            "The absence of visible flame does not confirm extinguishment.",
        ]
        if enriched:
            contraindications.append(
                f"The atmosphere has {o2_percent}% O₂: common materials may burn faster; do not "
                "import a terrestrial-air procedure."
            )
        if request.pressure_pa < 80_000:
            contraindications.append(
                f"At {pressure} kPa, detector response and agent discharge must be qualified for "
                "this pressure."
            )
        if not has_scba:
            contraindications.append(
                "Without SCBA, suppression in an occupied volume is not an option; prioritize "
                "isolation and evacuation."
            )
        if low_gravity:
            contraindications.append(
                "In reduced gravity smoke does not form a plume: do not assume the area 'above' "
                "is smoke-free."
            )

        if coverage == "partial":
            headline = "Partial response: protect, isolate, and use only the compatible agent"
            summary = (
                f"Indicative protocol with {resources_text}. It covers alarm, protection, "
                "isolation, suppression, and verification; it is not a certified emergency "
                "procedure. Adapt each step to the habitat procedure and crew training."
            )
        else:
            headline = "Limited response: isolate and evacuate; do not improvise suppression"
            if not resources:
                summary = (
                    "You did not declare response resources: the protocol is limited to alarm, "
                    "protection, isolation, and evacuation. Do not attempt suppression without a "
                    "compatible agent and SCBA."
                )
            else:
                summary = (
                    f"With the declared resources ({resources_text}) the response is limited: "
                    "prioritize alarm, protection, isolation, and evacuation. Do not attempt "
                    "suppression without a compatible agent and SCBA."
                )

    steps = [
        PlaybookStep(
            id="alarm",
            stage="alarm",
            condition=(
                "Si se activa una alarma de humo/partículas o detectas olor a sobrecalentamiento:"
                if locale == "es"
                else "If a smoke/particle alarm activates or you detect an overheating odor:"
            ),
            action=alarm_action,
            fallback=alarm_fallback,
            caution=alarm_caution,
            evidence=["PSI-102", "PSI-101", "NASA-SP-9407"],
        ),
        PlaybookStep(
            id="protect",
            stage="protect",
            condition=(
                "Antes de acercarte o permanecer en la zona:"
                if locale == "es"
                else "Before approaching or remaining in the area:"
            ),
            action=protect_action,
            fallback=protect_fallback,
            caution=protect_caution,
            evidence=["NASA-SP-9582", "NASA-SP-9918"],
        ),
        PlaybookStep(
            id="isolate",
            stage="isolate",
            condition=(
                "Si puedes actuar sin ponerte en riesgo:"
                if locale == "es"
                else "If you can act without putting yourself at risk:"
            ),
            action=isolate_action,
            fallback=isolate_fallback,
            caution=isolate_caution,
            evidence=["PSI-99", "PSI-100", "NASA-FCF"],
        ),
        PlaybookStep(
            id="suppress",
            stage="suppress",
            condition=suppress_condition,
            action=suppress_action,
            fallback=suppress_fallback,
            caution=suppress_caution,
            evidence=["PSI-26", "PSI-69", "NASA-FCF"],
        ),
        PlaybookStep(
            id="verify",
            stage="verify",
            condition=(
                "Cuando el fuego parezca apagado o después de descargar el agente:"
                if locale == "es"
                else "When the fire appears out or after discharging the agent:"
            ),
            action=verify_action,
            fallback=verify_fallback,
            caution=verify_caution,
            evidence=["PSI-69", "PSI-102", "NASA-SP-9407"],
        ),
        PlaybookStep(
            id="recover",
            stage="recover",
            condition=(
                "Cuando la extinción esté confirmada y la atmósfera sea segura:"
                if locale == "es"
                else "When extinguishment is confirmed and the atmosphere is safe:"
            ),
            action=recover_action,
            fallback=recover_fallback,
            evidence=["PSI-101", "NASA-FLUID"],
        ),
    ]

    return ResponsePlaybook(
        coverage=coverage,
        headline=headline,
        summary=summary,
        resources=resources,
        steps=steps,
        contraindications=contraindications,
        references=_playbook_references(locale),
    )


def _build_assessment(
    request: ScienceRequest,
    o2_partial_psi: float,
    grashof: float,
    rayleigh: float,
    damkohler: float,
) -> ScienceAssessment:
    locale = request.locale
    risk_score = _risk_score(request, o2_partial_psi, damkohler)
    risk_level = _risk_level(risk_score)
    o2_percent = _number(request.o2_fraction * 100, 0, locale)
    pressure = _number(request.pressure_pa / 1000, 1, locale)
    gravity = _number(request.gravity_m_s2, 2, locale)
    psi = _number(o2_partial_psi, 2, locale)
    earth_ratio = _number(o2_partial_psi / EARTH_O2_PSI * 100, 0, locale)

    drivers = [
        (
            f"Presión parcial de O₂: {psi} psi ({earth_ratio} % de la referencia terrestre)."
            if locale == "es"
            else f"O₂ partial pressure: {psi} psi ({earth_ratio}% of the Earth reference)."
        ),
        (
            f"Fracción de O₂: {o2_percent} %; presión total: {pressure} kPa."
            if locale == "es"
            else f"O₂ fraction: {o2_percent}%; total pressure: {pressure} kPa."
        ),
        (
            f"Gravedad: {gravity} m/s²; Gr = {_number(grashof, 3, locale)} y "
            f"Ra = {_number(rayleigh, 3, locale)}."
            if locale == "es"
            else f"Gravity: {gravity} m/s²; Gr = {_number(grashof, 3, locale)} and "
            f"Ra = {_number(rayleigh, 3, locale)}."
        ),
    ]
    if request.pressure_pa < 80_000:
        drivers.append(
            "Presión total reducida: verifica la calificación de materiales y la respuesta de "
            "detectores a esta presión."
            if locale == "es"
            else "Reduced total pressure: verify material qualification and detector response at "
            "this pressure."
        )
    if damkohler >= 1:
        drivers.append(
            f"Da = {_number(damkohler, 2, locale)}: la química es rápida frente al transporte; "
            f"la extinción debe confirmarse, no inferirse."
            if locale == "es"
            else f"Da = {_number(damkohler, 2, locale)}: chemistry is fast relative to transport; "
            f"extinguishment must be confirmed, not inferred."
        )

    return ScienceAssessment(
        habitat=request.environment,
        habitat_label=_habitat_label(request.environment, locale),
        risk_level=risk_level,
        risk_score=risk_score,
        headline=_risk_headline(risk_level, locale),
        summary=_risk_summary(request, o2_partial_psi, locale),
        drivers=drivers,
        actions=_build_actions(
            request,
            o2_partial_psi,
            grashof,
            damkohler,
            risk_score,
            locale,
        ),
        references=_build_references(request, risk_score, locale),
    )


def calculate_scenario(request: ScienceRequest) -> ScienceResponse:
    o2_partial_pa = request.o2_fraction * request.pressure_pa
    grashof = (
        request.gravity_m_s2
        * request.beta_1_k
        * request.delta_t_k
        * request.length_m**3
        / max(request.nu_m2_s**2, 1e-18)
    )
    rayleigh = grashof * request.pr
    reynolds = request.flow_velocity_m_s * request.length_m / max(request.nu_m2_s, 1e-18)
    peclet = reynolds * request.sc
    damkohler = request.tau_flow_s / max(request.tau_chem_s, 1e-18)

    phi = _equivalence_ratio(request)
    flame_temperature, flame_source = _adiabatic_flame_temperature(request, phi)
    radiative_temperature = flame_temperature or 1500.0
    radiative_loss = 0.8 * SIGMA * (radiative_temperature**4 - request.temperature_k**4)

    assumptions = (
        [
            "Ideal gas assumption for the partial-pressure conversion.",
            "Constant transport properties for the dimensionless numbers.",
            "Flame emissivity assumed to be 0.8 for the radiative loss.",
            "The adiabatic temperature is computed for a stoichiometric mixture when no composition is specified.",
        ]
        if request.locale == "en"
        else [
            "Gas ideal para la conversión de presión parcial.",
            "Propiedades de transporte constantes para los números adimensionales.",
            "Emisividad de la llama supuesta en 0.8 para la pérdida radiativa.",
            "La temperatura adiabática se calcula para una mezcla estequiométrica si no se especifica la composición.",
        ]
    )
    notes: list[str] = []
    if request.gravity_m_s2 == 0:
        notes.append(
            "At microgravity, Gr = 0 and Ra = 0: buoyancy-driven convection disappears and transport depends on diffusion and forced flow."
            if request.locale == "en"
            else "En microgravedad, Gr = 0 y Ra = 0: la convección por flotabilidad desaparece y el transporte depende de la difusión y del flujo forzado."
        )
    if request.o2_fraction >= 0.30:
        notes.append(
            "An O₂ fraction of 30% or more raises the oxygen partial pressure and can widen flammability limits; material-specific testing is required."
            if request.locale == "en"
            else "Una fracción de O₂ ≥ 30 % aumenta la presión parcial de oxígeno y puede ampliar los límites de inflamabilidad; se requieren pruebas específicas del material."
        )
    if request.environment == "lunar_base":
        notes.append(
            "The planned lunar base uses an atmosphere between the spacesuit and Earth: more O₂ at reduced pressure."
            if request.locale == "en"
            else "La Base Lunar prevista usa una atmósfera intermedia entre el traje espacial y la Tierra: más O₂ y presión reducida."
        )
    notes.append(
        "These results support analysis; they are not a safety certification or a replacement for standardized testing."
        if request.locale == "en"
        else "Los resultados son de apoyo al análisis, no una certificación de seguridad ni un reemplazo de ensayos normalizados."
    )

    return ScienceResponse(
        environment=request.environment,
        o2_fraction=request.o2_fraction,
        pressure_pa=request.pressure_pa,
        o2_partial_pressure_pa=round(o2_partial_pa, 1),
        o2_partial_pressure_psi=round(o2_partial_pa / PSI_TO_PA, 2),
        equivalence_ratio=phi,
        adiabatic_flame_temperature_k=flame_temperature,
        adiabatic_flame_temperature_source=flame_source,
        grashof=round(grashof, 6),
        rayleigh=round(rayleigh, 6),
        reynolds=round(reynolds, 6),
        peclet=round(peclet, 6),
        damkohler=round(damkohler, 6),
        radiative_loss_w_m2=round(radiative_loss, 1),
        assumptions=assumptions,
        notes=notes,
        assessment=_build_assessment(
            request,
            o2_partial_pa / PSI_TO_PA,
            grashof,
            rayleigh,
            damkohler,
        ),
        playbook=_build_playbook(request, o2_partial_pa / PSI_TO_PA),
    )


def preset_payload() -> list[dict[str, Any]]:
    return [preset.model_dump() for preset in PRESETS]
