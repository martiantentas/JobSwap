import React, { useState } from "react";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { DiscoveryView } from "./components/DiscoveryView";
import { MessagesView } from "./components/MessagesView";
import { JobSwapProfile } from "./types";
import {
  MessageSquare,
  User as UserIcon,
  LogOut,
  Linkedin,
  Heart,
  MapPin,
  Compass,
  Zap,
  Pencil,
  X,
  Check,
  Plus,
  Briefcase,
  DollarSign,
  Clock,
  Building2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type View = "discovery" | "messages" | "profile";

// ─── Authenticated shell ───────────────────────────────────────────────────────

function AuthenticatedApp() {
  const { user, logout, login } = useAuth();
  const [currentView, setCurrentView] = useState<View>("discovery");
  const [matchUser, setMatchUser] = useState<JobSwapProfile | null>(null);

  const handleSwipe = async (targetId: string, direction: "left" | "right") => {
    try {
      const res = await fetch("/api/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, direction }),
      });
      const data = await res.json();
      if (data.match) setMatchUser(data.user);
    } catch (err) {
      console.error("Swipe failed", err);
    }
  };

  if (!user) return <LandingPage onLogin={login} />;

  const isMessages = currentView === "messages";

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-20 lg:w-64 bg-white border-r border-gray-100 h-full shrink-0 p-4 lg:p-6">
        <div className="flex items-center gap-2 mb-10 px-1">
          <div className="bg-indigo-600 p-1.5 rounded-lg shrink-0">
            <Zap className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <h1 className="text-xl font-black text-indigo-900 tracking-tighter uppercase hidden lg:block">JobSwap</h1>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          <SideNavItem active={currentView === "discovery"} onClick={() => setCurrentView("discovery")} icon={<Compass className="w-6 h-6" />} label="Explore" />
          <SideNavItem active={currentView === "messages"}  onClick={() => setCurrentView("messages")}  icon={<MessageSquare className="w-6 h-6" />} label="Messages" />
          <SideNavItem active={currentView === "profile"}   onClick={() => setCurrentView("profile")}   icon={<UserIcon className="w-6 h-6" />} label="Profile" />
        </nav>
        <button
          onClick={logout}
          className="flex items-center gap-3 p-3 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-6 h-6 shrink-0" />
          <span className="hidden lg:block font-medium">Logout</span>
        </button>
      </aside>

      {/* ── Content column ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full">

        {/* Mobile-only header */}
        <header className="md:hidden shrink-0 w-full bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-50">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Zap className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <h1 className="text-xl font-black text-indigo-900 tracking-tighter uppercase">JobSwap</h1>
          </div>
          <button onClick={logout} className="p-2 transition-colors hover:text-rose-500 text-gray-400">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {/* Main area — full-height for discovery & messages, scrollable for profile */}
        {(currentView === "discovery" || isMessages) ? (
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {currentView === "discovery" && <DiscoveryView onSwipe={handleSwipe} />}
            {isMessages                  && <MessagesView />}
          </div>
        ) : (
          <main className="flex-1 overflow-y-auto flex flex-col items-center pt-8 px-4 pb-32 md:pb-10">
            <div className="w-full max-w-md lg:max-w-lg">
              {currentView === "profile" && <ProfileView user={user} />}
            </div>
          </main>
        )}
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md border border-gray-100 rounded-full shadow-2xl px-2 py-2 flex items-center gap-1 z-50">
        <NavButton active={currentView === "discovery"} onClick={() => setCurrentView("discovery")} icon={<Compass className="w-6 h-6" />} label="Explore" />
        <NavButton active={currentView === "messages"}  onClick={() => setCurrentView("messages")}  icon={<MessageSquare className="w-6 h-6" />} label="Messages" />
        <NavButton active={currentView === "profile"}   onClick={() => setCurrentView("profile")}   icon={<UserIcon className="w-6 h-6" />} label="Profile" />
      </nav>

      <MatchOverlay user={matchUser} onClose={() => setMatchUser(null)} />
    </div>
  );
}

// ─── Nav helpers ──────────────────────────────────────────────────────────────

function SideNavItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl transition-all font-medium ${
        active ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="hidden lg:block">{label}</span>
      {active && <span className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />}
    </button>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
        active ? "bg-indigo-600 text-white shadow-lg" : "text-gray-400 hover:text-indigo-600"
      }`}
    >
      {icon}
      {active && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-sm font-bold uppercase tracking-wider"
        >
          {label}
        </motion.span>
      )}
    </button>
  );
}

// ─── Landing ──────────────────────────────────────────────────────────────────

function LandingPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-indigo-900 flex flex-col items-center justify-center p-6 text-center text-white overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500 rounded-full blur-[100px]" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="z-10">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-3xl inline-block mb-8">
          <Zap className="w-12 h-12" fill="white" />
        </div>
        <h1 className="text-6xl font-black tracking-tighter uppercase mb-4 italic">JobSwap</h1>
        <p className="text-xl text-indigo-100 max-w-xs mx-auto mb-12">
          Sync roles. Swap regions. <br />
          <span className="font-bold">Work where you live.</span>
        </p>
        <button
          onClick={onLogin}
          className="bg-white text-indigo-900 px-8 py-5 rounded-full font-bold text-lg flex items-center gap-3 shadow-2xl hover:scale-105 transition-transform active:scale-95 mx-auto"
        >
          <Linkedin className="w-6 h-6 fill-indigo-900" />
          Connect with LinkedIn
        </button>
        <p className="mt-8 text-indigo-300 text-sm">Join 2,400+ professionals making the switch.</p>
      </motion.div>
    </div>
  );
}

// ─── Profile view + edit ──────────────────────────────────────────────────────

function ProfileView({ user }: { user: JobSwapProfile }) {
  const { refresh } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<JobSwapProfile>>({});
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setForm({ ...user });
    setSkillInput("");
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      await refresh();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    setForm(f => ({ ...f, skills: [...(f.skills ?? []), s] }));
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setForm(f => ({ ...f, skills: (f.skills ?? []).filter(s => s !== skill) }));
  };

  // ── Edit form ──
  if (editing) {
    const f = form as JobSwapProfile;
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors">
              <Check className="w-4 h-4" />{saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        {/* Avatar */}
        <div className="flex justify-center">
          <img src={user.picture} className="w-24 h-24 rounded-full border-4 border-white shadow-lg" alt="" />
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
          <Field label="Full name" value={f.name ?? ""} onChange={v => setForm(p => ({ ...p, name: v }))} />
          <Field label="Job title" value={f.role ?? ""} onChange={v => setForm(p => ({ ...p, role: v }))} />
          <Field label="Industry" value={f.industry ?? ""} onChange={v => setForm(p => ({ ...p, industry: v }))} placeholder="e.g. FinTech, HealthTech" />
          <Field label="Years of experience" type="number" value={String(f.yearsOfExperience ?? "")} onChange={v => setForm(p => ({ ...p, yearsOfExperience: Number(v) }))} />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Salary min ($/yr)" type="number" value={String(f.salaryMin ?? "")} onChange={v => setForm(p => ({ ...p, salaryMin: Number(v) }))} />
            <Field label="Salary max ($/yr)" type="number" value={String(f.salaryMax ?? "")} onChange={v => setForm(p => ({ ...p, salaryMax: Number(v) }))} />
          </div>

          <Field label="Home city" value={f.homeCity ?? ""} onChange={v => setForm(p => ({ ...p, homeCity: v }))} />
          <Field label="Office city" value={f.workCity ?? ""} onChange={v => setForm(p => ({ ...p, workCity: v }))} />

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">Bio</label>
            <textarea
              rows={3}
              value={f.bio ?? ""}
              onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">Job description</label>
            <textarea
              rows={4}
              value={f.jobDescription ?? ""}
              onChange={e => setForm(p => ({ ...p, jobDescription: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              placeholder="Describe your current role and responsibilities…"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">Skills</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(f.skills ?? []).map(s => (
                <span key={s} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full">
                  {s}
                  <button onClick={() => removeSkill(s)} className="hover:text-rose-500"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Add a skill…"
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())}
              />
              <button onClick={addSkill} className="px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Display mode ──
  return (
    <div className="flex flex-col gap-5">
      {/* Header card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center gap-3">
        <div className="relative">
          <img src={user.picture} className="w-24 h-24 rounded-full border-4 border-white shadow-lg" alt="" />
          <div className="absolute bottom-0 right-0 bg-indigo-600 p-1.5 rounded-full border-4 border-white">
            <Zap className="w-3.5 h-3.5 text-white" fill="currentColor" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
          <p className="text-indigo-600 font-medium text-sm">{user.role}</p>
          {user.industry && <p className="text-gray-400 text-xs mt-0.5">{user.industry}</p>}
        </div>
        <button
          onClick={startEdit}
          className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit Profile
        </button>
      </div>

      {/* Info grid */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
        {/* Commute */}
        <InfoRow icon={<MapPin className="w-4 h-4 text-indigo-500" />} label="Swap route">
          <span className="font-semibold text-gray-900">{user.homeCity}</span>
          <span className="text-gray-400 mx-1">→</span>
          <span className="font-semibold text-indigo-600">{user.workCity}</span>
        </InfoRow>

        {/* Experience */}
        {user.yearsOfExperience !== undefined && (
          <InfoRow icon={<Clock className="w-4 h-4 text-indigo-500" />} label="Experience">
            <span className="font-semibold text-gray-900">{user.yearsOfExperience} years</span>
          </InfoRow>
        )}

        {/* Salary */}
        {(user.salaryMin || user.salaryMax) && (
          <InfoRow icon={<DollarSign className="w-4 h-4 text-indigo-500" />} label="Salary range">
            <span className="font-semibold text-gray-900">
              {user.salaryMin ? `$${(user.salaryMin / 1000).toFixed(0)}k` : ""}
              {user.salaryMin && user.salaryMax ? " – " : ""}
              {user.salaryMax ? `$${(user.salaryMax / 1000).toFixed(0)}k` : ""}
            </span>
          </InfoRow>
        )}

        {/* Industry */}
        {user.industry && (
          <InfoRow icon={<Building2 className="w-4 h-4 text-indigo-500" />} label="Industry">
            <span className="font-semibold text-gray-900">{user.industry}</span>
          </InfoRow>
        )}
      </div>

      {/* Bio */}
      {user.bio && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">Bio</label>
          <p className="text-gray-600 text-sm leading-relaxed italic">"{user.bio}"</p>
        </div>
      )}

      {/* Job description */}
      {user.jobDescription && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5" /> Role description
          </label>
          <p className="text-gray-600 text-sm leading-relaxed">{user.jobDescription}</p>
        </div>
      )}

      {/* Skills */}
      {user.skills && user.skills.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 block">Skills</label>
          <div className="flex flex-wrap gap-2">
            {user.skills.map(s => (
              <span key={s} className="bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1 rounded-full">{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
      />
    </div>
  );
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-indigo-50 p-2 rounded-lg shrink-0">{icon}</div>
      <div className="flex-1 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
        <div className="flex items-center text-sm">{children}</div>
      </div>
    </div>
  );
}

// ─── Match overlay ─────────────────────────────────────────────────────────────

function MatchOverlay({ user, onClose }: { user: JobSwapProfile | null; onClose: () => void }) {
  if (!user) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-indigo-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center text-white"
    >
      <motion.div
        initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 12 }}
      >
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
          <Heart className="w-24 h-24 text-rose-500 fill-rose-500" />
        </div>
        <h2 className="text-5xl font-black italic tracking-tighter uppercase mb-4">It's a Swap!</h2>
        <p className="text-lg text-indigo-100 mb-12">
          You and <span className="font-bold text-white underline decoration-white/30 decoration-4">{user.name}</span> have liked each other's roles.
        </p>
        <div className="flex items-center gap-6 mb-12">
          <img src={user.picture} className="w-24 h-24 rounded-full border-4 border-indigo-400" alt="" />
          <Zap className="w-8 h-8 text-indigo-400" />
          <div className="w-24 h-24 rounded-full border-4 border-dashed border-indigo-400 flex items-center justify-center">
            <UserIcon className="w-12 h-12 text-indigo-400" />
          </div>
        </div>
        <button onClick={onClose} className="bg-white text-indigo-900 px-12 py-4 rounded-full font-bold text-lg shadow-2xl">
          Send Message
        </button>
        <button onClick={onClose} className="mt-4 block text-indigo-200 font-medium hover:text-white">
          Keep Swiping
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}
