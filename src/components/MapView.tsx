import React, { useEffect, useRef } from "react";
import maplibregl, { Map as MLMap, Marker, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { JobSwapProfile } from "../types";

const CITY_COORDS: Record<string, [number, number]> = {
  "San Francisco": [-122.4194, 37.7749],
  "San Jose":      [-121.8863, 37.3382],
  "Oakland":       [-122.2712, 37.8044],
  "Palo Alto":     [-122.1430, 37.4419],
  "Mountain View": [-122.0839, 37.3861],
  "Berkeley":      [-122.2727, 37.8716],
  "Sunnyvale":     [-122.0363, 37.3688],
  "Santa Clara":   [-121.9552, 37.3541],
  "Fremont":       [-121.9886, 37.5485],
  "San Mateo":     [-122.3255, 37.5630],
  "Redwood City":  [-122.2363, 37.4853],
  "New York":      [-74.0060, 40.7128],
  "Los Angeles":   [-118.2437, 34.0522],
  "Seattle":       [-122.3321, 47.6062],
  "Austin":        [-97.7431, 30.2672],
  "Boston":        [-71.0589, 42.3601],
  "Chicago":       [-87.6298, 41.8781],
};

const DEFAULT_CENTER: [number, number] = [-122.0700, 37.5630];
const DEFAULT_ZOOM = 9.5;

const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

function buildMarkerEl(count: number, highlighted: boolean): HTMLDivElement {
  const el = document.createElement("div");
  const bg = highlighted ? "#4f46e5" : "#1e293b";
  const size = highlighted ? 42 : 36;
  el.style.cssText = `
    background:${bg};
    color:white;
    width:${size}px;
    height:${size}px;
    border-radius:50%;
    display:flex;
    align-items:center;
    justify-content:center;
    font-family:system-ui,sans-serif;
    font-size:13px;
    font-weight:700;
    border:2.5px solid white;
    box-shadow:0 2px 8px rgba(0,0,0,0.25);
    transition:all .15s;
    cursor:pointer;
  `;
  el.textContent = String(count);
  return el;
}

function buildPopupHTML(city: string, profiles: JobSwapProfile[]) {
  const rows = profiles.map(p => `
    <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid #f1f5f9;">
      <img src="${p.picture}" alt="" style="width:24px;height:24px;border-radius:9999px;object-fit:cover;" />
      <div>
        <div style="font-size:12px;font-weight:600;color:#0f172a;">${escapeHtml(p.name)}</div>
        <div style="font-size:10px;color:#94a3b8;">${escapeHtml(p.role)}</div>
      </div>
    </div>
  `).join("");
  return `
    <div style="min-width:160px;font-family:system-ui,sans-serif;">
      <div style="font-weight:700;color:#0f172a;margin-bottom:2px;">${escapeHtml(city)}</div>
      <div style="font-size:11px;color:#64748b;margin-bottom:4px;">
        ${profiles.length} professional${profiles.length > 1 ? "s" : ""}
      </div>
      ${rows}
    </div>
  `;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]!));
}

interface MapViewProps {
  profiles: JobSwapProfile[];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}

export function MapView({ profiles, hoveredId, onHover }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markersRef = useRef<Marker[]>([]);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OPENFREEMAP_STYLE,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "top-right");
    mapRef.current = map;

    // Ensure proper sizing once the container has real dimensions
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);
    const t = setTimeout(() => map.resize(), 200);

    return () => {
      clearTimeout(t);
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Re-render markers when profiles or hover change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Group by workCity
    const groups: Record<string, JobSwapProfile[]> = {};
    for (const p of profiles) {
      if (!CITY_COORDS[p.workCity]) continue;
      (groups[p.workCity] ||= []).push(p);
    }

    Object.entries(groups).forEach(([city, cityProfiles]) => {
      const coords = CITY_COORDS[city];
      const isHighlighted = cityProfiles.some(p => p.id === hoveredId);
      const el = buildMarkerEl(cityProfiles.length, isHighlighted);

      const popup = new maplibregl.Popup({ offset: 22, closeButton: false })
        .setHTML(buildPopupHTML(city, cityProfiles));

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(coords)
        .setPopup(popup)
        .addTo(map);

      el.addEventListener("mouseenter", () => onHover(cityProfiles[0].id));
      el.addEventListener("mouseleave", () => onHover(null));

      markersRef.current.push(marker);
    });
  }, [profiles, hoveredId]);

  // Fly to hovered city
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hoveredId) return;
    const city = profiles.find(p => p.id === hoveredId)?.workCity;
    if (!city || !CITY_COORDS[city]) return;
    map.easeTo({ center: CITY_COORDS[city], duration: 600 });
  }, [hoveredId, profiles]);

  return <div ref={containerRef} className="w-full h-full" />;
}
