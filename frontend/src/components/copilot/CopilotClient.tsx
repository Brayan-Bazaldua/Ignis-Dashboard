"use client";

import {
  ArrowUpRight,
  BookMarked,
  CircleHelp,
  FileSearch,
  GraduationCap,
  Loader2,
  MessageSquare,
  Pause,
  Play,
  RotateCcw,
  Send,
  ShieldCheck,
  Square,
  UserRound,
  Volume2,
  VolumeX,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";

import { UmmiaAvatar } from "@/components/copilot/UmmiaAvatar";
import { ConfidenceBar } from "@/components/ui/ConfidenceBar";
import { postChat } from "@/lib/api";
import { localizedTitle } from "@/lib/localize";
import type { ChatResponse, InvestigationDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

type Mode = "student" | "engineer";

type Message =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; response: ChatResponse };

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

function AnswerMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith("- ")) {
          return (
            <div key={index} className="flex gap-2 pl-0.5 text-[0.78rem] leading-relaxed">
              <span className="mt-[0.42rem] h-1 w-1 shrink-0 rounded-full bg-accent" />
              <span>{renderInline(trimmed.slice(2))}</span>
            </div>
          );
        }
        if (
          trimmed.startsWith("**") &&
          trimmed.endsWith("**") &&
          trimmed.length > 4 &&
          !trimmed.slice(2, -2).includes("**")
        ) {
          return (
            <p key={index} className="pt-1 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-accent">
              {renderInline(trimmed.slice(2, -2))}
            </p>
          );
        }
        return (
          <p key={index} className="text-[0.78rem] leading-relaxed">
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

export function CopilotClient({
  locale,
  contextItem,
}: {
  locale: string;
  contextItem: InvestigationDetail | null;
}) {
  const t = useTranslations("ummia");
  const tc = useTranslations("common");
  const [mode, setMode] = useState<Mode>("engineer");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [avatarPose, setAvatarPose] = useState<"front" | "side">("front");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speechState, setSpeechState] = useState<"idle" | "speaking" | "paused">("idle");
  const speaking = speechState === "speaking";
  const paused = speechState === "paused";
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const loadVoices = () => setAvailableVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const lastResponse = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (message.role === "assistant") return message.response;
    }
    return null;
  }, [messages]);

  function speechText(text: string) {
    return text
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/^[-*]\s+/gm, "")
      .replace(/\n+/g, ". ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function pickVoice(locale: string, voices: SpeechSynthesisVoice[]) {
    const prefix = locale === "en" ? "en" : "es";
    const candidates = voices.filter((voice) =>
      voice.lang.toLowerCase().startsWith(prefix),
    );
    const pool = candidates.length ? candidates : voices;

    const score = (voice: SpeechSynthesisVoice) => {
      const name = voice.name.toLowerCase();
      let value = 0;
      if (name.includes("natural")) value += 100;
      if (name.includes("neural")) value += 90;
      if (name.includes("wavenet")) value += 85;
      if (name.includes("premium")) value += 80;
      if (name.includes("enhanced")) value += 70;
      if (name.includes("google")) value += 60;
      if (name.includes("microsoft")) value += 40;
      if (voice.localService === false) value += 20;
      if (name.includes("compact")) value -= 60;
      if (name.includes("espeak")) value -= 80;
      return value;
    };

    let best: SpeechSynthesisVoice | null = null;
    for (const voice of pool) {
      if (!best || score(voice) > score(best)) best = voice;
    }
    return best;
  }

  async function speak(text: string) {
    if (
      !voiceEnabled ||
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();
    setSpeechState("idle");

    let voices = availableVoices.length
      ? availableVoices
      : window.speechSynthesis.getVoices();
    if (!voices.length) {
      await new Promise<void>((resolve) => {
        const onVoicesChanged = () => {
          window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
          resolve();
        };
        window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
        window.setTimeout(() => {
          window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
          resolve();
        }, 1200);
      });
      voices = window.speechSynthesis.getVoices();
    }

    const utterance = new SpeechSynthesisUtterance(speechText(text));
    utterance.lang = locale === "en" ? "en-US" : "es-ES";
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    const preferred = pickVoice(locale, voices);
    if (preferred) utterance.voice = preferred;
    utterance.onstart = () => setSpeechState("speaking");
    utterance.onend = () => setSpeechState("idle");
    utterance.onerror = () => setSpeechState("idle");
    utterance.onpause = () => setSpeechState("paused");
    utterance.onresume = () => setSpeechState("speaking");
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }

  function pauseSpeech() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speechState === "speaking") {
      window.speechSynthesis.pause();
      setSpeechState("paused");
    } else if (speechState === "paused") {
      window.speechSynthesis.resume();
      setSpeechState("speaking");
    }
  }

  function stopSpeech() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeechState("idle");
  }

  const examples = [t("example1"), t("example2"), t("example3"), t("example4"), t("example5")];
  const suggested = lastResponse?.suggested_questions?.length
    ? lastResponse.suggested_questions
    : examples;

  async function ask(question: string) {
    const clean = question.trim();
    if (!clean || loading) return;
    setError("");
    setInput("");
    setAvatarPose("front");
    setMessages((current) => [...current, { role: "user", content: clean }]);
    setLoading(true);
    try {
      const response = await postChat({
        question: clean,
        locale: locale === "en" ? "en" : "es",
        mode,
        accession: contextItem?.accession,
      });
      setAvatarPose("side");
      setMessages((current) => [
        ...current,
        { role: "assistant", content: response.answer, response },
      ]);
      speak(response.answer);
    } catch {
      setAvatarPose("front");
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    void ask(input);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void ask(input);
    }
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-12">
      <div className="glass-panel-strong flex min-h-[640px] flex-col overflow-hidden rounded-xl lg:col-span-8">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
          <div className="flex items-center gap-3">
            <UmmiaAvatar
              pose={loading ? "front" : avatarPose}
              speaking={speaking}
              size={42}
              alt={t("mascotAlt")}
            />
            <div>
              <p className="text-xs font-semibold text-white">Ummia</p>
              <p className="text-[0.58rem] uppercase tracking-[0.14em] text-muted-2">
                {t("noKey")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if ((speaking || paused) && typeof window !== "undefined" && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                  setSpeechState("idle");
                }
                setVoiceEnabled((current) => !current);
              }}
              className="rounded-lg border border-border p-1.5 text-muted-2 transition hover:text-white"
              title={voiceEnabled ? t("voiceOn") : t("voiceOff")}
              aria-pressed={voiceEnabled}
              aria-label={voiceEnabled ? t("voiceOn") : t("voiceOff")}
            >
              {voiceEnabled ? (
                <Volume2 className="h-3.5 w-3.5" />
              ) : (
                <VolumeX className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={pauseSpeech}
              disabled={!speaking && !paused}
              className="rounded-lg border border-border p-1.5 text-muted-2 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              title={paused ? t("resumeSpeech") : t("pauseSpeech")}
              aria-pressed={paused}
              aria-label={paused ? t("resumeSpeech") : t("pauseSpeech")}
            >
              {paused ? (
                <Play className="h-3.5 w-3.5" />
              ) : (
                <Pause className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={stopSpeech}
              disabled={!speaking && !paused}
              className="rounded-lg border border-border p-1.5 text-muted-2 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              title={t("stopSpeech")}
              aria-label={t("stopSpeech")}
            >
              <Square className="h-3.5 w-3.5" />
            </button>
            <div className="flex rounded-lg border border-border bg-surface/80 p-0.5">
              {(["student", "engineer"] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setMode(option)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[0.64rem] font-medium transition",
                    mode === option
                      ? "bg-accent/15 text-accent"
                      : "text-muted-2 hover:text-white",
                  )}
                  aria-pressed={mode === option}
                >
                  {option === "student" ? (
                    <GraduationCap className="h-3 w-3" />
                  ) : (
                    <Wrench className="h-3 w-3" />
                  )}
                  {t(option)}
                </button>
              ))}
            </div>
            {messages.length > 0 ? (
              <button
                onClick={() => {
                  setMessages([]);
                  setError("");
                }}
                className="rounded-lg border border-border p-1.5 text-muted-2 transition hover:text-white"
                title={t("newChat")}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-5">
          {messages.length === 0 ? (
            <div className="mx-auto flex max-w-xl flex-col items-center py-10 text-center">
              <div className="flex items-center gap-3">
                <UmmiaAvatar pose="front" size={112} alt={t("mascotAlt")} />
                <span className="relative rounded-xl rounded-bl-sm border border-border/80 bg-surface-2/90 px-3.5 py-2.5 text-left text-[0.7rem] leading-relaxed text-muted">
                  {t("mascotHint")}
                </span>
              </div>
              <h2 className="mt-5 text-lg font-semibold text-white">{t("emptyTitle")}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t("emptyBody")}</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {examples.slice(0, 4).map((example) => (
                  <button
                    key={example}
                    onClick={() => void ask(example)}
                    className="rounded-full border border-border bg-surface/70 px-3 py-1.5 text-[0.68rem] text-muted transition hover:border-accent/40 hover:text-white"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((message, index) =>
                message.role === "user" ? (
                  <div key={index} className="flex justify-end gap-2.5">
                    <div className="max-w-[85%] rounded-xl rounded-br-sm border border-accent/20 bg-accent/10 px-3.5 py-2.5">
                      <p className="text-[0.78rem] leading-relaxed text-white">{message.content}</p>
                    </div>
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-muted">
                      <UserRound className="h-3.5 w-3.5" />
                    </span>
                  </div>
                ) : (
                  <div key={index} className="flex gap-2.5">
                    <UmmiaAvatar pose="side" size={40} alt={t("mascotAlt")} className="mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="rounded-xl rounded-tl-sm border border-border/80 bg-surface-2/70 px-3.5 py-3">
                        <AnswerMarkdown text={message.content} />
                        {message.response.citations.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/60 pt-2.5">
                            {message.response.citations.map((citation) => (
                              <Link
                                key={citation.accession}
                                href={`/${locale}/investigations/${citation.accession}`}
                                className="badge badge-cyan transition hover:border-accent/60"
                              >
                                {citation.accession}
                              </Link>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 px-1 text-[0.58rem] text-muted-2">
                        <span>{message.response.provider}</span>
                        <span>·</span>
                        <span>
                          {t("citationsCount", { count: message.response.citations.length })}
                        </span>
                        <span>·</span>
                        <span>{Math.round(message.response.confidence * 100)}%</span>
                      </div>
                    </div>
                  </div>
                ),
              )}

              {loading ? (
                <div className="flex gap-2.5">
                  <UmmiaAvatar pose="front" size={40} alt={t("mascotAlt")} className="mt-0.5" />
                  <div className="rounded-xl rounded-tl-sm border border-border/70 bg-surface-2/60 px-3.5 py-3">
                    <p className="flex items-center gap-2 text-[0.72rem] text-muted">
                      {t("thinking")}
                      <span className="flex gap-1">
                        <span className="h-1 w-1 animate-pulse rounded-full bg-accent" />
                        <span className="h-1 w-1 animate-pulse rounded-full bg-accent [animation-delay:150ms]" />
                        <span className="h-1 w-1 animate-pulse rounded-full bg-accent [animation-delay:300ms]" />
                      </span>
                    </p>
                  </div>
                </div>
              ) : null}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="border-t border-border/70 bg-[#070d18]/60 px-4 py-3">
          {error ? <p className="mb-2 text-[0.66rem] text-danger">{error}</p> : null}
          <form onSubmit={submit} className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              maxLength={2000}
              placeholder={t("placeholder")}
              className="max-h-32 min-h-[52px] flex-1 resize-none rounded-xl border border-border bg-surface px-3 py-2.5 text-xs leading-relaxed text-foreground outline-none transition placeholder:text-muted-2 focus:border-accent/50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-accent text-[#04121c] transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={t("send")}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
          <p className="mt-2 text-[0.56rem] leading-relaxed text-muted-2">{t("disclaimer")}</p>
        </div>
      </div>

      <aside className="space-y-4 lg:col-span-4">
        {contextItem ? (
          <section className="glass-panel rounded-xl p-4">
            <p className="flex items-center gap-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-accent/80">
              <BookMarked className="h-3 w-3" />
              {t("context")}
            </p>
            <Link
              href={`/${locale}/investigations/${contextItem.accession}`}
              className="group mt-2 block"
            >
              <span className="font-mono text-[0.6rem] text-accent/80">
                {contextItem.accession}
              </span>
              <p className="mt-1 line-clamp-2 text-xs font-medium leading-snug text-white group-hover:text-accent">
                {localizedTitle(contextItem, locale)}
              </p>
            </Link>
            <button
              onClick={() =>
                void ask(
                  locale === "es"
                    ? `Resume la investigación ${contextItem.accession} y explica su relevancia para seguridad contra incendios.`
                    : `Summarize investigation ${contextItem.accession} and explain its fire-safety relevance.`,
                )
              }
              className="mt-3 inline-flex items-center gap-1.5 text-[0.66rem] font-medium text-accent hover:text-accent"
            >
              <FileSearch className="h-3.5 w-3.5" />
              {t("summarize")}
            </button>
          </section>
        ) : null}

        <section className="glass-panel rounded-xl p-4">
          <h3 className="flex items-center gap-2 text-xs font-semibold text-white">
            <MessageSquare className="h-3.5 w-3.5 text-accent" />
            {t("suggestions")}
          </h3>
          <div className="mt-3 space-y-1.5">
            {suggested.slice(0, 4).map((question) => (
              <button
                key={question}
                onClick={() => void ask(question)}
                className="flex w-full items-start gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left text-[0.68rem] leading-snug text-muted transition hover:border-border hover:bg-surface/60 hover:text-white"
              >
                <CircleHelp className="mt-0.5 h-3 w-3 shrink-0 text-muted-2" />
                {question}
              </button>
            ))}
          </div>
        </section>

        {lastResponse ? (
          <section className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold text-white">{t("confidence")}</h3>
              <span className="font-mono text-[0.64rem] text-accent">
                {Math.round(lastResponse.confidence * 100)}%
              </span>
            </div>
            <div className="mt-2">
              <ConfidenceBar value={lastResponse.confidence} tone="cyan" />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-2.5">
              <span className="text-[0.6rem] uppercase tracking-[0.12em] text-muted-2">
                {t("provider")}
              </span>
              <span className="rounded-md border border-border bg-surface-2 px-2 py-0.5 font-mono text-[0.6rem] text-muted">
                {lastResponse.provider}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="text-[0.6rem] uppercase tracking-[0.12em] text-muted-2">
                {t("mode")}
              </span>
              <span className="text-[0.62rem] text-accent">{t(lastResponse.mode as Mode)}</span>
            </div>
          </section>
        ) : null}

        <section className="glass-panel rounded-xl p-4">
          <h3 className="flex items-center gap-2 text-xs font-semibold text-white">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            {t("citations")}
          </h3>
          {lastResponse && lastResponse.citations.length > 0 ? (
            <div className="mt-3 space-y-2">
              {lastResponse.citations.map((citation) => (
                <Link
                  key={citation.accession}
                  href={`/${locale}/investigations/${citation.accession}`}
                  className="group block rounded-xl border border-border/60 bg-surface/60 p-2.5 transition hover:border-accent/30 hover:bg-surface-2/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[0.58rem] text-accent/80">
                      {citation.accession}
                    </span>
                    <ArrowUpRight className="h-3 w-3 text-muted-2 group-hover:text-accent" />
                  </div>
                  <p className="mt-1 line-clamp-2 text-[0.66rem] font-medium leading-snug text-white">
                    {locale === "es" ? citation.title_es || citation.title : citation.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[0.6rem] leading-relaxed text-muted-2">
                    {citation.quote}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-[0.66rem] leading-relaxed text-muted-2">{t("noCitations")}</p>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface/40 p-4">
          <p className="text-[0.62rem] leading-relaxed text-muted-2">{t("disclaimer")}</p>
          <div className="mt-2.5 flex items-center gap-1.5 text-[0.6rem] text-muted-2">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            {tc("psiSnapshot")} · 30 · ES/EN
          </div>
        </section>
      </aside>
    </div>
  );
}

