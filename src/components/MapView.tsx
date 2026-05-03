import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { JobSwapProfile } from "../types";

// City coordinates (Bay Area + major US cities)
const CITY_COORDS: Record<string, [number, number]> = {
  "San Francisco": [37.7749, -122.4194],
  "San Jose": [37.3382, -121.8863],
  "Oakland": [37.8044, -122.2712],
  "Palo Alto": [37.4419, -122.1430],
  "Mountain View": [37.3861, -122.0839],
  "Berkeley": [37.8716, -122.2727],
  "Sunnyvale": [37.3688, -122.0363],
  "Santa Clara": [37.3541, -121.9552],
  "Fremont": [37.5485, -121.9886],
  "San Mateo": [37.5630, -122.3255],
  "Redwood City": [37.4853, -122.2363],
  "New York": [40.7128, -74.0060],
  "Los Angeles": [34.0522, -118.2437],
  "Seattle": [47.6062, -122.3321],
  "Austin": [30.2672, -97.7431],
  "Boston": [42.3601, -71.0589],
  "Chicago": [41.8781, -87.6298],
};

const DEFAULT_CENTER: [number, number] = [37.5630, -122.0700];
const DEFAULT_ZOOM = 10;

function makeIcon(count: number, highlighted: boolean) {
  const bg = highlighted ? "#4f46e5" : "#1e293b";
  const size = highlighted ? 40 : 36;
  return L.divIcon({
    className: "",
    html: `<div style="
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
    ">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Recenter map when profiles change
function FlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, map.getZoom(), { duration: 0.8 }); }, [center[0], center[1]]);
  return null;
}

interface MapViewProps {
  profiles: JobSwapProfile[];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}

export function MapView({ profiles, hoveredId, onHover }: MapViewProps) {
  // Group profiles by workCity
  const groups = profiles.reduce<Record<string, JobSwapProfile[]>>((acc, p) => {
    if (CITY_COORDS[p.workCity]) {
      acc[p.workCity] = [...(acc[p.workCity] ?? []), p];
    }
    return acc;
  }, {});

  // Find center: if hovered profile has known coords, fly there
  const hoveredCity = profiles.find(p => p.id === hoveredId)?.workCity;
  const center = (hoveredCity && CITY_COORDS[hoveredCity]) ? CITY_COORDS[hoveredCity] : DEFAULT_CENTER;

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ height: "100%", width: "100%" }}
      zoomControl
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {hoveredId && <FlyTo center={center} />}

      {Object.entries(groups).map(([city, cityProfiles]) => {
        const coords = CITY_COORDS[city];
        const isHighlighted = cityProfiles.some(p => p.id === hoveredId);
        return (
          <Marker
            key={city}
            position={coords}
            icon={makeIcon(cityProfiles.length, isHighlighted)}
            eventHandlers={{
              mouseover: () => onHover(cityProfiles[0].id),
              mouseout: () => onHover(null),
            }}
          >
            <Popup>
              <div className="min-w-[140px]">
                <p className="font-bold text-gray-900 mb-1">{city}</p>
                <p className="text-xs text-gray-500 mb-2">{cityProfiles.length} professional{cityProfiles.length > 1 ? "s" : ""}</p>
                {cityProfiles.map(p => (
                  <div key={p.id} className="flex items-center gap-2 py-1 border-t border-gray-100">
                    <img src={p.picture} alt="" className="w-6 h-6 rounded-full" />
                    <div>
                      <p className="text-xs font-medium text-gray-900">{p.name}</p>
                      <p className="text-[10px] text-gray-400">{p.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
