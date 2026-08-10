"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { Station } from "@/lib/types";
import { ErrorNotice } from "./ErrorNotice";

const empty = { code: "", name: "", latitude: "", longitude: "", elevation_m: "", region: "" };

export function StationManager() {
  const [stations, setStations] = useState<Station[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => api<{ data: Station[] }>("/stations").then(({ data }) => setStations(data)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  function edit(station: Station) {
    setEditingId(station.id);
    setForm({
      code: station.code,
      name: station.name,
      latitude: String(station.latitude),
      longitude: String(station.longitude),
      elevation_m: station.elevation_m === null ? "" : String(station.elevation_m),
      region: station.region,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage(""); setSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(), name: form.name.trim(),
      latitude: Number(form.latitude), longitude: Number(form.longitude),
      elevation_m: form.elevation_m === "" ? null : Number(form.elevation_m), region: form.region.trim(),
    };
    try {
      await api(editingId ? `/stations/${editingId}` : "/stations", {
        method: editingId ? "PUT" : "POST", auth: true, body: JSON.stringify(payload),
      });
      setMessage(editingId ? "Station berhasil diperbarui." : "Station berhasil ditambahkan.");
      setEditingId(null); setForm(empty); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal menyimpan station."); }
    finally { setSaving(false); }
  }

  async function remove(station: Station) {
    if (!window.confirm(`Hapus ${station.code} beserta semua reading-nya?`)) return;
    setError("");
    try { await api(`/stations/${station.id}`, { method: "DELETE", auth: true }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal menghapus station."); }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <section className="card h-fit p-5">
        <h2 className="font-black text-slate-900">{editingId ? "Edit station" : "Add station"}</h2>
        <p className="mt-1 text-sm text-slate-500">Write action membutuhkan reviewer login.</p>
        {error ? <div className="mt-4"><ErrorNotice message={error} /></div> : null}
        {message ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div> : null}
        <form onSubmit={submit} className="mt-5 grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Code</label><input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="SBY-02" required /></div>
            <div><label className="label">Region</label><input className="input" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="Jawa Timur" required /></div>
          </div>
          <div><label className="label">Station name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Latitude</label><input className="input" type="number" step="any" min="-90" max="90" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} required /></div>
            <div><label className="label">Longitude</label><input className="input" type="number" step="any" min="-180" max="180" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} required /></div>
          </div>
          <div><label className="label">Elevation (m)</label><input className="input" type="number" step="0.01" value={form.elevation_m} onChange={(e) => setForm({ ...form, elevation_m: e.target.value })} /></div>
          <div className="flex gap-2"><button disabled={saving} className="btn btn-primary flex-1">{saving ? "Saving…" : editingId ? "Save changes" : "Add station"}</button>{editingId ? <button type="button" className="btn btn-secondary" onClick={() => { setEditingId(null); setForm(empty); }}>Cancel</button> : null}</div>
        </form>
      </section>

      <section className="card p-4 md:p-5">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Station</th><th>Region</th><th>Coordinates</th><th>Elevation</th><th>Readings</th><th>Last reading</th><th>Actions</th></tr></thead>
            <tbody>
              {stations.map((station) => (
                <tr key={station.id}>
                  <td><Link className="font-extrabold text-teal-800 hover:underline" href={`/stations/${station.id}`}>{station.code}<div className="mt-1 font-medium text-slate-600">{station.name}</div></Link></td>
                  <td>{station.region}</td><td className="whitespace-nowrap">{formatNumber(station.latitude, 4)}, {formatNumber(station.longitude, 4)}</td><td>{formatNumber(station.elevation_m)} m</td><td>{station.readings_count ?? 0}</td><td className="whitespace-nowrap text-xs text-slate-500">{formatDateTime(station.last_reading_at)}</td>
                  <td><div className="flex gap-2"><button className="btn btn-secondary !px-3 !py-2 text-xs" onClick={() => edit(station)}>Edit</button><button className="btn btn-danger !px-3 !py-2 text-xs" onClick={() => remove(station)}>Delete</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
