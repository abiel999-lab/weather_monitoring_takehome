"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { api } from "@/lib/api";
import type { AiChatResponse, Station } from "@/lib/types";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  provider?: string;
};

const suggestions = [
  "Stasiun mana yang curah hujannya paling tinggi?",
  "Kenapa Bandung dianggap memiliki anomali?",
  "Bandingkan Bandung dan Surabaya selama 7 hari.",
  "Apakah ada pola suhu yang tidak biasa?",
];

export function AiChatDrawer({ stations, selectedStationId }: { stations: Station[]; selectedStationId: number | null }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [contextStationId, setContextStationId] = useState<number | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  const effectiveStationId = contextStationId === undefined ? selectedStationId : contextStationId;

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, open]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    await ask(input);
  }

  async function ask(rawQuestion: string) {
    const question = rawQuestion.trim();
    if (!question || loading) return;

    const history = messages.slice(-6).map(({ role, content }) => ({ role, content }));
    setInput("");
    setError("");
    setMessages((current) => [...current, { role: "user", content: question }]);
    setLoading(true);

    try {
      const response = await api<{ data: AiChatResponse }>("/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          question,
          station_id: effectiveStationId,
          days: 7,
          history,
        }),
      });

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.data.answer,
          provider: response.data.provider,
        },
      ]);
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : "Weather AI tidak dapat menjawab saat ini.";
      setError(message.toLowerCase().includes("too many attempts")
        ? "Batas permintaan AI tercapai. Tunggu sekitar satu menit lalu coba lagi."
        : message);
    } finally {
      setLoading(false);
    }
  }

  function clearConversation() {
    setMessages([]);
    setError("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 rounded-2xl bg-[#0b1220] px-4 py-3 text-xs font-extrabold text-white shadow-[0_18px_45px_rgba(15,23,42,.24)] transition hover:-translate-y-0.5 hover:bg-[#101b30] sm:bottom-7 sm:right-7"
        aria-label="Open Weather AI Assistant"
      >
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#16a394] text-white"><SparkIcon /></span>
        <span>Ask Weather AI</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70]">
          <button type="button" aria-label="Close Weather AI Assistant" onClick={() => setOpen(false)} className="absolute inset-0 bg-slate-950/25 backdrop-blur-[2px]" />

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-[460px] flex-col border-l border-slate-200 bg-[#f8fafc] shadow-[-24px_0_70px_rgba(15,23,42,.16)]">
            <header className="border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#0e7f75] text-white shadow-[0_8px_24px_rgba(14,127,117,.18)]"><SparkIcon /></div>
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#0e7f75]">Grounded sensor Q&amp;A</div>
                    <h2 className="mt-0.5 text-base font-[850] tracking-[-.02em] text-slate-950">Weather AI Assistant</h2>
                  </div>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900" aria-label="Close assistant"><CloseIcon /></button>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
                <div>
                  <label htmlFor="ai-context-station" className="mb-1 block text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">Data context</label>
                  <select
                    id="ai-context-station"
                    className="input h-10 text-xs font-bold"
                    value={effectiveStationId ?? ""}
                    onChange={(event) => setContextStationId(event.target.value === "" ? null : Number(event.target.value))}
                  >
                    <option value="">All stations · network-wide</option>
                    {stations.map((station) => <option key={station.id} value={station.id}>{station.code} · {station.name}</option>)}
                  </select>
                </div>
                <button type="button" onClick={clearConversation} className="self-end rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[11px] font-extrabold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800">Clear</button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
              {messages.length === 0 ? (
                <div>
                  <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,.03)]">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-teal-50 text-[#0e7f75]"><SparkIcon /></div>
                      <div>
                        <div className="text-xs font-extrabold text-slate-900">Tanya berdasarkan data sensor aktual</div>
                        <p className="mt-1.5 text-xs leading-5 text-slate-500">Assistant menerima ringkasan statistik, curah hujan, nilai terbaru, dan anomali z-score dari PostgreSQL sebelum menjawab.</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400">Suggested questions</div>
                  <div className="mt-2.5 grid gap-2">
                    {suggestions.map((suggestion) => (
                      <button key={suggestion} type="button" onClick={() => ask(suggestion)} className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left text-xs font-semibold leading-5 text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,.02)] transition hover:border-teal-200 hover:bg-teal-50/40 hover:text-slate-900">
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                {messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-5 ${message.role === "user" ? "rounded-br-md bg-[#0e7f75] text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,.03)]"}`}>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      {message.role === "assistant" && message.provider ? (
                        <div className="mt-2 border-t border-slate-100 pt-2 text-[9px] font-extrabold uppercase tracking-[.12em] text-slate-400">{providerLabel(message.provider)}</div>
                      ) : null}
                    </div>
                  </div>
                ))}

                {loading ? (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,.03)]">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0e7f75]" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0e7f75] [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0e7f75] [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                ) : null}

                {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs font-semibold leading-5 text-red-700">{error}</div> : null}
                <div ref={endRef} />
              </div>
            </div>

            <form onSubmit={submit} className="border-t border-slate-200 bg-white p-4 sm:p-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_8px_30px_rgba(15,23,42,.06)] focus-within:border-teal-300 focus-within:ring-4 focus-within:ring-teal-50">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      if (input.trim()) void ask(input);
                    }
                  }}
                  rows={2}
                  maxLength={500}
                  placeholder="Tanya tentang cuaca, stasiun, tren, atau anomali…"
                  className="w-full resize-none border-0 bg-transparent px-2 py-1.5 text-xs leading-5 text-slate-800 outline-none placeholder:text-slate-400"
                />
                <div className="flex items-center justify-between gap-3 px-1 pb-1">
                  <div className="text-[9px] font-semibold text-slate-400">7-day database context · Enter to send</div>
                  <button type="submit" disabled={loading || !input.trim()} className="grid h-9 w-9 place-items-center rounded-xl bg-[#0e7f75] text-white transition hover:bg-[#09675f] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send question"><SendIcon /></button>
                </div>
              </div>
              <p className="mt-2 text-center text-[9px] leading-4 text-slate-400">AI output is an interpretation aid. Verify sensor conditions before operational or safety decisions.</p>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  );
}

function providerLabel(provider: string) {
  if (provider === "mock-fallback") return "Mock fallback · real provider unavailable";
  if (provider === "mock") return "Mock provider";
  return `${provider} · real LLM`;
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 3c.7 4.2 2.8 6.3 7 7-4.2.7-6.3 2.8-7 7-.7-4.2-2.8-6.3-7-7 4.2-.7 6.3-2.8 7-7Z" />
      <path d="M19 16.5c.3 1.8 1.2 2.7 3 3-1.8.3-2.7 1.2-3 3-.3-1.8-1.2-2.7-3-3 1.8-.3 2.7-1.2 3-3Z" />
    </svg>
  );
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>;
}

function SendIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true"><path d="m4 4 16 8-16 8 3-8-3-8Z" /><path d="M7 12h13" /></svg>;
}
