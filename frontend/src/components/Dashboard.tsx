"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { AiInsight, DailyAverage, Paginated, Reading, Station } from "@/lib/types";
import { ErrorNotice } from "./ErrorNotice";
import { AiInsightPanel } from "./AiInsightPanel";
import { StationMap } from "./StationMap";
import { WeatherChart, type WeatherMetric } from "./WeatherChart";

const metricTabs: Array<{ key: WeatherMetric; label: string }> = [
  { key: "temperature", label: "Temperature" },
  { key: "humidity", label: "Humidity" },
  { key: "rainfall", label: "Rainfall" },
  { key: "wind", label: "Wind" },
];

export function Dashboard() {
  const [stations, setStations] = useState<Station[]>([]);
  const [stationId, setStationId] = useState<number | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [daily, setDaily] = useState<DailyAverage[]>([]);
  const [insight, setInsight] = useState<AiInsight | null>(null);
  const [chartMetric, setChartMetric] = useState<WeatherMetric>("temperature");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    api<{ data: Station[] }>("/stations")
      .then(({ data }) => {
        setStations(data);
        setStationId((current) => current ?? data[0]?.id ?? null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!stationId) return;

    let cancelled = false;
    setInsight(null);
    setAiError("");

    Promise.all([
      api<Paginated<Reading>>(`/readings?station_id=${stationId}&per_page=40`),
      api<{ data: DailyAverage[] }>(`/stations/${stationId}/daily-averages?days=7`),
    ])
      .then(([readingResponse, dailyResponse]) => {
        if (cancelled) return;

        setReadings(readingResponse.data);
        setDaily(dailyResponse.data);
        setError("");
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });

    api<{ data: AiInsight }>(`/stations/${stationId}/ai-insight?days=7`)
      .then((insightResponse) => {
        if (cancelled) return;
        setInsight(insightResponse.data);
        setAiError("");
      })
      .catch((e) => {
        if (!cancelled) setAiError(friendlyAiError(e instanceof Error ? e.message : String(e)));
      });

    return () => {
      cancelled = true;
    };
  }, [stationId]);

  const selected = stations.find((station) => station.id === stationId) ?? null;
  const latest = readings[0] ?? null;
  const totalReadings = useMemo(() => stations.reduce((sum, station) => sum + (station.readings_count ?? 0), 0), [stations]);
  const lastDay = daily.at(-1) ?? null;
  const previousDay = daily.at(-2) ?? null;

  const metrics = [
    {
      key: "temperature",
      label: "Temperature",
      value: latest ? formatNumber(latest.temperature_c) : "—",
      unit: "°C",
      delta: deltaText(lastDay?.avg_temperature_c, previousDay?.avg_temperature_c, "°C"),
      tone: "teal",
      icon: "temperature",
    },
    {
      key: "humidity",
      label: "Humidity",
      value: latest ? formatNumber(latest.humidity_percent) : "—",
      unit: "%",
      delta: deltaText(lastDay?.avg_humidity_percent, previousDay?.avg_humidity_percent, "%"),
      tone: "blue",
      icon: "humidity",
    },
    {
      key: "rainfall",
      label: "Rainfall",
      value: latest ? formatNumber(latest.rainfall_mm) : "—",
      unit: "mm",
      delta: lastDay ? `${formatNumber(lastDay.total_rainfall_mm, 1)} mm today` : "No daily aggregate",
      tone: "violet",
      icon: "rainfall",
    },
    {
      key: "wind",
      label: "Wind speed",
      value: latest ? formatNumber(latest.wind_speed_mps) : "—",
      unit: "m/s",
      delta: deltaText(lastDay?.avg_wind_speed_mps, previousDay?.avg_wind_speed_mps, "m/s"),
      tone: "amber",
      icon: "wind",
    },
  ] as const;

  return (
    <div className="space-y-6 lg:space-y-7">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.18em] text-[#0e7f75]">
            <span className="h-px w-5 bg-[#0e7f75]/50" />
            Network overview
          </div>
          <h1 className="max-w-3xl text-[30px] font-[850] tracking-[-.04em] text-[#111827] sm:text-[36px]">Weather operations at a glance</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Live sensor readings, seven-day conditions, station locations, and AI-assisted anomaly context in one operational view.</p>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <label className="sr-only" htmlFor="dashboard-station">Station</label>
          <div className="relative min-w-[250px]">
            <select id="dashboard-station" className="input h-11 appearance-none pr-10 text-sm font-bold" value={stationId ?? ""} onChange={(e) => setStationId(Number(e.target.value))}>
              {stations.map((station) => <option key={station.id} value={station.id}>{station.code} · {station.name}</option>)}
            </select>
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="m7 10 5 5 5-5" /></svg>
          </div>
          <Link href="/readings" className="btn btn-primary h-11 whitespace-nowrap px-4 text-sm">
            <span className="text-lg leading-none">+</span>
            New reading
          </Link>
        </div>
      </section>

      {error ? <ErrorNotice message={error} /> : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,.02)]">
        <div className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
          <StatusItem label="Network" value={loading ? "Loading…" : `${stations.length} stations`} detail="Configured monitoring locations" status />
          <StatusItem label="Sensor records" value={loading ? "Loading…" : totalReadings.toLocaleString("en-US")} detail="Stored across all stations" />
          <StatusItem label="Selected station" value={selected?.code ?? "—"} detail={selected?.name ?? "Choose a station"} />
          <StatusItem label="Last reading" value={latest ? timeOnly(latest.recorded_at) : "—"} detail={latest ? dateOnly(latest.recorded_at) : "No recent data"} />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <button
            key={metric.key}
            type="button"
            onClick={() => setChartMetric(metric.key)}
            className={`group rounded-2xl border bg-white p-5 text-left shadow-[0_1px_2px_rgba(15,23,42,.02)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,.06)] ${chartMetric === metric.key ? "border-slate-300 ring-1 ring-slate-200" : "border-slate-200/90"}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className={`grid h-10 w-10 place-items-center rounded-xl metric-tone-${metric.tone}`}><MetricIcon name={metric.icon} /></div>
              <span className={`mt-1 h-2 w-2 rounded-full transition ${chartMetric === metric.key ? "bg-[#0e7f75]" : "bg-slate-200 group-hover:bg-slate-300"}`} />
            </div>
            <div className="mt-5 text-[11px] font-extrabold uppercase tracking-[.12em] text-slate-400">{metric.label}</div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-[30px] font-[850] tracking-[-.04em] text-slate-950">{metric.value}</span>
              <span className="text-sm font-bold text-slate-400">{metric.unit}</span>
            </div>
            <div className="mt-2 text-xs font-semibold text-slate-500">{metric.delta}</div>
          </button>
        ))}
      </section>

      <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.55fr)_420px]">
        <div className="card overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-start sm:justify-between lg:px-6">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-[.14em] text-slate-400">Seven-day trend</div>
              <h2 className="mt-1 text-lg font-[820] tracking-[-.02em] text-slate-950">{selected?.name ?? "Station conditions"}</h2>
              <p className="mt-1 text-xs text-slate-500">Daily aggregates from the selected monitoring station.</p>
            </div>
            <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
              {metricTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setChartMetric(tab.key)}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-extrabold transition ${chartMetric === tab.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="px-3 pb-4 pt-3 sm:px-5 lg:px-6">
            <WeatherChart data={daily} metric={chartMetric} />
          </div>
        </div>

        <AiInsightPanel insight={insight} error={aiError} />
      </section>

      <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.35fr)_480px]">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 lg:px-6">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-[.14em] text-slate-400">Network geography</div>
              <h2 className="mt-1 text-lg font-[820] tracking-[-.02em] text-slate-950">Station map</h2>
            </div>
            <div className="hidden items-center gap-2 text-[11px] font-bold text-slate-400 sm:flex"><span className="h-2 w-2 rounded-full bg-[#0e7f75]" />Configured station</div>
          </div>
          <div className="p-3 sm:p-4">
            <StationMap stations={stations} />
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-[.14em] text-slate-400">Ingestion status</div>
              <h2 className="mt-1 text-lg font-[820] tracking-[-.02em] text-slate-950">Station activity</h2>
            </div>
            <Link href="/stations" className="text-xs font-extrabold text-[#0e7f75] transition hover:text-[#09675f]">Manage stations →</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {stations.map((station) => (
              <Link key={station.id} href={`/stations/${station.id}`} className="group flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50/80">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-[10px] font-black text-slate-600 transition group-hover:bg-teal-50 group-hover:text-teal-800">{station.code.slice(0, 3)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-xs font-extrabold text-slate-900">{station.name}</div>
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  </div>
                  <div className="mt-1 truncate text-[11px] font-medium text-slate-400">{station.code} · {station.region}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-extrabold text-slate-700">{station.readings_count ?? 0}</div>
                  <div className="mt-1 text-[10px] font-semibold text-slate-400">readings</div>
                </div>
              </Link>
            ))}
          </div>
          <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-[10px] font-semibold text-slate-400">Latest reading: {latest ? formatDateTime(latest.recorded_at) : "No recent data"}</div>
        </div>
      </section>

    </div>
  );
}

function StatusItem({ label, value, detail, status = false }: { label: string; value: string; detail: string; status?: boolean }) {
  return (
    <div className="px-5 py-4 lg:px-6">
      <div className="text-[10px] font-extrabold uppercase tracking-[.13em] text-slate-400">{label}</div>
      <div className="mt-1.5 flex items-center gap-2 text-sm font-extrabold text-slate-900">
        {status ? <span className="h-2 w-2 rounded-full bg-emerald-500" /> : null}
        {value}
      </div>
      <div className="mt-1 text-[11px] font-medium text-slate-400">{detail}</div>
    </div>
  );
}

function friendlyAiError(message: string) {
  if (message.toLowerCase().includes("too many attempts")) {
    return "AI request limit reached. Wait about a minute, then try again. Core sensor data remains available.";
  }

  return `AI analysis is temporarily unavailable: ${message}`;
}

function deltaText(current?: number, previous?: number, unit = "") {
  if (current === undefined || previous === undefined) return "Awaiting comparison data";
  const delta = current - previous;
  if (Math.abs(delta) < 0.05) return `Stable vs previous day`;
  return `${delta > 0 ? "+" : ""}${formatNumber(delta, 1)} ${unit} vs previous day`;
}

function timeOnly(value: string) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(new Date(value));
}

function dateOnly(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

function MetricIcon({ name }: { name: "temperature" | "humidity" | "rainfall" | "wind" }) {
  if (name === "temperature") return <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 14.7V5a3 3 0 0 1 6 0v9.7a5 5 0 1 1-6 0Z" /><path d="M12 9v7" /></svg>;
  if (name === "humidity") return <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3.5S6.5 9.4 6.5 14a5.5 5.5 0 0 0 11 0C17.5 9.4 12 3.5 12 3.5Z" /></svg>;
  if (name === "rainfall") return <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 15h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.3 8.8 3.2 3.2 0 0 0 7 15Z" /><path d="m8 18-1 2M13 18l-1 2M18 18l-1 2" /></svg>;
  return <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 9h10.5a2.5 2.5 0 1 0-2.4-3.2" /><path d="M4 13h14a2 2 0 1 1-1.8 2.9" /><path d="M4 17h7" /></svg>;
}
