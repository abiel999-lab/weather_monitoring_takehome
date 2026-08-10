export function MetricCard({ label, value, unit, helper }: { label: string; value: string | number; unit?: string; helper?: string }) {
  return (
    <div className="card p-4 md:p-5">
      <div className="text-xs font-extrabold uppercase tracking-[0.11em] text-slate-500">{label}</div>
      <div className="mt-3 flex items-end gap-1.5">
        <div className="text-3xl font-black tracking-tight text-slate-950">{value}</div>
        {unit ? <div className="pb-1 text-sm font-bold text-slate-500">{unit}</div> : null}
      </div>
      {helper ? <div className="mt-2 text-xs text-slate-500">{helper}</div> : null}
    </div>
  );
}
