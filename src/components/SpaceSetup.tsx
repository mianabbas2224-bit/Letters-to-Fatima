import React, { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { SpaceConfig } from "../types";
import { Sparkles, Heart, CheckCircle, ArrowRight, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

interface SpaceSetupProps {
  creatorEmail: string;
  onSetupComplete: (config: SpaceConfig) => void;
}

export default function SpaceSetup({ creatorEmail, onSetupComplete }: SpaceSetupProps) {
  const [creatorName, setCreatorName] = useState("Abbas");
  const [partnerName, setPartnerName] = useState("Fatima");
  const [partnerEmail, setPartnerEmail] = useState(() => localStorage.getItem("letters_partner_email") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorName.trim() || !partnerName.trim() || !partnerEmail.trim()) {
      setError("Please fill out all fields.");
      return;
    }

    if (partnerEmail.trim().toLowerCase() === creatorEmail.toLowerCase()) {
      setError("Your partner's email must be different from your email.");
      return;
    }

    setLoading(true);
    setError(null);

    const newConfig: SpaceConfig = {
      initialized: true,
      creatorEmail: creatorEmail.toLowerCase(),
      creatorName: creatorName.trim(),
      partnerEmail: partnerEmail.trim().toLowerCase(),
      partnerName: partnerName.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      // Save setup config in Firestore
      await setDoc(doc(db, "config", "space"), newConfig);
      onSetupComplete(newConfig);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save configuration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-50/70 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-50/60 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg bg-white border border-stone-100 rounded-2xl shadow-xl p-8 md:p-10 relative z-10"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
            <Heart className="w-5 h-5 fill-rose-500/10" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-500">First-Time Setup</span>
            <h1 className="font-serif text-2xl font-semibold text-stone-800">Initialize Your Shared Space</h1>
          </div>
        </div>

        <p className="text-stone-500 text-sm leading-relaxed mb-6 font-light">
          Welcome to your private letter box. Since this is the first time logging in, let's lock this space down so it's
          accessible <strong className="text-stone-700">strictly to just you and your partner</strong>. Nobody else will be able to read or access these letters.
        </p>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">Your Name</label>
              <input
                type="text"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                placeholder="e.g., Abbas"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-rose-300 focus:bg-white focus:outline-none rounded-xl text-sm transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">Your Email (Locked)</label>
              <input
                type="text"
                value={creatorEmail}
                disabled
                className="w-full px-4 py-2.5 bg-stone-100 border border-stone-200 text-stone-400 rounded-xl text-sm cursor-not-allowed font-mono text-xs"
              />
            </div>
          </div>

          <div className="border-t border-dashed border-stone-100 my-6"></div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">Your Partner's Name</label>
              <input
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="e.g., Sarah"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-rose-300 focus:bg-white focus:outline-none rounded-xl text-sm transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">Your Partner's Email</label>
              <input
                type="email"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                placeholder="partner@example.com"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-rose-300 focus:bg-white focus:outline-none rounded-xl text-sm transition"
                required
              />
              <p className="text-[11px] text-stone-400 mt-1.5 italic">
                Your partner will use this exact email to log in and access the platform.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3 px-5 bg-stone-800 hover:bg-stone-900 text-stone-50 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 shadow hover:shadow-md cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin" />
            ) : (
              <>
                <span>Lock & Initialize Space</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 text-stone-400 text-xs text-center font-light">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>Security configuration will be deployed to your Firebase rules immediately</span>
        </div>
      </motion.div>
    </div>
  );
}
