import React, { useState } from "react";
import { Letter, SpaceConfig } from "../types";
import { Mail, MailOpen, FileText, Send, Clock, BookOpen, Trash2, Edit2, Check, Heart } from "lucide-react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { motion, AnimatePresence } from "motion/react";

interface LetterBoxProps {
  letters: Letter[];
  spaceConfig: SpaceConfig;
  currentEmail: string;
  onEditDraft: (letter: Letter) => void;
  onComposeNew: () => void;
}

const STATIONERY_THEMES: Record<string, { bg: string; text: string; name: string; border: string; accent: string }> = {
  classic: {
    bg: "bg-[#FDFBF7]",
    text: "text-stone-800 font-serif",
    border: "border-stone-200",
    name: "Classic Cream",
    accent: "bg-[#C4B5A5]",
  },
  lavender: {
    bg: "bg-[#FAF7FD]",
    text: "text-[#3D3050] font-sans",
    border: "border-purple-100",
    name: "Soft Lavender",
    accent: "bg-[#D9CBE5]",
  },
  parchment: {
    bg: "bg-[#F5EFE1] bg-opacity-95",
    text: "text-[#5C4033] font-serif",
    border: "border-amber-200/50",
    name: "Vintage Parchment",
    accent: "bg-[#D4A373]",
  },
  midnight: {
    bg: "bg-[#1A1F2C] text-[#F3F4F6]",
    text: "text-[#E2E8F0] font-sans",
    border: "border-slate-800",
    name: "Midnight Romance",
    accent: "bg-[#D4AF37]", // Gold
  },
};

