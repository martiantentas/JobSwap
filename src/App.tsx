import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { JobStack } from "./components/JobStack";
import { JobSwapProfile } from "./types";
import { 
  Users, 
  MessageSquare, 
  User as UserIcon, 
  LogOut, 
  Linkedin, 
  Heart, 
  MapPin, 
  Compass,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type View = "discovery" | "matches" | "profile";

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
      if (data.match) {
        setMatchUser(data.user);
      }
    } catch (err) {
      console.error("Swipe failed", err);
    }
  };

  if (!user) {
    return <LandingPage onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pb-24">
      {/* Header */}
      <header className="w-full max-w-lg bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Zap className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <h1 className="text-xl font-black text-indigo-900 tracking-tighter uppercase">JobSwap</h1>
        </div>
        <button 
          onClick={logout}
          className="p-2 transition-colors hover:text-rose-500 text-gray-400"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-lg flex-1 flex flex-col pt-8 px-4 overflow-hidden">
        {currentView === "discovery" && <JobStack onSwipe={handleSwipe} />}
        {currentView === "matches" && <MatchesView />}
        {currentView === "profile" && <ProfileView user={user} />}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md border border-gray-100 rounded-full shadow-2xl px-2 py-2 flex items-center gap-1">
        <NavButton 
          active={currentView === "discovery"} 
          onClick={() => setCurrentView("discovery")}
          icon={<Compass className="w-6 h-6" />}
          label="Explore"
        />
        <NavButton 
          active={currentView === "matches"} 
          onClick={() => setCurrentView("matches")}
          icon={<MessageSquare className="w-6 h-6" />}
          label="Matches"
        />
        <NavButton 
          active={currentView === "profile"} 
          onClick={() => setCurrentView("profile")}
          icon={<UserIcon className="w-6 h-6" />}
          label="Profile"
        />
      </nav>

      <MatchOverlay user={matchUser} onClose={() => setMatchUser(null)} />
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
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

function LandingPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-indigo-900 flex flex-col items-center justify-center p-6 text-center text-white overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10"
      >
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
          className="bg-white text-indigo-900 px-8 py-5 rounded-full font-bold text-lg flex items-center gap-3 shadow-2xl hover:scale-105 transition-transform active:scale-95"
        >
          <Linkedin className="w-6 h-6 fill-indigo-900" />
          Connect with LinkedIn
        </button>
        
        <p className="mt-8 text-indigo-300 text-sm">
          Join 2,400+ professionals making the switch.
        </p>
      </motion.div>
    </div>
  );
}

function MatchesView() {
  const [matches, setMatches] = useState<JobSwapProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then(res => res.json())
      .then(async user => {
        if (user.matches.length > 0) {
          const matchData = await Promise.all(
            user.matches.map((id: string) => fetch(`/api/users/${id}`).then(r => r.json()))
          );
          setMatches(matchData.filter(m => !m.error));
        }
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-gray-900">Your Matches</h2>
      <div className="grid grid-cols-2 gap-4">
        {matches.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-gray-400">
            No matches yet. Keep exploring!
          </div>
        ) : (
          matches.map(m => (
            <div key={m.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
              <img src={m.picture} className="w-20 h-20 rounded-full border-2 border-indigo-100 mb-3" />
              <span className="font-bold text-gray-900">{m.name}</span>
              <span className="text-xs text-indigo-600 font-medium uppercase mt-1">{m.role}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ProfileView({ user }: { user: JobSwapProfile }) {
  return (
    <div className="flex flex-col gap-6 items-center">
      <div className="relative">
        <img src={user.picture} className="w-32 h-32 rounded-full border-4 border-white shadow-xl" />
        <div className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full border-4 border-white">
          <Zap className="w-5 h-5 text-white" fill="currentColor" />
        </div>
      </div>
      
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
        <p className="text-indigo-600 font-medium">{user.role}</p>
      </div>

      <div className="w-full bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col gap-6">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">Working Pattern</label>
          <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <MapPin className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Living in</span>
                <span className="text-sm font-bold text-gray-900">{user.homeCity}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-medium text-gray-500">Commuting to</span>
                <span className="text-sm font-bold text-indigo-600">{user.workCity}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">Bio</label>
          <p className="text-gray-600 leading-relaxed italic">"{user.bio}"</p>
        </div>
      </div>
    </div>
  );
}

function MatchOverlay({ user, onClose }: { user: JobSwapProfile | null, onClose: () => void }) {
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
           <img src={user.picture} className="w-24 h-24 rounded-full border-4 border-indigo-400" />
           <Zap className="w-8 h-8 text-indigo-400" />
           <div className="w-24 h-24 rounded-full border-4 border-dashed border-indigo-400 flex items-center justify-center">
             <UserIcon className="w-12 h-12 text-indigo-400" />
           </div>
        </div>

        <button 
          onClick={onClose}
          className="bg-white text-indigo-900 px-12 py-4 rounded-full font-bold text-lg shadow-2xl"
        >
          Send Message
        </button>
        <button 
          onClick={onClose}
          className="mt-4 text-indigo-200 font-medium hover:text-white"
        >
          Keep Swiping
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}
