"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { AiInsight, DailyAverage, Paginated, Reading, Station } from "@/lib/types";
import { AiInsightPanel } from "./AiInsightPanel";
import { ErrorNotice } from "./ErrorNotice";
import { MetricCard } from "./MetricCard";
import { StationMap } from "./StationMap";
import { WeatherChart } from "./WeatherChart";

export function StationDetail({ id }: { id: number }) {
  const [station, setStation] = useState<Station | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [daily, setDaily] = useState<DailyAverage[]>([]);
  const [insight, setInsight] = useState<AiInsight | null>(null);
  const [error, setError] = useState("");
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api<{ data: Station }>(`/stations/${id}`),
      api<Paginated<Reading>>(`/readings?station_id=${id}&per_page=20`),
      api<{ data: DailyAverage[] }>(`/stations/${id}/daily-averages?days=14`),
    ])
      .then(([stationResponse, readingResponse, dailyResponse]) => {
        if (cancelled) return;
        setStation(stationResponse.data);
        setReadings(readingResponse.data);
        setDaily(dailyResponse.data);
        setError("");
      })
      .catch((exception) => {
        if (!cancelled) setError(exception instanceof Error ? exception.message : "Unable to load station data.");
      });

    api<{ data: AiInsight }>(`/stations/${id}/ai-insight?days=7`)
      .then((response) => {
        if (cancelled) return;
        setInsight(response.data);
        setAiError("");
      })
      .catch((exception) => {
        if (!cancelled) setAiError(friendlyAiError(exception instanceof Error ? exception.message : String(exception)));
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) return <ErrorNotice message={error} />;
  if (!station) return <div className="text-sm text-slate-500">Loading station…</div>;

  const latest = readings[0];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Temperature" value={latest ? formatNumber(latest.temperature_c) : "—"} unit="°C" />
        <MetricCard label="Humidity" value={latest ? formatNumber(latest.humidity_percent) : "—"} unit="%" />
        <MetricCard label="Rainfall" value={latest ? formatNumber(latest.rainfall_mm) : "—"} unit="mm" />
        <MetricCard label="Wind" value={latest ? formatNumber(latest.wind_speed_mps) : "—"} unit="m/s" helper={latest ? formatDateTime(latest.recorded_at) : "No data"} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_420px]">
        <section className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-5">
            <div className="text-[11px] font-extrabold uppercase tracking-[.14em] text-slate-400">Station history</div>
            <h2 className="mt-1 text-lg font-[820] tracking-[-.02em] text-slate-950">14-day trend</h2>
            <p className="mt-1 text-xs text-slate-500">Daily aggregated measurements for {station.name}.</p>
          </div>
          <div className="px-4 pb-4 pt-3 sm:px-5"><WeatherChart data={daily} /></div>
        </section>

        <AiInsightPanel insight={insight} error={aiError} title="Station anomaly briefing" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-black">Location</h2>
          <div className="mt-4"><StationMap stations={[station]} /></div>
        </section>

        <section className="card p-5">
          <h2 className="font-black">Station metadata</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <Metadata label="Code" value={station.code} />
            <Metadata label="Region" value={station.region} />
            <Metadata label="Coordinates" value={`${formatNumber(station.latitude, 4)}, ${formatNumber(station.longitude, 4)}`} />
            <Metadata label="Elevation" value={`${formatNumber(station.elevation_m)} m`} />
            <Metadata label="Readings" value={String(station.readings_count ?? 0)} />
            <Metadata label="Last reading" value={formatDateTime(station.last_reading_at)} />
          </dl>
        </section>
      </div>
    </>
  );
}

function Metadata({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-slate-500">{label}</dt><dd className="mt-1 font-bold">{value}</dd></div>;
}

function friendlyAiError(message: string) {
  if (message.toLowerCase().includes("too many attempts")) {
    return "AI request limit reached. Wait about a minute, then try again. Core station data remains available.";
  }

  return `AI analysis is temporarily unavailable: ${message}`;
}