export default function LetterBox({ letters, spaceConfig, currentEmail, onEditDraft, onComposeNew }: LetterBoxProps) {
  const [activeTab, setActiveTab] = useState<"inbox" | "sent" | "drafts">("inbox");
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [isOpeningSeal, setIsOpeningSeal] = useState(false);
  const [justOpenedId, setJustOpenedId] = useState<string | null>(null);

  // Filter letters based on current authenticated email
  const inboxLetters = letters.filter(
    (l) => l.recipientEmail.toLowerCase() === currentEmail.toLowerCase() && l.status === "sent"
  );
  const sentLetters = letters.filter(
    (l) => l.senderEmail.toLowerCase() === currentEmail.toLowerCase() && l.status === "sent"
  );
  const drafts = letters.filter(
    (l) => l.senderEmail.toLowerCase() === currentEmail.toLowerCase() && l.status === "draft"
  );

  const handleDeleteDraft = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this draft?")) {
      try {
        await deleteDoc(doc(db, "letters", id));
      } catch (err) {
        console.error("Error deleting draft:", err);
      }
    }
  };

  const handleOpenLetter = async (letter: Letter) => {
    if (!letter.opened && letter.recipientEmail.toLowerCase() === currentEmail.toLowerCase()) {
      // Trigger wax seal animation first
      setJustOpenedId(letter.id);
      setIsOpeningSeal(true);
      
      // Delay opening so animation plays beautifully
      setTimeout(async () => {
        try {
          const letterRef = doc(db, "letters", letter.id);
          await updateDoc(letterRef, {
            opened: true,
            openedAt: new Date().toISOString(),
            openedBy: currentEmail,
          });
        } catch (err) {
          console.error("Error updating letter status:", err);
        } finally {
          setIsOpeningSeal(false);
          setJustOpenedId(null);
          setSelectedLetter({
            ...letter,
            opened: true,
            openedAt: new Date().toISOString(),
          });
        }
      }, 1600);
    } else {
      setSelectedLetter(letter);
    }
  };

  const activeLetters =
    activeTab === "inbox" ? inboxLetters : activeTab === "sent" ? sentLetters : drafts;

  const formatDate = (isoStr: string | null) => {
    if (!isoStr) return "";
    const date = new Date(isoStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 md:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="font-serif text-3xl font-semibold text-stone-800 tracking-tight">The Mailbox</h2>
          <p className="text-sm text-stone-500 font-light mt-1">
            Exchange heartfelt words and keep them safe forever.
          </p>
        </div>
        <button
          onClick={onComposeNew}
          className="flex items-center gap-2 py-2.5 px-5 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-sm font-medium shadow-md shadow-rose-200 hover:shadow-lg transition cursor-pointer"
        >
          <Edit2 className="w-4 h-4" />
          <span>Write a Letter</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200/80 mb-6">
        <button
          onClick={() => setActiveTab("inbox")}
          className={`flex-1 md:flex-initial flex items-center justify-center gap-1 sm:gap-2 pb-3 px-2 sm:px-4 text-xs sm:text-sm font-medium border-b-2 transition cursor-pointer ${
            activeTab === "inbox"
              ? "border-rose-500 text-rose-500"
              : "border-transparent text-stone-400 hover:text-stone-600"
          }`}
        >
          <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>Inbox</span>
          {inboxLetters.some((l) => !l.opened) && (
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping shrink-0"></span>
          )}
          <span className="ml-0.5 bg-stone-100 text-stone-500 px-1 py-0.5 rounded text-[9px] sm:text-[10px] shrink-0">
            {inboxLetters.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("sent")}
          className={`flex-1 md:flex-initial flex items-center justify-center gap-1 sm:gap-2 pb-3 px-2 sm:px-4 text-xs sm:text-sm font-medium border-b-2 transition cursor-pointer ${
            activeTab === "sent"
              ? "border-rose-500 text-rose-500"
              : "border-transparent text-stone-400 hover:text-stone-600"
          }`}
        >
          <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>Sent</span>
          <span className="ml-0.5 bg-stone-100 text-stone-500 px-1 py-0.5 rounded text-[9px] sm:text-[10px] shrink-0">
            {sentLetters.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("drafts")}
          className={`flex-1 md:flex-initial flex items-center justify-center gap-1 sm:gap-2 pb-3 px-2 sm:px-4 text-xs sm:text-sm font-medium border-b-2 transition cursor-pointer ${
            activeTab === "drafts"
              ? "border-rose-500 text-rose-500"
              : "border-transparent text-stone-400 hover:text-stone-600"
          }`}
        >
          <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>Drafts</span>
          <span className="ml-0.5 bg-stone-100 text-stone-500 px-1 py-0.5 rounded text-[9px] sm:text-[10px] shrink-0">
            {drafts.length}
          </span>
        </button>
      </div>

      {/* Letters List */}
      <div className="space-y-4">
        {activeLetters.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-stone-200 bg-white rounded-2xl">
            <MailOpen className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="text-sm text-stone-500 font-light">
              {activeTab === "inbox"
                ? "No letters here yet. When your partner sends one, it'll land right here."
                : activeTab === "sent"
                ? "You haven't sent any letters yet. Start writing your first thoughts!"
                : "Your draft folders are currently empty."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeLetters.map((letter) => {
              const theme = STATIONERY_THEMES[letter.stationery] || STATIONERY_THEMES.classic;
              const isUnopened = activeTab === "inbox" && !letter.opened;

              // Customize envelope colors & labels dynamically
              const isMidnight = letter.stationery === "midnight";
              const isLavender = letter.stationery === "lavender";
              const isParchment = letter.stationery === "parchment";

              const envelopeBg = isMidnight ? "bg-[#181D2A]" 
                               : isLavender ? "bg-[#FAF5FF]"
                               : isParchment ? "bg-[#F7EFE1]"
                               : "bg-[#FCFAF5]";

              const stampBg = isMidnight ? "bg-[#C29D38]/25 border-[#D4AF37]" 
                            : isLavender ? "bg-purple-100 border-purple-300"
                            : isParchment ? "bg-[#E3C69E] border-[#A88C64]"
                            : "bg-rose-50 border-rose-200";

              const textColor = isMidnight ? "text-slate-200" : "text-stone-700";
              const headingLabelColor = isMidnight ? "text-amber-400" : "text-rose-500/90";
              const borderAccent = isMidnight ? "border-slate-800" : "border-stone-200/60";
              const addressLineColor = isMidnight ? "border-slate-700" : "border-stone-200";

              return (
                <motion.div
                  key={letter.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={`relative ${envelopeBg} border-2 ${borderAccent} rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[220px]`}
                  onClick={() => (activeTab === "drafts" ? onEditDraft(letter) : handleOpenLetter(letter))}
                >
                  {/* Decorative Envelope Triangular Fold Flap Visual Line */}
                  <div className="absolute top-0 left-0 right-0 h-4 overflow-hidden pointer-events-none">
                    <svg className={`w-full h-full ${isMidnight ? "text-slate-800/40" : "text-stone-300/30"}`} viewBox="0 0 100 10" preserveAspectRatio="none" fill="currentColor">
                      <polygon points="0,0 50,8 100,0" />
                    </svg>
                  </div>

                  {/* Stamp & Postmark in Top Right */}
                  <div className="absolute top-4 right-4 flex items-start gap-1 pointer-events-none">
                    {/* Wavy cancellation ink lines */}
                    <svg className={`w-12 h-8 ${isMidnight ? "text-slate-700/60" : "text-stone-400/50"}`} viewBox="0 0 40 20" fill="none" stroke="currentColor" strokeWidth="1">
                      <path d="M0 2 C10 8, 10 -4, 20 2 C30 8, 30 -4, 40 2" />
                      <path d="M0 7 C10 13, 10 1, 20 7 C30 13, 30 1, 40 7" />
                      <path d="M0 12 C10 18, 10 6, 20 12 C30 18, 30 6, 40 12" />
                    </svg>
                    {/* Perforated stamp box */}
                    <div className={`w-10 h-13 ${stampBg} rounded border-2 border-dashed flex flex-col items-center justify-center relative shadow-sm`}>
                      <Heart className={`w-4 h-4 ${isMidnight ? "text-amber-400 fill-amber-400/20" : "text-rose-400 fill-rose-400/10"}`} />
                      <span className={`text-[7px] font-mono font-bold uppercase mt-1 tracking-wider ${isMidnight ? "text-amber-300" : "text-stone-500"}`}>POST</span>
                    </div>
                  </div>

                  {/* Date Badge / Envelope Type indicator */}
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[10px] tracking-wider uppercase text-stone-400 flex items-center gap-1 bg-black/5 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" />
                      {formatDate(letter.sentAt || letter.createdAt)}
                    </span>
                    {isUnopened && (
                      <span className="bg-rose-500 text-stone-50 font-serif text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse shadow-sm mr-14">
                        Unopened
                      </span>
                    )}
                  </div>

                  {/* Main address field heading space - Written whatever subject we want! */}
                  <div className={`my-4 mx-auto w-[85%] ${isMidnight ? "bg-slate-900/60" : "bg-white/85"} border border-dashed ${isMidnight ? "border-slate-700" : "border-stone-300"} p-3 rounded-lg text-center shadow-inner`}>
                    <p className={`text-[9px] uppercase font-mono tracking-widest ${headingLabelColor} mb-1 font-semibold`}>
                      HEADING SPACE
                    </p>
                    <h3 className={`font-serif italic text-base md:text-lg font-medium leading-tight line-clamp-1 ${textColor}`}>
                      {letter.subject || "No Subject / Pure Heart"}
                    </h3>
                  </div>

                  {/* Bottom strip details (Sender, Recipient, Wax seal, Draft status) */}
                  <div className={`flex justify-between items-center border-t ${addressLineColor} pt-3.5`}>
                    <div className="flex flex-col text-[11px] text-stone-400">
                      {activeTab === "inbox" ? (
                        <span>From: <strong className={`font-medium ${isMidnight ? "text-slate-300" : "text-stone-600"}`}>{letter.senderName}</strong></span>
                      ) : activeTab === "sent" ? (
                        <span>To: <strong className={`font-medium ${isMidnight ? "text-slate-300" : "text-stone-600"}`}>{letter.recipientName}</strong></span>
                      ) : (
                        <span className="text-amber-600 font-serif italic">Draft envelope</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {activeTab === "drafts" ? (
                        <button
                          onClick={(e) => handleDeleteDraft(e, letter.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-500 rounded-md hover:bg-black/5 transition cursor-pointer"
                          title="Delete draft"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        // Beautiful glossy tactile red or gold wax seal
                        <div className="relative flex items-center justify-center">
                          {isUnopened ? (
                            <motion.div
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ repeat: Infinity, duration: 1.8 }}
                              className="w-8 h-8 rounded-full bg-[#8c1c1e] shadow-md border-2 border-[#5c0e10] flex items-center justify-center cursor-pointer"
                              title="Locked Envelope Seal"
                            >
                              <Heart className="w-4 h-4 fill-rose-100/30 text-rose-100" />
                            </motion.div>
                          ) : (
                            <div
                              className={`w-8 h-8 rounded-full ${isMidnight ? "bg-[#d4af37] border-2 border-[#a58421]" : "bg-[#c4b5a5] border-2 border-stone-400"} shadow-sm flex items-center justify-center`}
                              title="Unsealed Envelope"
                            >
                              <Heart className={`w-3.5 h-3.5 ${isMidnight ? "text-stone-950 fill-stone-950/25" : "text-white"}`} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sealed Opening Overlay (Wax seal animation) */}
      <AnimatePresence>
        {isOpeningSeal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0d0c0b]/90 flex flex-col items-center justify-center z-50 p-6"
          >
            <div className="relative w-72 h-44 bg-[#F2ECE1] rounded-lg shadow-2xl flex flex-col items-center justify-center border-2 border-[#DCD3C1]">
              {/* Envelope flap lines */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-50/10 via-transparent to-transparent pointer-events-none" />
              
              {/* Envelope back flap visual lines */}
              <svg className="absolute inset-0 w-full h-full text-[#E0D5BE]" fill="none" viewBox="0 0 288 176">
                <path d="M0 0 L144 88 L288 0" stroke="currentColor" strokeWidth="2" />
                <path d="M0 176 L144 88 L288 176" stroke="currentColor" strokeWidth="2" />
              </svg>

              {/* Red Wax Seal */}
              <motion.div
                initial={{ scale: 0.8, rotate: -15 }}
                animate={{
                  scale: [0.8, 1.1, 1],
                  rotate: [-15, 0, -5],
                }}
                transition={{ duration: 0.6 }}
                className="relative z-10 w-16 h-16 rounded-full bg-[#8b181a] border-2 border-[#5c0d10] flex items-center justify-center text-rose-50/90 shadow-lg cursor-pointer"
              >
                {/* Crack lines animation */}
                <motion.div
                  animate={{
                    opacity: [0, 1],
                    strokeDashoffset: [10, 0],
                  }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <svg className="w-12 h-12 text-[#5c0d10]" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M 24,12 C 24,24 24,24 24,36 M 18,20 L 30,28" />
                  </svg>
                </motion.div>
                <Heart className="w-6 h-6 fill-rose-50/25 relative z-20 text-rose-50" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 text-[#E0D5BE] font-serif text-sm tracking-widest text-center uppercase"
              >
                Breaking the Wax Seal...
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Letter Reader Dialog */}
      <AnimatePresence>
        {selectedLetter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-40 p-4 md:p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ duration: 0.4, type: "spring" }}
              className={`w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl border ${
                (STATIONERY_THEMES[selectedLetter.stationery] || STATIONERY_THEMES.classic).bg
              } ${
                (STATIONERY_THEMES[selectedLetter.stationery] || STATIONERY_THEMES.classic).border
              } p-8 md:p-12 flex flex-col justify-between`}
            >
              <div>
                <div className="flex justify-between items-start border-b border-stone-200/40 pb-4 mb-6">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block mb-1">
                      {selectedLetter.stationery ? STATIONERY_THEMES[selectedLetter.stationery].name : "Classic"} stationery
                    </span>
                    <h3 className={`text-2xl font-semibold leading-tight ${
                      (STATIONERY_THEMES[selectedLetter.stationery] || STATIONERY_THEMES.classic).text
                    }`}>
                      {selectedLetter.subject || "Untitled Letter"}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedLetter(null)}
                    className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                <div className="flex flex-col gap-1 text-xs text-stone-400 font-mono mb-6 pb-4 border-b border-stone-200/20">
                  <span>From: <strong className="text-stone-600">{selectedLetter.senderName}</strong> ({selectedLetter.senderEmail})</span>
                  <span>To: <strong className="text-stone-600">{selectedLetter.recipientName}</strong> ({selectedLetter.recipientEmail})</span>
                  <span>Sent: {formatDate(selectedLetter.sentAt)}</span>
                  {selectedLetter.openedAt && (
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <Check className="w-3.5 h-3.5" /> Opened: {formatDate(selectedLetter.openedAt)}
                    </span>
                  )}
                </div>

                {/* Letter Body Content */}
                <div className={`whitespace-pre-wrap text-base leading-relaxed tracking-wide mb-8 ${
                  (STATIONERY_THEMES[selectedLetter.stationery] || STATIONERY_THEMES.classic).text
                }`}>
                  {selectedLetter.content}
                </div>
              </div>

              <div className="border-t border-stone-200/40 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-stone-400 font-light">
                <span>With love, always.</span>
                <button
                  onClick={() => setSelectedLetter(null)}
                  className="w-full sm:w-auto py-2 px-5 bg-stone-800 text-stone-50 hover:bg-stone-900 rounded-lg font-medium transition text-center cursor-pointer"
                >
                  Return to Mailbox
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
