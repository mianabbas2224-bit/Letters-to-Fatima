import React, { useState } from "react";
import { Thought, SpaceConfig } from "../types";
import { collection, addDoc, doc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { Pin, Plus, Trash2, Heart, Clock, HelpCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ThoughtsBoardProps {
  thoughts: Thought[];
  spaceConfig: SpaceConfig;
  currentEmail: string;
  currentUserUid: string;
  currentUserName: string;
}

const NOTE_COLORS = [
  { class: "bg-amber-100/90 border-amber-200 text-amber-900", dot: "bg-amber-400", name: "Warm Yellow" },
  { class: "bg-rose-100/90 border-rose-200 text-rose-900", dot: "bg-rose-400", name: "Blush Rose" },
  { class: "bg-emerald-100/90 border-emerald-200 text-emerald-900", dot: "bg-emerald-400", name: "Mint Sage" },
  { class: "bg-sky-100/90 border-sky-200 text-sky-900", dot: "bg-sky-400", name: "Sky Blue" },
  { class: "bg-purple-100/90 border-purple-200 text-purple-900", dot: "bg-purple-400", name: "Lilac Violet" },
];

export default function ThoughtsBoard({
  thoughts,
  spaceConfig,
  currentEmail,
  currentUserUid,
  currentUserName,
}: ThoughtsBoardProps) {
  const [content, setContent] = useState("");
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0].class);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCreator = currentEmail.toLowerCase() === spaceConfig.creatorEmail.toLowerCase();
  const authorName = isCreator ? spaceConfig.creatorName : spaceConfig.partnerName;

  const handlePostThought = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (content.length > 1000) {
      setError("Thoughts must be under 1000 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    const thoughtId = doc(collection(db, "thoughts")).id;
    const newThought: Thought = {
      id: thoughtId,
      authorUid: currentUserUid,
      authorName: authorName,
      content: content.trim(),
      color: selectedColor,
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, "thoughts"), newThought);
      setContent("");
    } catch (err: any) {
      console.error(err);
      setError("Failed to post your thought. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteThought = async (id: string, authorUid: string) => {
    if (authorUid !== currentUserUid) return;
    if (confirm("Remove this sticky note?")) {
      try {
        await deleteDoc(doc(db, "thoughts", id));
      } catch (err) {
        console.error("Error deleting thought:", err);
      }
    }
  };

  const formatDate = (isoStr: string) => {
    const date = new Date(isoStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get sticky rotation based on string index to keep it consistent
  const getRotation = (id: string) => {
    const charCodeSum = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const rotations = ["-rotate-2", "-rotate-1", "rotate-0", "rotate-1", "rotate-2"];
    return rotations[charCodeSum % rotations.length];
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="font-serif text-3xl font-semibold text-stone-800 tracking-tight">Thoughts Board</h2>
          <p className="text-sm text-stone-500 font-light mt-1">
            Pin sticky notes, daily notes, sweet thoughts, or quick messages for your partner.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Post a Thought Panel */}
        <div className="lg:col-span-1">
          <form onSubmit={handlePostThought} className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-sm sticky top-6">
            <h3 className="font-serif text-lg font-semibold text-stone-800 mb-4 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span>Leave a Note</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Message</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Leave a sweet note, reminder, or general thoughts..."
                  className="w-full h-32 px-4 py-3 bg-stone-50 border border-stone-200 focus:border-rose-300 focus:bg-white focus:outline-none rounded-xl text-sm transition resize-none placeholder-stone-400"
                  required
                />
                <span className="block text-right text-[10px] text-stone-400 mt-1 font-mono">
                  {content.length}/1000
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Note Color</label>
                <div className="flex items-center gap-2">
                  {NOTE_COLORS.map((color) => (
                    <button
                      key={color.class}
                      type="button"
                      onClick={() => setSelectedColor(color.class)}
                      className={`w-7 h-7 rounded-full ${color.dot} border-2 transition cursor-pointer flex items-center justify-center ${
                        selectedColor === color.class ? "border-stone-800 scale-110" : "border-transparent hover:scale-105"
                      }`}
                      title={color.name}
                    >
                      {selectedColor === color.class && (
                        <div className="w-1.5 h-1.5 bg-stone-900 rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="w-full py-2.5 bg-stone-800 hover:bg-stone-900 text-stone-50 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 shadow cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>Pin to Board</span>
              </button>
            </div>
          </form>
        </div>

        {/* Tactile Corkboard Bulletin View */}
        <div className="lg:col-span-3">
          <div className="bg-[#E7DCD1] border-[6px] md:border-[12px] border-[#9E8771] rounded-2xl md:rounded-3xl p-3 md:p-6 shadow-inner min-h-[500px] relative overflow-hidden">
            {/* Wooden Texture Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px)] [background-size:100%_40px] pointer-events-none" />

            {thoughts.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-transparent">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-[#8D7661] mb-3">
                  <Pin className="w-6 h-6 rotate-45" />
                </div>
                <p className="text-sm text-[#8D7661] font-medium font-serif">
                  The board is empty right now. Write something sweet to pin!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
                <AnimatePresence>
                  {thoughts.map((thought) => {
                    const rotation = getRotation(thought.id);
                    const isAuthor = thought.authorUid === currentUserUid;

                    return (
                      <motion.div
                        key={thought.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`p-6 border rounded-md shadow-lg ${thought.color} ${rotation} relative flex flex-col justify-between min-h-[180px] transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:z-20`}
                      >
                        {/* Interactive Pushpin */}
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex flex-col items-center">
                          <div className="w-4 h-4 bg-rose-600 rounded-full shadow-md border border-rose-800" />
                          <div className="w-0.5 h-3 bg-stone-400 -mt-0.5" />
                        </div>

                        {/* Content */}
                        <div className="pt-2 mb-4">
                          <p className="text-sm font-medium leading-relaxed tracking-wide whitespace-pre-wrap font-sans">
                            {thought.content}
                          </p>
                        </div>

                        {/* Footer details */}
                        <div className="border-t border-black/5 pt-3 flex justify-between items-center text-[10px] opacity-70">
                          <div className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(thought.createdAt)}</span>
                          </div>

                          <span className="font-serif italic font-semibold">
                            — {thought.authorName}
                          </span>
                        </div>

                        {/* Delete Trash can */}
                        {isAuthor && (
                          <button
                            onClick={() => handleDeleteThought(thought.id, thought.authorUid)}
                            className="absolute bottom-2 right-2 p-1 text-black/40 hover:text-rose-600 hover:bg-black/5 rounded transition cursor-pointer"
                            title="Remove sticky"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
