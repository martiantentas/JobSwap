import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "motion/react";
import { JobSwapProfile } from "../types";
import { Heart, X, MapPin, Briefcase, Info } from "lucide-react";

interface JobStackProps {
  onSwipe: (targetId: string, direction: "left" | "right") => void;
}

export function JobStack({ onSwipe }: JobStackProps) {
  const [profiles, setProfiles] = useState<JobSwapProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/discovery")
      .then(res => res.json())
      .then(data => {
        setProfiles(data);
        setIsLoading(false);
      });
  }, []);

  const handleSwipeInternal = (direction: "left" | "right") => {
    if (currentIndex >= profiles.length) return;
    const profile = profiles[currentIndex];
    onSwipe(profile.id, direction);
    setCurrentIndex(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-center p-8">
        <div className="bg-indigo-50 p-6 rounded-full mb-4">
          <MapPin className="w-12 h-12 text-indigo-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">No more jobs in this area</h3>
        <p className="text-gray-500 mt-2">Try expanding your search or check back later.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-sm mx-auto h-[600px]">
      <AnimatePresence>
        {profiles.slice(currentIndex, currentIndex + 2).reverse().map((profile, index) => (
          <SwipeCard 
            key={profile.id} 
            profile={profile} 
            isTop={index === 1 || profiles.length - currentIndex === 1}
            onSwipe={handleSwipeInternal}
          />
        ))}
      </AnimatePresence>
      
      {/* Controls */}
      <div className="absolute -bottom-20 left-0 right-0 flex justify-center gap-6">
        <button 
          onClick={() => handleSwipeInternal("left")}
          className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-rose-500 hover:scale-110 active:scale-95 transition-transform"
        >
          <X className="w-8 h-8" />
        </button>
        <button 
          onClick={() => handleSwipeInternal("right")}
          className="w-16 h-16 rounded-full bg-indigo-600 shadow-lg flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform"
        >
          <Heart className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}

interface SwipeCardProps {
  profile: JobSwapProfile;
  isTop: boolean;
  onSwipe: (direction: "left" | "right") => void;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ profile, isTop, onSwipe }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-50, -150], [0, 1]);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100) {
      onSwipe("right");
    } else if (info.offset.x < -100) {
      onSwipe("left");
    }
  };

  return (
    <motion.div
      style={{ x, rotate, zIndex: isTop ? 10 : 0 }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 bg-white rounded-3xl shadow-xl overflow-hidden cursor-grab active:cursor-grabbing border border-gray-100"
    >
      <div className="relative h-2/3">
        <img 
          src={profile.picture || "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=2071&auto=format&fit=crop"} 
          alt={profile.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Swipe Indicators */}
        <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 left-8 border-4 border-indigo-500 rounded-lg px-4 py-1 -rotate-12">
          <span className="text-indigo-500 text-3xl font-black uppercase">Swap</span>
        </motion.div>
        <motion.div style={{ opacity: nopeOpacity }} className="absolute top-8 right-8 border-4 border-rose-500 rounded-lg px-4 py-1 rotate-12">
          <span className="text-rose-500 text-3xl font-black uppercase">Nope</span>
        </motion.div>

        <div className="absolute bottom-6 left-6 right-6 text-white">
          <h2 className="text-2xl font-bold">{profile.name}</h2>
          <div className="flex items-center gap-1 opacity-90 mt-1">
            <Briefcase className="w-4 h-4" />
            <span className="text-sm font-medium">{profile.role}</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider text-gray-400 font-bold">Swap Route</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-semibold text-gray-900">{profile.workCity}</span>
                <span className="text-gray-400">→</span>
                <span className="font-semibold text-indigo-600">{profile.homeCity}</span>
              </div>
            </div>
            <div className="bg-indigo-50 p-2 rounded-xl">
              <MapPin className="w-5 h-5 text-indigo-600" />
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 italic">
            "{profile.bio}"
          </p>
        </div>
      </div>
    </motion.div>
  );
}
