import type {
  ChatResponse,
  CompareResponse,
  GapMatrix,
  InvestigationCard,
  InvestigationDetail,
  InvestigationListResponse,
  MetaResponse,
  ScenarioPreset,
  ScienceRequest,
  ScienceResponse,
  SimilarInvestigation,
} from "./types";

const serverApiUrl =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

function apiBaseUrl(): string {
  // The browser calls the same origin; Next proxies /api to API_URL.
  return typeof window === "undefined" ? serverApiUrl : "";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path);
}

export function getInvestigations(params: {
  q?: string;
  phase?: string;
  environment?: string;
  fuel_type?: string;
  gravity_type?: string;
  readiness?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}): Promise<InvestigationListResponse> {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return apiGet<InvestigationListResponse>(`/api/investigations${query ? `?${query}` : ""}`);
}

export function getInvestigation(accession: string): Promise<InvestigationDetail> {
  return apiGet<InvestigationDetail>(`/api/investigations/${encodeURIComponent(accession)}`);
}

export function getSimilar(accession: string, limit = 4): Promise<SimilarInvestigation[]> {
  return apiGet<SimilarInvestigation[]>(`/api/investigations/${encodeURIComponent(accession)}/similar?limit=${limit}`);
}

export function getCompare(ids: string[]): Promise<CompareResponse> {
  return apiGet<CompareResponse>(`/api/compare?ids=${encodeURIComponent(ids.join(","))}`);
}

export function getGaps(): Promise<GapMatrix> {
  return apiGet<GapMatrix>("/api/gaps");
}

export function getMeta(): Promise<MetaResponse> {
  return apiGet<MetaResponse>("/api/meta");
}

export function getPresets(): Promise<ScenarioPreset[]> {
  return apiGet<ScenarioPreset[]>("/api/science/presets");
}

export function postChat(body: {
  question: string;
  locale: "es" | "en";
  mode: "student" | "engineer";
  accession?: string;
}): Promise<ChatResponse> {
  return request<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function postScenario(body: ScienceRequest): Promise<ScienceResponse> {
  return request<ScienceResponse>("/api/science/scenario", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function screenshotSafeUrl(path: string): string {
  return `${apiBaseUrl()}${path}`;
}

export type { InvestigationCard };
