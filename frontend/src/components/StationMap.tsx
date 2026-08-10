"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { Station } from "@/lib/types";

export function StationMap({ stations }: { stations: Station[] }) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderMap() {
      if (!elementRef.current) return;
      const L = await import("leaflet");
      if (cancelled || !elementRef.current) return;

      mapRef.current?.remove();
      const map = L.map(elementRef.current, { scrollWheelZoom: false, zoomControl: true });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      if (!stations.length) {
        map.setView([-2.5, 118], 4);
        return;
      }

      const points = stations.map((station) => {
        const point = L.latLng(station.latitude, station.longitude);
        L.circleMarker(point, {
          radius: 8,
          weight: 3,
          color: "#ffffff",
          fillColor: "#0e7f75",
          fillOpacity: 1,
        })
          .bindPopup(
            `<div style="min-width:150px;padding:2px 0">` +
            `<strong style="font-size:12px;color:#111827">${escapeHtml(station.code)} · ${escapeHtml(station.name)}</strong><br>` +
            `<span style="font-size:11px;color:#667085">${escapeHtml(station.region)} · ${station.elevation_m ?? "—"} m elevation</span>` +
            `</div>`,
          )
          .addTo(map);
        return point;
      });

      if (points.length === 1) map.setView(points[0], 10);
      else map.fitBounds(L.latLngBounds(points).pad(0.25));
    }

    void renderMap();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [stations]);

  return <div ref={elementRef} className="h-[360px] w-full overflow-hidden rounded-xl border border-slate-200" aria-label="Weather station map" />;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}
