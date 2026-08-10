"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyAverage } from "@/lib/types";
import { formatNumber } from "@/lib/format";

export type WeatherMetric = "temperature" | "humidity" | "rainfall" | "wind";

const metricConfig: Record<WeatherMetric, { dataKey: string; label: string; unit: string; stroke: string; gradient: string }> = {
  temperature: { dataKey: "avg_temperature_c", label: "Temperature", unit: "°C", stroke: "#0f8f82", gradient: "temperatureFill" },
  humidity: { dataKey: "avg_humidity_percent", label: "Humidity", unit: "%", stroke: "#3975d5", gradient: "humidityFill" },
  rainfall: { dataKey: "total_rainfall_mm", label: "Rainfall", unit: "mm", stroke: "#6d5bd0", gradient: "rainfallFill" },
  wind: { dataKey: "avg_wind_speed_mps", label: "Wind speed", unit: "m/s", stroke: "#c47b2d", gradient: "windFill" },
};

export function WeatherChart({ data, metric = "temperature" }: { data: DailyAverage[]; metric?: WeatherMetric }) {
  if (!data.length) {
    return <div className="grid h-[300px] place-items-center text-sm text-slate-500">No readings are available for this period.</div>;
  }

  const config = metricConfig[metric];
  const chartData = data.map((item) => ({
    ...item,
    label: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(new Date(`${item.date}T00:00:00Z`)),
  }));

  return (
    <div className="h-[310px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="temperatureFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0f8f82" stopOpacity={0.22} /><stop offset="100%" stopColor="#0f8f82" stopOpacity={0.01} /></linearGradient>
            <linearGradient id="humidityFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3975d5" stopOpacity={0.20} /><stop offset="100%" stopColor="#3975d5" stopOpacity={0.01} /></linearGradient>
            <linearGradient id="rainfallFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6d5bd0" stopOpacity={0.20} /><stop offset="100%" stopColor="#6d5bd0" stopOpacity={0.01} /></linearGradient>
            <linearGradient id="windFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c47b2d" stopOpacity={0.20} /><stop offset="100%" stopColor="#c47b2d" stopOpacity={0.01} /></linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#e9eef4" strokeDasharray="4 6" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#7b8798", fontSize: 11, fontWeight: 600 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a0af", fontSize: 11, fontWeight: 600 }} width={48} />
          <Tooltip
            cursor={{ stroke: "#cbd5e1", strokeDasharray: "4 4" }}
            contentStyle={{ borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 12px 30px rgba(15,23,42,.08)", fontSize: 12 }}
            formatter={(value) => [`${formatNumber(Number(value), metric === "rainfall" ? 1 : 1)} ${config.unit}`, config.label]}
            labelStyle={{ color: "#64748b", fontWeight: 700, marginBottom: 4 }}
          />
          <Area
            type="monotone"
            dataKey={config.dataKey}
            name={config.label}
            stroke={config.stroke}
            strokeWidth={2.6}
            fill={`url(#${config.gradient})`}
            dot={false}
            activeDot={{ r: 4.5, fill: config.stroke, stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
