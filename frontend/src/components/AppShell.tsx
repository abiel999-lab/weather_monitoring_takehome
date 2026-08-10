"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { clearToken, getAuthServerSnapshot, getAuthSnapshot, subscribeAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Station } from "@/lib/types";
import { AiChatDrawer } from "./AiChatDrawer";

const items = [
  { href: "/", label: "Overview", icon: "overview" },
  { href: "/stations", label: "Stations", icon: "stations" },
  { href: "/readings", label: "Readings", icon: "readings" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const authenticated = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthServerSnapshot);
  const [chatStations, setChatStations] = useState<Station[]>([]);

  useEffect(() => {
    let cancelled = false;

    api<{ data: Station[] }>("/stations")
      .then(({ data }) => {
        if (!cancelled) setChatStations(data);
      })
      .catch(() => {
        if (!cancelled) setChatStations([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const detailMatch = pathname.match(/^\/stations\/(\d+)$/);
  const chatStationId = detailMatch ? Number(detailMatch[1]) : null;

  function logout() {
    clearToken();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="hidden min-h-screen border-r border-white/10 bg-[#0b1220] text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="px-5 pb-5 pt-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#16a394] text-sm font-black tracking-tight text-white shadow-[0_8px_24px_rgba(22,163,148,.22)]">WX</div>
            <div>
              <div className="text-[13px] font-extrabold tracking-[-.01em] text-white">Weather Operations</div>
              <div className="mt-0.5 text-[11px] font-medium text-slate-400">Sensor command center</div>
            </div>
          </Link>
        </div>

        <div className="mx-5 h-px bg-white/[.08]" />

        <nav className="flex-1 px-3 py-5">
          <div className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[.18em] text-slate-500">Workspace</div>
          <div className="space-y-1">
            {items.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-bold transition ${
                    active
                      ? "bg-white/[.09] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.05)]"
                      : "text-slate-400 hover:bg-white/[.05] hover:text-slate-100"
                  }`}
                >
                  <span className={`grid h-8 w-8 place-items-center rounded-lg transition ${active ? "bg-[#16a394]/20 text-[#55d9ca]" : "bg-white/[.04] text-slate-500 group-hover:text-slate-300"}`}>
                    <NavIcon name={item.icon} />
                  </span>
                  <span>{item.label}</span>
                  {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#55d9ca]" /> : null}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4">
          <div className="rounded-2xl border border-white/[.08] bg-white/[.04] p-3.5">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-200">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-30" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              System operational
            </div>
            <div className="mt-2 text-[11px] leading-5 text-slate-500">API, database, and sensor data pipeline available.</div>
          </div>

          <div className="mt-3">
            {authenticated ? (
              <button onClick={logout} className="flex w-full items-center justify-center rounded-xl border border-white/[.1] bg-white/[.04] px-3 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-white/[.08] hover:text-white">Sign out</button>
            ) : (
              <Link href="/login" className="flex w-full items-center justify-center rounded-xl bg-white px-3 py-2.5 text-xs font-extrabold text-slate-900 transition hover:bg-slate-100">Reviewer login</Link>
            )}
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex h-[68px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 xl:px-10">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#0e7f75] text-xs font-black text-white">WX</div>
              <div>
                <div className="text-xs font-extrabold text-slate-900">Weather Operations</div>
                <div className="text-[10px] text-slate-500">Sensor command center</div>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="text-[11px] font-extrabold uppercase tracking-[.15em] text-slate-400">Internal operations</div>
              <div className="mt-0.5 text-sm font-semibold text-slate-700">Weather sensor network</div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-extrabold text-emerald-800 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live data
              </div>
              <div className="hidden h-8 w-px bg-slate-200 sm:block" />
              {authenticated ? (
                <button onClick={logout} className="btn btn-secondary text-xs lg:hidden">Sign out</button>
              ) : (
                <Link href="/login" className="btn btn-primary text-xs lg:hidden">Reviewer login</Link>
              )}
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 lg:hidden">
            {items.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-xs font-extrabold ${active ? "bg-teal-50 text-teal-800" : "text-slate-500"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-[1540px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">{children}</main>
      </div>

      <AiChatDrawer stations={chatStations} selectedStationId={chatStationId} />
    </div>
  );
}

function NavIcon({ name }: { name: "overview" | "stations" | "readings" }) {
  if (name === "stations") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2.2" />
      </svg>
    );
  }
  if (name === "readings") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M5 19V9M12 19V5M19 19v-7" />
        <path d="M3 19h18" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="4" y="4" width="6" height="6" rx="1.4" />
      <rect x="14" y="4" width="6" height="10" rx="1.4" />
      <rect x="4" y="14" width="6" height="6" rx="1.4" />
      <rect x="14" y="18" width="6" height="2" rx="1" />
    </svg>
  );
}
