"use client";

import { formatDateTime, formatNumber } from "@/lib/format";
import type { AiInsight } from "@/lib/types";

type Props = {
  insight: AiInsight | null;
  error?: string;
  title?: string;
};

const statCards = [
  { key: "temperature_c", label: "Avg temp", unit: "°C", tone: "bg-teal-50 text-teal-800" },
  { key: "humidity_percent", label: "Avg humidity", unit: "%", tone: "bg-blue-50 text-blue-700" },
  { key: "rainfall_mm", label: "Avg rainfall", unit: "mm", tone: "bg-violet-50 text-violet-700" },
  { key: "wind_speed_mps", label: "Avg wind", unit: "m/s", tone: "bg-amber-50 text-amber-700" },
] as const;

export function AiInsightPanel({ insight, error = "", title = "Anomaly briefing" }: Props) {
  const narrative = insight ? cleanSummary(insight.summary) : "";
  const anomalyCount = insight?.anomalies.length ?? 0;

  return (
    <aside className="card overflow-hidden">
      <div className="border-b border-slate-100 bg-[linear-gradient(145deg,#ffffff_0%,#f5fbfa_100%)] px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0e7f75] text-white shadow-[0_8px_24px_rgba(14,127,117,.16)]">
              <SparkIcon />
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#0e7f75]">AI analysis</div>
              <h2 className="mt-1 text-lg font-[850] tracking-[-.025em] text-slate-950">{title}</h2>
              <div className="mt-1 flex items-center gap-2 text-[10px] font-semibold text-slate-400">
                <span>7-day sensor context</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span>z-score assisted</span>
              </div>
            </div>
          </div>

          {insight ? (
            <span className="shrink-0 rounded-full border border-teal-100 bg-white px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.1em] text-[#0e7f75] shadow-sm">
              {providerLabel(insight.provider)}
            </span>
          ) : null}
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs font-semibold leading-5 text-amber-800">
            {error}
          </div>
        ) : insight ? (
          <div className="mt-4 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_8px_28px_rgba(15,23,42,.045)]">
            <div className="mb-2 flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[.14em] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[#16a394]" />
              Operational summary
            </div>
            <p className="text-[13px] leading-6 text-slate-600">{narrative}</p>
          </div>
        ) : (
          <div className="mt-4 space-y-2.5">
            <div className="h-3 w-full animate-pulse rounded-full bg-slate-200/70" />
            <div className="h-3 w-[88%] animate-pulse rounded-full bg-slate-200/70" />
            <div className="h-3 w-[66%] animate-pulse rounded-full bg-slate-200/70" />
          </div>
        )}
      </div>

      {insight ? (
        <>
          <div className="grid grid-cols-2 gap-2 border-b border-slate-100 p-4">
            {statCards.map((card) => {
              const stat = insight.statistics[card.key];
              return (
                <div key={card.key} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[9px] font-extrabold uppercase tracking-[.11em] text-slate-400">{card.label}</div>
                    <span className={`h-2 w-2 rounded-full ${card.tone.split(" ")[0]}`} />
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-1">
                    <span className="text-base font-[850] tracking-[-.03em] text-slate-900">{stat ? formatNumber(stat.mean, 1) : "—"}</span>
                    <span className="text-[10px] font-bold text-slate-400">{card.unit}</span>
                  </div>
                  {stat ? <div className="mt-1 text-[9px] font-semibold text-slate-400">{formatNumber(stat.min, 1)}–{formatNumber(stat.max, 1)} {card.unit}</div> : null}
                </div>
              );
            })}
          </div>

          <div className="border-b border-slate-100 px-5 py-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400">Trend signals</div>
              <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.08em] text-slate-500">{insight.period_days} days</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <TrendPill label="Temperature" trend={insight.trend?.temperature_c} unit="°C" />
              <TrendPill label="Rainfall" trend={insight.trend?.rainfall_mm} unit="mm" />
              <TrendPill label="Humidity" trend={insight.trend?.humidity_percent} unit="%" />
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400">Detected events</div>
              <div className="text-[11px] font-bold text-slate-500">{anomalyCount} total</div>
            </div>

            {anomalyCount > 0 ? (
              <div className="space-y-2.5">
                {insight.anomalies.slice(0, 4).map((item, index) => {
                  const severity = anomalySeverity(item.z_score);
                  return (
                    <div key={`${item.metric}-${item.recorded_at}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-xs font-extrabold text-slate-800">{item.label}</div>
                          <div className="mt-1 text-[11px] font-semibold text-slate-500">{formatNumber(item.value, 2)} · z-score {formatNumber(item.z_score, 2)}</div>
                        </div>
                        <span className={`severity severity-${severity.toLowerCase()}`}>{severity}</span>
                      </div>
                      <div className="mt-2 text-[10px] font-semibold text-slate-400">{formatDateTime(item.recorded_at)}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-xs font-semibold leading-5 text-emerald-800">No strong statistical anomalies detected in this period.</div>
            )}

            <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-[9px] font-medium leading-4 text-slate-400">
              <InfoIcon />
              <span>AI output supports interpretation only. Verify sensor conditions before operational or safety decisions.</span>
            </div>
          </div>
        </>
      ) : null}
    </aside>
  );
}

function TrendPill({ label, trend, unit }: { label: string; trend?: { direction: "up" | "down" | "stable"; delta: number }; unit: string }) {
  if (!trend) return null;
  const icon = trend.direction === "up" ? "↗" : trend.direction === "down" ? "↘" : "→";
  const direction = trend.direction === "stable" ? "Stable" : trend.direction === "up" ? "Up" : "Down";

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600">
      <span className="text-[#0e7f75]">{icon}</span>
      <span>{label}</span>
      <span className="text-slate-400">{direction} {trend.direction === "stable" ? "" : `${formatNumber(Math.abs(trend.delta), 1)}${unit}`}</span>
    </div>
  );
}

function cleanSummary(summary: string) {
  const cleaned = summary
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.includes("|") && !/^[\-:|\s]+$/.test(line))
    .map((line) => line.replace(/^#{1,6}\s*/, "").replace(/\*\*/g, "").replace(/\*/g, "").replace(/^[-•]\s*/, "").trim())
    .filter((line) => !/^ringkasan cuaca\b/i.test(line) && !/^periode\b/i.test(line) && !/^parameter\b/i.test(line));

  if (cleaned.length > 0) return cleaned.join(" ");

  return "AI selesai menganalisis statistik dan anomali pada data sensor tujuh hari terakhir. Tinjau metrik dan kejadian terdeteksi di bawah untuk konteks operasional.";
}

function providerLabel(provider: string) {
  if (provider === "mock-fallback") return "Mock fallback";
  if (provider === "mock") return "Mock provider";
  if (provider === "deterministic") return "Deterministic";
  return `${provider} · real LLM`;
}

function anomalySeverity(zScore: number) {
  const score = Math.abs(zScore);
  if (score >= 3) return "High";
  if (score >= 2.5) return "Medium";
  return "Review";
}

function SparkIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m12 3 1.3 4.1a5.3 5.3 0 0 0 3.4 3.4L21 12l-4.3 1.5a5.3 5.3 0 0 0-3.4 3.4L12 21l-1.3-4.1a5.3 5.3 0 0 0-3.4-3.4L3 12l4.3-1.5a5.3 5.3 0 0 0 3.4-3.4L12 3Z" /></svg>;
}

function InfoIcon() {
  return <svg viewBox="0 0 24 24" className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 10v6M12 7h.01" /></svg>;
}
