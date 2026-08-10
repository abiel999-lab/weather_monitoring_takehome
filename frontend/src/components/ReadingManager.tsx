"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, toQuery } from "@/lib/api";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { Paginated, Reading, Station } from "@/lib/types";
import { ErrorNotice } from "./ErrorNotice";

function currentLocalDateTime(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function ReadingManager() {
  const [stations, setStations] = useState<Station[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [filterStation, setFilterStation] = useState("");
  const [form, setForm] = useState({ station_id: "", recorded_at: currentLocalDateTime(), temperature_c: "", humidity_percent: "", rainfall_mm: "0", wind_speed_mps: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const loadReadings = async (station = filterStation) => {
    const response = await api<Paginated<Reading>>(`/readings${toQuery({ station_id: station || undefined, per_page: 50 })}`);
    setReadings(response.data);
  };

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api<{ data: Station[] }>("/stations"),
      api<Paginated<Reading>>(`/readings${toQuery({ per_page: 50 })}`),
    ])
      .then(([stationResponse, readingResponse]) => {
        if (cancelled) return;

        setStations(stationResponse.data);
        setReadings(readingResponse.data);
        setForm((current) => ({
          ...current,
          station_id: current.station_id || String(stationResponse.data[0]?.id ?? ""),
        }));
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage(""); setSaving(true);
    try {
      await api("/readings", {
        method: "POST", auth: true,
        body: JSON.stringify({
          station_id: Number(form.station_id),
          recorded_at: new Date(form.recorded_at).toISOString(),
          temperature_c: Number(form.temperature_c),
          humidity_percent: Number(form.humidity_percent),
          rainfall_mm: Number(form.rainfall_mm),
          wind_speed_mps: Number(form.wind_speed_mps),
        }),
      });
      setMessage("Reading berhasil ditambahkan.");
      setForm((current) => ({ ...current, recorded_at: currentLocalDateTime(), temperature_c: "", humidity_percent: "", rainfall_mm: "0", wind_speed_mps: "" }));
      await loadReadings();
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal menyimpan reading."); }
    finally { setSaving(false); }
  }

  async function remove(reading: Reading) {
    if (!window.confirm("Hapus reading ini?")) return;
    try { await api(`/readings/${reading.id}`, { method: "DELETE", auth: true }); await loadReadings(); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal menghapus reading."); }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <section className="card h-fit p-5">
        <h2 className="font-black">Add weather reading</h2><p className="mt-1 text-sm text-slate-500">Timestamp dikirim sebagai ISO-8601 dan disimpan sebagai UTC.</p>
        {error ? <div className="mt-4"><ErrorNotice message={error} /></div> : null}{message ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div> : null}
        <form onSubmit={submit} className="mt-5 grid gap-4">
          <div><label className="label">Station</label><select className="input" value={form.station_id} onChange={(e) => setForm({ ...form, station_id: e.target.value })} required>{stations.map((station) => <option key={station.id} value={station.id}>{station.code} · {station.name}</option>)}</select></div>
          <div><label className="label">Recorded at</label><input className="input" type="datetime-local" value={form.recorded_at} onChange={(e) => setForm({ ...form, recorded_at: e.target.value })} required /></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="label">Temperature °C</label><input className="input" type="number" step="0.01" min="-80" max="70" value={form.temperature_c} onChange={(e) => setForm({ ...form, temperature_c: e.target.value })} required /></div><div><label className="label">Humidity %</label><input className="input" type="number" step="0.01" min="0" max="100" value={form.humidity_percent} onChange={(e) => setForm({ ...form, humidity_percent: e.target.value })} required /></div></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="label">Rainfall mm</label><input className="input" type="number" step="0.01" min="0" value={form.rainfall_mm} onChange={(e) => setForm({ ...form, rainfall_mm: e.target.value })} required /></div><div><label className="label">Wind m/s</label><input className="input" type="number" step="0.01" min="0" value={form.wind_speed_mps} onChange={(e) => setForm({ ...form, wind_speed_mps: e.target.value })} required /></div></div>
          <button disabled={saving} className="btn btn-primary">{saving ? "Saving…" : "Add reading"}</button>
        </form>
      </section>

      <section className="card p-4 md:p-5">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="font-black">Recent readings</h2><p className="mt-1 text-sm text-slate-500">Latest 50 records.</p></div><div className="w-full sm:max-w-xs"><label className="label">Filter station</label><select className="input" value={filterStation} onChange={(e) => { const value=e.target.value; setFilterStation(value); loadReadings(value).catch((err)=>setError(err.message)); }}><option value="">All stations</option>{stations.map((s)=><option key={s.id} value={s.id}>{s.code} · {s.name}</option>)}</select></div></div>
        <div className="table-wrap"><table><thead><tr><th>Station</th><th>Time</th><th>Temp</th><th>Humidity</th><th>Rain</th><th>Wind</th><th></th></tr></thead><tbody>{readings.map((r)=><tr key={r.id}><td className="font-bold">{r.station?.code ?? r.station_id}</td><td className="whitespace-nowrap text-xs">{formatDateTime(r.recorded_at)}</td><td>{formatNumber(r.temperature_c)} °C</td><td>{formatNumber(r.humidity_percent)}%</td><td>{formatNumber(r.rainfall_mm)} mm</td><td>{formatNumber(r.wind_speed_mps)} m/s</td><td><button onClick={()=>remove(r)} className="btn btn-danger !px-3 !py-2 text-xs">Delete</button></td></tr>)}</tbody></table></div>
      </section>
    </div>
  );
}
