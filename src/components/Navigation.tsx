import React from "react";
import { SpaceConfig } from "../types";
import { Mail, Pin, LogOut, Heart } from "lucide-react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { motion } from "motion/react";

interface NavigationProps {
  activeView: "letters" | "board";
  onViewChange: (view: "letters" | "board") => void;
  spaceConfig: SpaceConfig;
  currentEmail: string;
}

export default function Navigation({ activeView, onViewChange, spaceConfig, currentEmail }: NavigationProps) {
  const isCreator = currentEmail.toLowerCase() === spaceConfig.creatorEmail.toLowerCase();
  const currentUserName = isCreator ? spaceConfig.creatorName : spaceConfig.partnerName;

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <nav className="bg-white border-b border-stone-200/80 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        
        {/* Row 1: Brand Header and Mobile Logout */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shadow-sm shrink-0">
              <Heart className="w-4 h-4 fill-rose-500/10" />
            </div>
            <div>
              <div className="font-serif text-base font-semibold text-stone-800 whitespace-nowrap">
                Letters to Fatima
              </div>
              <span className="text-[10px] text-stone-400 font-mono block">Our Locked Space</span>
            </div>
          </div>

          {/* Logout button for Mobile Only */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center text-stone-400 hover:text-rose-600 p-2 hover:bg-stone-50 rounded-lg transition cursor-pointer"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Row 2: Tab Switcher (centered and stretched on mobile, inline on desktop) */}
        <div className="w-full md:w-auto flex justify-center">
          <div className="flex items-center bg-stone-100 p-0.5 rounded-full w-full md:w-auto max-w-xs md:max-w-none">
            <button
              onClick={() => onViewChange("letters")}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-5 py-2 md:py-1.5 rounded-full text-xs font-medium transition-all relative z-10 cursor-pointer ${
                activeView === "letters" ? "text-stone-900" : "text-stone-400 hover:text-stone-600"
              }`}
            >
              {activeView === "letters" && (
                <motion.div
                  layoutId="activeTabNav"
                  className="absolute inset-0 bg-white rounded-full shadow-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Mail className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">Letters</span>
            </button>

            <button
              onClick={() => onViewChange("board")}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-5 py-2 md:py-1.5 rounded-full text-xs font-medium transition-all relative z-10 cursor-pointer ${
                activeView === "board" ? "text-stone-900" : "text-stone-400 hover:text-stone-600"
              }`}
            >
              {activeView === "board" && (
                <motion.div
                  layoutId="activeTabNav"
                  className="absolute inset-0 bg-white rounded-full shadow-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Pin className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">Thoughts</span>
            </button>
          </div>
        </div>

        {/* Desktop-only user context & logout */}
        <div className="hidden md:flex items-center gap-3">
          <span className="text-xs text-stone-400 font-light">
            Logged in: <strong className="text-stone-600 font-medium">{currentUserName}</strong>
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-stone-400 hover:text-rose-600 p-1.5 hover:bg-stone-50 rounded-lg transition cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </nav>
  );
}
