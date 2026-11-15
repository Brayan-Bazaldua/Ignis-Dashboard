export type Locale = "es" | "en";

export type Phase = "prevention" | "detection" | "suppression";
export type Environment =
  | "spacecraft"
  | "lunar_base"
  | "mars_base"
  | "rover"
  | "partial_gravity"
  | "earth";
export type FuelType = "solid" | "liquid" | "gas";
export type GravityType = "microgravity" | "normal_gravity" | "partial_gravity";

export interface Publication {
  title: string;
  authors: string;
  doi: string;
  pubMedID?: string;
  url: string;
}

export interface Contact {
  name: string;
  affiliation: string;
  role: string;
  email: string;
}

export interface InvestigationCard {
  accession: string;
  title: string;
  title_es: string;
  acronym: string;
  research_area: string;
  sub_research_area: string;
  summary_en: string;
  summary_es: string;
  phases: Phase[];
  environments: Environment[];
  fuel_types: FuelType[];
  gravity_types: GravityType[];
  sensors: string[];
  relevance_score: number;
  data_readiness: string;
  thumbnail: string;
  source_url: string;
  start_date: string;
  end_date: string;
  publications_count: number;
}

export interface InvestigationDetail extends InvestigationCard {
  project_type: string;
  flight_platform: string;
  sponsoring_agency: string;
  managing_center: string;
  objective: string;
  approach: string;
  research_impacts: string;
  description: string;
  keywords: string[];
  hardware: string[];
  publications: Publication[];
  contacts: Contact[];
  key_findings: string[];
  key_findings_es: string[];
  limitations: string[];
  limitations_es: string[];
  experimental_table: {
    file_name?: string;
    file_size?: number;
    remote_url?: string;
    restricted?: boolean;
  } | null;
  doi: string;
  classification_source: string;
}

export interface InvestigationListResponse {
  total: number;
  items: InvestigationCard[];
  query: string;
  filters: Record<string, string>;
}

export interface SimilarInvestigation {
  item: InvestigationCard;
  similarity: number;
  reasons: string[];
}

export interface CompareResponse {
  items: InvestigationDetail[];
  similarities: string[];
  differences: string[];
  shared_attributes: Record<string, string[]>;
}

export interface GapCell {
  phase: Phase;
  environment: Environment;
  count: number;
  accessions: string[];
  evidence_level: "none" | "low" | "medium" | "high";
}

export interface GapMatrix {
  phases: Phase[];
  environments: Environment[];
  cells: GapCell[];
  total: number;
  strongest: GapCell[];
  gaps: GapCell[];
}

export interface CounterItem {
  value: string;
  count: number;
  label?: { es: string; en: string };
}

export interface MetaResponse {
  count: number;
  publications: number;
  experimental_tables: number;
  phases: CounterItem[];
  environments: CounterItem[];
  fuel_types: CounterItem[];
  gravity_types: CounterItem[];
  sensors: CounterItem[];
  hardware: CounterItem[];
  data_readiness: CounterItem[];
  source: string;
  source_url: string;
  research_area: string;
  phases_order: Phase[];
  environments_order: Environment[];
}

export interface Citation {
  accession: string;
  title: string;
  title_es: string;
  url: string;
  quote: string;
  field: string;
  score: number;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  confidence: number;
  provider: string;
  suggested_questions: string[];
  mode: string;
  locale: string;
}

export interface ScienceRequest {
  o2_fraction: number;
  pressure_pa: number;
  temperature_k: number;
  gravity_m_s2: number;
  flow_velocity_m_s: number;
  length_m: number;
  beta_1_k: number;
  delta_t_k: number;
  nu_m2_s: number;
  pr: number;
  sc: number;
  tau_flow_s: number;
  tau_chem_s: number;
  fuel: string;
  environment: string;
  locale?: "es" | "en";
  resources: string[];
}

export type RiskLevel = "low" | "moderate" | "high" | "critical";
export type ActionPriority = "low" | "medium" | "high" | "critical";

export interface ScienceAction {
  id: string;
  phase: Phase;
  priority: ActionPriority;
  title: string;
  detail: string;
  evidence: string[];
}

export interface ScienceReference {
  accession: string;
  title: string;
  title_es: string;
  url: string;
  reason: string;
}

export interface ScienceAssessment {
  habitat: string;
  habitat_label: string;
  risk_level: RiskLevel;
  risk_score: number;
  headline: string;
  summary: string;
  drivers: string[];
  actions: ScienceAction[];
  references: ScienceReference[];
}

export type PlaybookStage =
  | "alarm"
  | "protect"
  | "isolate"
  | "suppress"
  | "verify"
  | "recover";

export interface PlaybookStep {
  id: string;
  stage: PlaybookStage;
  condition: string;
  action: string;
  fallback: string;
  caution: string;
  evidence: string[];
}

export interface ResponsePlaybook {
  coverage: "partial" | "limited";
  headline: string;
  summary: string;
  resources: string[];
  steps: PlaybookStep[];
  contraindications: string[];
  references: ScienceReference[];
}

export interface ScienceResponse {
  environment: string;
  o2_fraction: number;
  pressure_pa: number;
  o2_partial_pressure_pa: number;
  o2_partial_pressure_psi: number;
  equivalence_ratio: number | null;
  adiabatic_flame_temperature_k: number | null;
  adiabatic_flame_temperature_source: string;
  grashof: number;
  rayleigh: number;
  reynolds: number;
  peclet: number;
  damkohler: number;
  radiative_loss_w_m2: number;
  assumptions: string[];
  notes: string[];
  assessment: ScienceAssessment;
  playbook: ResponsePlaybook;
}

export interface ScenarioPreset {
  id: string;
  name_es: string;
  name_en: string;
  description_es: string;
  description_en: string;
  o2_fraction: number;
  pressure_pa: number;
  gravity_m_s2: number;
  flow_velocity_m_s: number;
  temperature_k: number;
  environment: string;
}
