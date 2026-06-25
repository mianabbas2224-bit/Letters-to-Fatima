import React, { useState, useEffect } from "react";
import { Letter, SpaceConfig } from "../types";
import { doc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { Save, Send, ArrowLeft, HelpCircle, Eye, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface LetterEditorProps {
  spaceConfig: SpaceConfig;
  currentEmail: string;
  currentUserUid: string;
  currentUserName: string;
  editingDraft: Letter | null;
  onClose: () => void;
}

const STATIONERY_THEMES: Record<string, { bg: string; text: string; border: string; accent: string; paperBg: string; name: string; lineClass: string; inlineStyle?: React.CSSProperties }> = {
  classic: {
    name: "Classic Cream",
    bg: "bg-[#FAF7F0]",
    paperBg: "bg-[#FDFBF7]",
    text: "text-stone-800 font-serif placeholder-stone-400",
    border: "border-stone-200 focus:border-stone-400",
    accent: "bg-[#8c7a6b]",
    lineClass: "line-classic",
    inlineStyle: {
      backgroundImage: "linear-gradient(transparent 31px, rgba(140, 122, 107, 0.15) 31px, rgba(140, 122, 107, 0.15) 32px)",
      backgroundSize: "100% 32px",
      lineHeight: "32px",
    }
  },
  lavender: {
    name: "Soft Lavender",
    bg: "bg-[#F5EFFB]",
    paperBg: "bg-[#FAF7FD]",
    text: "text-[#3D3050] font-sans placeholder-[#8D7FA3]",
    border: "border-purple-100 focus:border-purple-300",
    accent: "bg-[#7c5fa6]",
    lineClass: "line-lavender",
    inlineStyle: {
      backgroundImage: "linear-gradient(transparent 31px, rgba(124, 95, 166, 0.15) 31px, rgba(124, 95, 166, 0.15) 32px)",
      backgroundSize: "100% 32px",
      lineHeight: "32px",
    }
  },
  parchment: {
    name: "Vintage Parchment",
    bg: "bg-[#EFE6D2]",
    paperBg: "bg-[#F5EFE1]",
    text: "text-[#4A3225] font-serif placeholder-[#A58B75]",
    border: "border-amber-200/50 focus:border-[#8D5B4C]",
    accent: "bg-[#8D5B4C]",
    lineClass: "line-parchment",
    inlineStyle: {
      backgroundImage: "linear-gradient(transparent 31px, rgba(141, 91, 76, 0.15) 31px, rgba(141, 91, 76, 0.15) 32px)",
      backgroundSize: "100% 32px",
      lineHeight: "32px",
    }
  },
  midnight: {
    name: "Midnight Romance",
    bg: "bg-[#0E1118]",
    paperBg: "bg-[#161B25]",
    text: "text-slate-100 font-sans placeholder-slate-500",
    border: "border-slate-800 focus:border-slate-600",
    accent: "bg-[#D4AF37]",
    lineClass: "line-midnight",
    inlineStyle: {
      backgroundImage: "linear-gradient(transparent 31px, rgba(212, 175, 55, 0.1) 31px, rgba(212, 175, 55, 0.1) 32px)",
      backgroundSize: "100% 32px",
      lineHeight: "32px",
    }
  },
};

export default function LetterEditor({
  spaceConfig,
  currentEmail,
  currentUserUid,
  currentUserName,
  editingDraft,
  onClose,
}: LetterEditorProps) {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [stationery, setStationery] = useState("classic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);

  // Identify partner (recipient) details
  const isCreator = currentEmail.toLowerCase() === spaceConfig.creatorEmail.toLowerCase();
  const recipientEmail = isCreator ? spaceConfig.partnerEmail : spaceConfig.creatorEmail;
  const recipientName = isCreator ? spaceConfig.partnerName : spaceConfig.creatorName;
  const senderName = isCreator ? spaceConfig.creatorName : spaceConfig.partnerName;

  useEffect(() => {
    if (editingDraft) {
      setSubject(editingDraft.subject);
      setContent(editingDraft.content);
      setStationery(editingDraft.stationery);
    }
  }, [editingDraft]);

  const handleSave = async (status: "draft" | "sent") => {
    if (status === "sent" && (!subject.trim() || !content.trim())) {
      setError("Please fill out both the subject and the content before sending.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const letterId = editingDraft ? editingDraft.id : doc(collection(db, "letters")).id;

    const letterData: Partial<Letter> & { createdAt: any; sentAt?: any } = {
      id: letterId,
      senderUid: currentUserUid,
      senderEmail: currentEmail.toLowerCase().trim(),
      senderName: senderName,
      recipientEmail: recipientEmail.toLowerCase().trim(),
      recipientName: recipientName,
      subject: subject.trim(),
      content: content.trim(),
      stationery: stationery,
      status: status,
      opened: false,
      openedAt: null,
      createdAt: editingDraft ? editingDraft.createdAt : new Date().toISOString(),
    };

    if (status === "sent") {
      letterData.sentAt = new Date().toISOString();
    } else {
      letterData.sentAt = null;
    }

    try {
      await setDoc(doc(db, "letters", letterId), letterData);
      setSuccessMsg(status === "sent" ? "Your letter has been sent!" : "Draft saved successfully.");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("Error saving letter:", err);
      setError(err.message || "Failed to save the letter.");
    } finally {
      setLoading(false);
    }
  };

  const currentTheme = STATIONERY_THEMES[stationery] || STATIONERY_THEMES.classic;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 md:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-800 text-sm font-medium transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Mailbox</span>
        </button>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={() => setIsPreview(!isPreview)}
            className="flex items-center gap-1.5 py-2 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isPreview ? "Edit Mode" : "Preview Letter"}</span>
          </button>

          <button
            disabled={loading}
            onClick={() => handleSave("draft")}
            className="flex items-center gap-1.5 py-2 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium transition cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>

          <button
            disabled={loading}
            onClick={() => handleSave("sent")}
            className="flex items-center gap-2 py-2 px-5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-medium transition cursor-pointer shadow disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Letter</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-xs">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-500 animate-bounce" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Composer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Editor Controls / Style Selection */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-stone-200/80 rounded-xl p-5 shadow-sm">
            <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4">Letter Info</h4>
            <div className="space-y-3.5 text-xs text-stone-600 font-light">
              <div>
                <span className="block text-stone-400 mb-0.5">Writing To</span>
                <strong className="text-stone-700 font-medium text-sm">{recipientName}</strong>
                <span className="block text-stone-400 font-mono text-[10px] mt-0.5">{recipientEmail}</span>
              </div>
              <div>
                <span className="block text-stone-400 mb-0.5">Sender</span>
                <strong className="text-stone-700 font-medium">{senderName}</strong>
              </div>
            </div>
          </div>

          <div className="bg-white border border-stone-200/80 rounded-xl p-5 shadow-sm">
            <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4">Choose Stationery</h4>
            <div className="space-y-2.5">
              {Object.entries(STATIONERY_THEMES).map(([key, style]) => (
                <button
                  key={key}
                  onClick={() => setStationery(key)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition cursor-pointer ${
                    stationery === key
                      ? "border-rose-300 bg-rose-50/20"
                      : "border-stone-100 hover:border-stone-200 bg-stone-50/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full ${style.accent}`} />
                    <span className="text-xs font-medium text-stone-700">{style.name}</span>
                  </div>
                  {stationery === key && (
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Paper Stationery Composer Sheet */}
        <div className="lg:col-span-3">
          <motion.div
            layout
            className={`w-full rounded-2xl shadow-xl border-2 ${currentTheme.border} ${currentTheme.bg} p-4 sm:p-6 md:p-12 min-h-[420px] md:min-h-[600px] flex flex-col transition-all duration-300 relative`}
          >
            {/* Elegant Double Stitch Border Accent */}
            <div className="absolute inset-2 border border-dashed border-stone-400/20 rounded-xl pointer-events-none" />

            {isPreview ? (
              // Live Letter Preview styled beautifully like a handwritten letter
              <div className="flex-grow flex flex-col justify-between relative z-10">
                <div>
                  <div className="border-b border-stone-200/40 pb-4 mb-8">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">
                      Stationery Preview ({currentTheme.name})
                    </span>
                    <h2 className={`text-3xl font-serif mt-2 font-semibold ${currentTheme.text}`}>
                      {subject || "Untitled Letter"}
                    </h2>
                  </div>

                  {/* Lined Notebook Paper Layout for Preview */}
                  <div 
                    style={currentTheme.inlineStyle}
                    className={`whitespace-pre-wrap text-base tracking-wide bg-local min-h-[300px] py-2 ${currentTheme.text}`}
                  >
                    {content || (
                      <span className="italic opacity-40">No content typed yet...</span>
                    )}
                  </div>
                </div>

                <div className="border-t border-stone-200/40 pt-6 mt-12 text-sm text-stone-400 font-light flex justify-between items-center">
                  <span>With love, always.</span>
                  <span className="font-serif italic font-semibold text-stone-700">{senderName}</span>
                </div>
              </div>
            ) : (
              // Main Composer Form fields mapped into paper stationery with realistic lined paper support
              <div className="flex-grow flex flex-col h-full relative z-10">
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="The Subject of my Letter..."
                  className={`w-full bg-transparent border-b border-stone-200/40 pb-3 mb-6 focus:outline-none text-2xl font-serif font-medium ${currentTheme.text}`}
                />

                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  style={currentTheme.inlineStyle}
                  placeholder="Dear partner, write down your deepest thoughts, letters, and feelings here..."
                  className={`w-full flex-grow bg-transparent resize-none focus:outline-none text-base tracking-wide min-h-[250px] md:min-h-[400px] h-full bg-local ${currentTheme.text}`}
                />

                <div className="border-t border-stone-200/20 pt-4 mt-6 text-xs text-stone-400 font-mono flex flex-col sm:flex-row justify-between gap-2">
                  <span>Writing as: <strong className="text-stone-500 font-medium">{senderName}</strong></span>
                  <span>Word count: {content.trim() ? content.trim().split(/\s+/).length : 0}</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
