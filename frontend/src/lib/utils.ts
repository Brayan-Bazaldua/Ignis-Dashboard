import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number, locale = "es") {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatScore(score: number) {
  return `${Math.round(score * 100)}%`;
}

export function scoreTone(score: number) {
  if (score >= 0.85) return "high";
  if (score >= 0.65) return "medium";
  return "low";
}

export function truncate(text: string, length = 180) {
  if (!text) return "";
  if (text.length <= length) return text;
  return `${text.slice(0, length).replace(/\s+\S*$/, "")}…`;
}

export function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}
