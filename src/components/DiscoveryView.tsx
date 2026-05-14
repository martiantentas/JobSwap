import React, { useState, useEffect } from "react";
import {
  Search, SlidersHorizontal, ChevronDown, Map, List,
  LayoutGrid, Heart, X, MapPin, DollarSign, Clock, ChevronRight,
} from "lucide-react";
import { JobSwapProfile } from "../types";
import { MapView } from "./MapView";

type SortBy = "match" | "salary-high" | "salary-low" | "experience";
type ViewMode = "list" | "split" | "map";

interface Filters {
  query: string;
  salaryMin: number;
  industry: string;
  workCity: string;
  expMin: number;
}

const DEFAULTS: Filters = { query: "", salaryMin: 0, industry: "", workCity: "", expMin: 0 };

interface DiscoveryViewProps {
  onSwipe: (id: string, dir: "left" | "right") => void;
}

export function DiscoveryView({ onSwipe }: DiscoveryViewProps) {
  const [profiles, setProfiles] = useState<JobSwapProfile[]>([]);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [passed, setPassed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(DEFAULTS);
  const [sortBy, setSortBy] = useState<SortBy>("match");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/discovery")
      .then(r => r.json())
      .then(data => { setProfiles(data); setLoading(false); });
  }, []);

  const handleAction = (id: string, dir: "left" | "right") => {
    onSwipe(id, dir);
    if (dir === "right") setLiked(s => new Set([...s, id]));
    else setPassed(s => new Set([...s, id]));
  };

  // Filter
  const filtered = profiles
    .filter(p => !passed.has(p.id))
    .filter(p => {
      if (filters.query) {
        const q = filters.query.toLowerCase();
        const haystack = [p.name, p.role, p.industry ?? "", p.homeCity, p.workCity].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filters.industry && p.industry !== filters.industry) return false;
      if (filters.workCity && !p.workCity.toLowerCase().includes(filters.workCity.toLowerCase())) return false;
      if (filters.salaryMin && (p.salaryMax ?? 0) < filters.salaryMin) return false;
      if (filters.expMin && (p.yearsOfExperience ?? 0) < filters.expMin) return false;
      return true;
    });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "salary-high") return (b.salaryMax ?? 0) - (a.salaryMax ?? 0);
    if (sortBy === "salary-low") return (a.salaryMin ?? 0) - (b.salaryMin ?? 0);
    if (sortBy === "experience") return (b.yearsOfExperience ?? 0) - (a.yearsOfExperience ?? 0);
    return 0;
  });

  const industries = [...new Set(profiles.map(p => p.industry).filter(Boolean))] as string[];
  const cities = [...new Set(profiles.map(p => p.workCity))];
  const activeFilterCount = [filters.industry, filters.workCity, filters.salaryMin > 0, filters.expMin > 0].filter(Boolean).length;
  const hasActiveFilters = !!(activeFilterCount || filters.query);

  return (
    <div className="flex flex-col h-full w-full min-w-0 flex-1">

      {/* ── Search & filter bar ── */}
      <div className="shrink-0 bg-white border-b border-gray-100 px-4 pt-3 pb-2 space-y-2.5">
        {/* Search row */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
              placeholder="Search by role, city or industry…"
              value={filters.query}
              onChange={e => setFilters(f => ({ ...f, query: e.target.value }))}
            />
            {filters.query && (
              <button onClick={() => setFilters(f => ({ ...f, query: "" }))} className="text-gray-300 hover:text-gray-500">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          <Chip
            label={filters.industry || "Industry"}
            active={!!filters.industry}
            onClear={() => setFilters(f => ({ ...f, industry: "" }))}
          >
            <select
              className="appearance-none bg-transparent outline-none text-xs cursor-pointer"
              value={filters.industry}
              onChange={e => setFilters(f => ({ ...f, industry: e.target.value }))}
            >
              <option value="">All industries</option>
              {industries.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </Chip>

          <Chip
            label={filters.workCity || "Office city"}
            active={!!filters.workCity}
            onClear={() => setFilters(f => ({ ...f, workCity: "" }))}
          >
            <select
              className="appearance-none bg-transparent outline-none text-xs cursor-pointer"
              value={filters.workCity}
              onChange={e => setFilters(f => ({ ...f, workCity: e.target.value }))}
            >
              <option value="">All cities</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Chip>

          <Chip
            label={filters.salaryMin > 0 ? `$${filters.salaryMin / 1000}k+` : "Min. salary"}
            active={filters.salaryMin > 0}
            onClear={() => setFilters(f => ({ ...f, salaryMin: 0 }))}
          >
            <select
              className="appearance-none bg-transparent outline-none text-xs cursor-pointer"
              value={filters.salaryMin}
              onChange={e => setFilters(f => ({ ...f, salaryMin: Number(e.target.value) }))}
            >
              <option value={0}>Any</option>
              <option value={80000}>$80k+</option>
              <option value={100000}>$100k+</option>
              <option value={120000}>$120k+</option>
              <option value={150000}>$150k+</option>
              <option value={180000}>$180k+</option>
            </select>
          </Chip>

          <Chip
            label={filters.expMin > 0 ? `${filters.expMin}+ yrs` : "Experience"}
            active={filters.expMin > 0}
            onClear={() => setFilters(f => ({ ...f, expMin: 0 }))}
          >
            <select
              className="appearance-none bg-transparent outline-none text-xs cursor-pointer"
              value={filters.expMin}
              onChange={e => setFilters(f => ({ ...f, expMin: Number(e.target.value) }))}
            >
              <option value={0}>Any</option>
              <option value={2}>2+ yrs</option>
              <option value={5}>5+ yrs</option>
              <option value={8}>8+ yrs</option>
              <option value={10}>10+ yrs</option>
            </select>
          </Chip>

          {hasActiveFilters && (
            <button
              onClick={() => setFilters(DEFAULTS)}
              className="shrink-0 text-xs text-rose-500 font-medium hover:text-rose-700 whitespace-nowrap px-1"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* ── Results bar ── */}
      <div className="shrink-0 bg-white border-b border-gray-100 px-4 py-2 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          <span className="font-semibold text-gray-800">{sorted.length}</span> professionals found
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 hidden sm:block">Sort:</span>
            <select
              className="text-xs font-medium text-gray-700 outline-none bg-transparent cursor-pointer"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortBy)}
            >
              <option value="match">Best match</option>
              <option value="salary-high">Salary ↓</option>
              <option value="salary-low">Salary ↑</option>
              <option value="experience">Experience</option>
            </select>
          </div>
          {/* View toggle */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <ViewBtn active={viewMode === "list"}  onClick={() => setViewMode("list")}  title="List view"><List className="w-3.5 h-3.5" /></ViewBtn>
            <ViewBtn active={viewMode === "split"} onClick={() => setViewMode("split")} title="Split view"><LayoutGrid className="w-3.5 h-3.5" /></ViewBtn>
            <ViewBtn active={viewMode === "map"}   onClick={() => setViewMode("map")}   title="Map view"><Map className="w-3.5 h-3.5" /></ViewBtn>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden bg-gray-50">

        {/* List panel */}
        {viewMode !== "map" && (
          <div className={`flex flex-col min-h-0 ${
            viewMode === "split"
              ? "w-full md:w-1/2 lg:w-[55%] xl:w-[50%] 2xl:w-[45%] md:shrink-0 md:border-r md:border-gray-200"
              : "flex-1"
          }`}>
            {loading ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : sorted.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <Search className="w-10 h-10 text-gray-200" />
                <p className="font-medium text-gray-500">No results match your filters</p>
                <button onClick={() => setFilters(DEFAULTS)} className="text-sm text-indigo-600 font-medium hover:underline">
                  Clear filters
                </button>
              </div>
            ) : (
              <div className={`flex-1 overflow-y-auto p-4 ${
                viewMode === "list"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 content-start auto-rows-min"
                  : "grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3 content-start auto-rows-min"
              }`}>
                {sorted.map(p => (
                  <JobCard
                    key={p.id}
                    profile={p}
                    layout={viewMode}
                    liked={liked.has(p.id)}
                    hovered={hoveredId === p.id}
                    onHover={setHoveredId}
                    onAction={handleAction}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Map panel — hidden on mobile when in split (only mobile map button shows it) */}
        {viewMode !== "list" && (
          <div className={`flex-1 min-h-0 ${viewMode === "split" ? "hidden md:block" : ""}`}>
            <MapView profiles={sorted} hoveredId={hoveredId} onHover={setHoveredId} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Filter chip ──

function Chip({ label, active, children, onClear }: {
  label: string; active: boolean; onClear: () => void; children: React.ReactNode;
}) {
  return (
    <div className={`inline-flex items-center gap-1.5 shrink-0 border rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
      active
        ? "bg-indigo-50 border-indigo-300 text-indigo-700"
        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
    }`}>
      {children}
      <ChevronDown className="w-3 h-3 opacity-50 shrink-0" />
      {active && (
        <button
          onClick={e => { e.stopPropagation(); onClear(); }}
          className="hover:text-rose-500 shrink-0 -mr-0.5"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
}

// ── View toggle button ──

function ViewBtn({ active, onClick, title, children }: {
  active: boolean; onClick: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`px-2.5 py-1.5 transition-colors ${active ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"}`}
    >
      {children}
    </button>
  );
}

// ── Job card ──

interface JobCardProps {
  profile: JobSwapProfile;
  layout: ViewMode;
  liked: boolean;
  hovered: boolean;
  onHover: (id: string | null) => void;
  onAction: (id: string, dir: "left" | "right") => void;
}

function JobCard({ profile, layout, liked, hovered, onHover, onAction }: JobCardProps) {
  const p = profile;
  const fmtSalary = (n: number) => `$${(n / 1000).toFixed(0)}k`;

  if (layout === "split") {
    // Compact horizontal card
    return (
      <div
        className={`bg-white rounded-xl overflow-hidden border flex transition-all ${
          hovered ? "border-indigo-300 shadow-lg" : liked ? "border-green-200" : "border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200"
        }`}
        onMouseEnter={() => onHover(p.id)}
        onMouseLeave={() => onHover(null)}
      >
        {/* Thumbnail */}
        <div className="w-24 shrink-0 bg-gradient-to-br from-indigo-50 to-purple-50 relative">
          <img src={p.picture} alt={p.name} className="w-full h-full object-cover" />
          {liked && (
            <div className="absolute inset-0 bg-indigo-600/10 flex items-center justify-center">
              <div className="bg-indigo-600 rounded-full p-1"><Heart className="w-3 h-3 text-white fill-white" /></div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 p-3 flex flex-col justify-between gap-1.5">
          <div>
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate leading-tight">{p.name}</p>
                <p className="text-xs text-indigo-600 font-medium truncate">{p.role}</p>
              </div>
              {p.industry && (
                <span className="shrink-0 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">{p.industry}</span>
              )}
            </div>

            <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
              <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
              <span className="truncate">{p.homeCity} <span className="text-gray-300">→</span> <span className="text-indigo-600 font-medium">{p.workCity}</span></span>
            </div>

            <div className="flex items-center gap-3 mt-1">
              {p.salaryMin && (
                <span className="flex items-center gap-0.5 text-[11px] text-gray-500">
                  <DollarSign className="w-3 h-3 text-gray-400" />
                  {fmtSalary(p.salaryMin)}–{fmtSalary(p.salaryMax ?? 0)}
                </span>
              )}
              {p.yearsOfExperience !== undefined && (
                <span className="flex items-center gap-0.5 text-[11px] text-gray-500">
                  <Clock className="w-3 h-3 text-gray-400" />
                  {p.yearsOfExperience} yrs
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={liked}
              onClick={() => onAction(p.id, "right")}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors ${
                liked ? "bg-green-50 text-green-600 border border-green-200 cursor-default" : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {liked ? "✓ Connected" : "Connect"}
            </button>
            <button
              onClick={() => onAction(p.id, "left")}
              className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-500 hover:border-rose-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vertical card for list / grid view
  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden border flex flex-col transition-all ${
        hovered ? "border-indigo-300 shadow-xl" : liked ? "border-green-200 shadow-sm" : "border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200"
      }`}
      onMouseEnter={() => onHover(p.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Photo */}
      <div className="relative h-44 bg-gradient-to-br from-indigo-100 to-purple-100 shrink-0">
        <img src={p.picture} alt={p.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Industry badge */}
        {p.industry && (
          <span className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm text-[11px] font-semibold px-2 py-0.5 rounded-full text-gray-700 shadow-sm">
            {p.industry}
          </span>
        )}

        {/* Save button */}
        <button
          onClick={() => onAction(p.id, "right")}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full shadow flex items-center justify-center transition-all ${
            liked ? "bg-rose-500 text-white scale-110" : "bg-white/90 backdrop-blur-sm text-gray-400 hover:text-rose-500 hover:scale-110"
          }`}
        >
          <Heart className={`w-4 h-4 ${liked ? "fill-white" : ""}`} />
        </button>

        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-6">
          <p className="font-bold text-white text-sm leading-tight">{p.name}</p>
          <p className="text-white/75 text-xs font-medium">{p.role}</p>
        </div>
      </div>

      {/* Card body */}
      <div className="p-3.5 flex flex-col gap-2.5 flex-1">
        {/* Route */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>{p.homeCity}</span>
          <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
          <span className="text-indigo-600 font-semibold">{p.workCity}</span>
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-4">
          {p.salaryMin && (
            <div className="flex items-center gap-1 text-xs font-medium text-gray-700">
              <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
              <span>{fmtSalary(p.salaryMin)} – {fmtSalary(p.salaryMax ?? 0)}</span>
            </div>
          )}
          {p.yearsOfExperience !== undefined && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>{p.yearsOfExperience} yrs exp</span>
            </div>
          )}
        </div>

        {/* Skills */}
        {p.skills && p.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {p.skills.slice(0, 4).map(s => (
              <span key={s} className="bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded-full">{s}</span>
            ))}
            {p.skills.length > 4 && (
              <span className="text-[11px] text-gray-400">+{p.skills.length - 4}</span>
            )}
          </div>
        )}

        {/* Bio snippet */}
        {p.bio && (
          <p className="text-xs text-gray-400 italic line-clamp-2 leading-relaxed">"{p.bio}"</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto pt-1">
          <button
            disabled={liked}
            onClick={() => onAction(p.id, "right")}
            className={`flex-1 text-xs font-semibold py-2 rounded-xl transition-colors ${
              liked
                ? "bg-green-50 text-green-600 border border-green-200 cursor-default"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {liked ? "✓ Connected" : "Connect"}
          </button>
          <button
            onClick={() => onAction(p.id, "left")}
            className="w-9 h-9 border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:text-rose-500 hover:border-rose-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
