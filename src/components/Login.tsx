import React, { useState, useEffect } from "react";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { Heart, Lock, Sparkles, AlertCircle, Edit3, User, Check, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

interface LoginProps {
  onLoginError?: (err: string) => void;
  isAccessDenied: boolean;
  deniedEmail: string | null;
  onClearDenial: () => void;
}

export default function Login({ isAccessDenied, deniedEmail, onClearDenial }: LoginProps) {
  const [abbasEmail, setAbbasEmail] = useState(() => {
    return localStorage.getItem("letters_creator_email") || "abbasmian100@gmail.com";
  });
  const [fatimaEmail, setFatimaEmail] = useState(() => {
    return localStorage.getItem("letters_partner_email") || "";
  });

  const [isEditingAbbas, setIsEditingAbbas] = useState(false);
  const [isEditingFatima, setIsEditingFatima] = useState(false);
  const [loading, setLoading] = useState<string | null>(null); // "abbas" or "fatima" or null
  const [error, setError] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem("letters_creator_email", abbasEmail.trim().toLowerCase());
  }, [abbasEmail]);

  useEffect(() => {
    localStorage.setItem("letters_partner_email", fatimaEmail.trim().toLowerCase());
  }, [fatimaEmail]);

  const handleGoogleLogin = async (desk: "abbas" | "fatima") => {
    const targetEmail = desk === "abbas" ? abbasEmail : fatimaEmail;
    if (!targetEmail.trim()) {
      setError(`Please provide a Gmail address for ${desk === "abbas" ? "Abbas" : "Fatima"} first.`);
      return;
    }

    setLoading(desk);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const loggedEmail = result.user.email?.toLowerCase();
      const expectedEmail = targetEmail.trim().toLowerCase();

      if (loggedEmail !== expectedEmail) {
        // Sign out if it doesn't match the selected desk's expected email
        await signOut(auth);
        setError(
          `Google account (${result.user.email}) does not match the email configured for ${
            desk === "abbas" ? "Abbas" : "Fatima"
          }'s desk (${expectedEmail}).`
        );
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("The sign-in window was closed before finishing. Please try again to unlock your desk!");
      } else if (err.code === "auth/cancelled-popup-request") {
        setError("The sign-in request was cancelled. Please try clicking sign-in again.");
      } else if (err.code === "auth/network-request-failed") {
        setError("Network error. Please check your internet connection and try again.");
      } else {
        setError(err.message || "Failed to sign in with Google.");
      }
    } finally {
      setLoading(null);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    onClearDenial();
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAF8F5] p-4 sm:p-6 relative overflow-y-auto overflow-x-hidden">
      {/* Decorative background blurs - lighter and elegant */}
      <div className="absolute top-[-5%] left-[-10%] w-[50%] h-[30%] bg-rose-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-10%] w-[50%] h-[30%] bg-purple-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center text-center mt-4 mb-4 relative z-10">
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-3 shadow-inner"
        >
          <Heart className="w-6 h-6 fill-rose-500/10" />
        </motion.div>
        
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-800 tracking-tight leading-tight">
          Letters to Fatima
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-md font-light leading-relaxed">
          A beautiful, private platform for Abbas and Fatima to exchange letters, envelopes, and sweet thoughts.
        </p>
      </div>

      {/* Main card options */}
      <div className="w-full max-w-2xl mx-auto flex-grow flex items-center justify-center py-2 relative z-10">
        {isAccessDenied ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white border border-stone-200/60 rounded-2xl p-6 text-center shadow-lg"
          >
            <div className="flex justify-center text-amber-500 mb-3">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-stone-800 mb-1">Access Restructured</h3>
            <p className="text-sm text-stone-500 mb-4 leading-relaxed font-light">
              This space is strictly private. You logged in as <strong className="text-stone-700">{deniedEmail}</strong>, which is not authorized for this space.
            </p>
            <button
              onClick={handleLogout}
              className="w-full py-2.5 px-4 bg-stone-800 text-stone-50 hover:bg-stone-900 rounded-xl text-xs font-semibold uppercase tracking-wider transition cursor-pointer shadow-sm"
            >
              Sign out & Try another account
            </button>
          </motion.div>
        ) : (
          <div className="w-full flex flex-col gap-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs flex items-start gap-2.5 shadow-sm max-w-md mx-auto w-full"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </motion.div>
            )}

            {/* Grid of desks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
              {/* DESK 1: ABBAS */}
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="bg-white border-2 border-[#EADFC9]/60 rounded-2xl p-5 shadow-sm hover:shadow-md flex flex-col justify-between relative overflow-hidden h-[240px]"
              >
                {/* Visual Top Bar Accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#D4AF37]" />
                
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-[#B5963E] font-bold">Abbas's Desk</span>
                    <User className="w-4 h-4 text-stone-400" />
                  </div>

                  <h3 className="font-serif text-lg font-semibold text-stone-800 mb-1">
                    Sign in as Abbas
                  </h3>
                  <p className="text-xs text-stone-400 mb-4 font-light">
                    Access your letters, drafts, and shared thought notes.
                  </p>

                  {/* Configurable Email Input */}
                  <div className="relative mb-3 bg-stone-50 rounded-xl border border-stone-200/60 p-2 flex items-center justify-between">
                    <div className="w-full">
                      <p className="text-[9px] uppercase font-mono text-stone-400">My Gmail</p>
                      {isEditingAbbas ? (
                        <input
                          type="email"
                          value={abbasEmail}
                          onChange={(e) => setAbbasEmail(e.target.value)}
                          onBlur={() => setIsEditingAbbas(false)}
                          onKeyDown={(e) => e.key === "Enter" && setIsEditingAbbas(false)}
                          className="w-full text-xs font-mono text-stone-700 bg-transparent focus:outline-none border-b border-stone-300 py-0.5"
                          autoFocus
                        />
                      ) : (
                        <p className="text-xs font-mono text-stone-600 truncate">{abbasEmail}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setIsEditingAbbas(!isEditingAbbas)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 transition"
                      title="Edit email"
                    >
                      {isEditingAbbas ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Google Sign-in action */}
                <button
                  onClick={() => handleGoogleLogin("abbas")}
                  disabled={loading !== null}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-stone-800 hover:bg-stone-900 disabled:bg-stone-200 text-stone-50 rounded-xl text-xs font-semibold transition cursor-pointer shadow-sm h-11"
                >
                  {loading === "abbas" ? (
                    <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                        <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-6.887 4.114-4.694 0-8.503-3.809-8.503-8.503s3.809-8.503 8.503-8.503c2.202 0 4.205.859 5.723 2.27l3.11-3.11C18.28 1.145 15.39 0 12.24 0 5.48 0 0 5.48 0 12.24s5.48 12.24 12.24 12.24c5.62 0 10.29-4.007 10.29-10.24 0-.668-.076-1.316-.21-1.955H12.24z" />
                      </svg>
                      <span>Abbas Google Sign-In</span>
                    </>
                  )}
                </button>
              </motion.div>

              {/* DESK 2: FATIMA */}
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="bg-white border-2 border-purple-100 rounded-2xl p-5 shadow-sm hover:shadow-md flex flex-col justify-between relative overflow-hidden h-[240px]"
              >
                {/* Visual Top Bar Accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-purple-400" />
                
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-purple-500 font-bold">Fatima's Desk</span>
                    <Heart className="w-4 h-4 text-purple-400 fill-purple-50" />
                  </div>

                  <h3 className="font-serif text-lg font-semibold text-stone-800 mb-1">
                    Sign in as Fatima
                  </h3>
                  <p className="text-xs text-stone-400 mb-4 font-light">
                    Open your romantic envelopes and view replies.
                  </p>

                  {/* Configurable Email Input */}
                  <div className="relative mb-3 bg-stone-50 rounded-xl border border-stone-200/60 p-2 flex items-center justify-between">
                    <div className="w-full">
                      <p className="text-[9px] uppercase font-mono text-stone-400">Fatima's Gmail</p>
                      {isEditingFatima || !fatimaEmail ? (
                        <input
                          type="email"
                          value={fatimaEmail}
                          onChange={(e) => setFatimaEmail(e.target.value)}
                          onBlur={() => setIsEditingFatima(false)}
                          onKeyDown={(e) => e.key === "Enter" && setIsEditingFatima(false)}
                          placeholder="fatima@gmail.com"
                          className="w-full text-xs font-mono text-stone-700 bg-transparent focus:outline-none border-b border-stone-300 py-0.5"
                          autoFocus={isEditingFatima}
                        />
                      ) : (
                        <p className="text-xs font-mono text-stone-600 truncate">{fatimaEmail}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setIsEditingFatima(!isEditingFatima)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 transition"
                      title="Edit email"
                    >
                      {isEditingFatima || !fatimaEmail ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Edit3 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Google Sign-in action */}
                <button
                  onClick={() => handleGoogleLogin("fatima")}
                  disabled={loading !== null || !fatimaEmail.trim()}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-stone-200 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-sm h-11"
                >
                  {loading === "fatima" ? (
                    <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                        <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-6.887 4.114-4.694 0-8.503-3.809-8.503-8.503s3.809-8.503 8.503-8.503c2.202 0 4.205.859 5.723 2.27l3.11-3.11C18.28 1.145 15.39 0 12.24 0 5.48 0 0 5.48 0 12.24s5.48 12.24 12.24 12.24c5.62 0 10.29-4.007 10.29-10.24 0-.668-.076-1.316-.21-1.955H12.24z" />
                      </svg>
                      <span>Fatima Google Sign-In</span>
                    </>
                  )}
                </button>
              </motion.div>
            </div>
          </div>
        )}
      </div>

      {/* Footer secure stamp */}
      <div className="w-full max-w-md mx-auto text-center mt-6 relative z-10">
        <div className="flex items-center justify-center gap-1.5 text-stone-400 text-xs">
          <Lock className="w-3.5 h-3.5" />
          <span className="font-mono">End-to-End Google Auth Locked</span>
        </div>
      </div>
    </div>
  );
}
