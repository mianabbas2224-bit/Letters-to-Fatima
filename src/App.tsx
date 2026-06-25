import React, { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { auth, db } from "./firebase";
import { SpaceConfig, Letter, Thought } from "./types";
import Login from "./components/Login";
import SpaceSetup from "./components/SpaceSetup";
import Navigation from "./components/Navigation";
import LetterBox from "./components/LetterBox";
import LetterEditor from "./components/LetterEditor";
import ThoughtsBoard from "./components/ThoughtsBoard";
import { Heart, Sparkles, Loader2, Lock, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [spaceConfig, setSpaceConfig] = useState<SpaceConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  
  // Real-time collections
  const [letters, setLetters] = useState<Letter[]>([]);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  
  // Navigation & view states
  const [activeView, setActiveView] = useState<"letters" | "board">("letters");
  const [isComposing, setIsComposing] = useState(false);
  const [editingDraft, setEditingDraft] = useState<Letter | null>(null);

  // Access denial helpers
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [deniedEmail, setDeniedEmail] = useState<string | null>(null);

  // Connection & Offline error helpers
  const [configError, setConfigError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // 1. Auth Subscription
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser) {
        setSpaceConfig(null);
        setIsAccessDenied(false);
        setDeniedEmail(null);
        setConfigError(null);
      }
    });
    return unsubscribe;
  }, []);

  // Request notification permissions
  useEffect(() => {
    if (user && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [user]);

  // Auto-retry when connection comes back online
  useEffect(() => {
    const handleOnline = () => {
      if (configError) {
        setRetryCount((prev) => prev + 1);
      }
    };
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [configError]);

  // 2. Fetch Space Configuration when user authenticates
  useEffect(() => {
    if (!user) {
      setConfigLoading(false);
      return;
    }

    const checkSpaceConfig = async () => {
      setConfigLoading(true);
      setConfigError(null);
      try {
        const configRef = doc(db, "config", "space");
        const docSnap = await getDoc(configRef);

        if (docSnap.exists()) {
          const config = docSnap.data() as SpaceConfig;
          localStorage.setItem("letters_space_config", JSON.stringify(config));
          
          // Verify user is authorized
          const userEmail = user.email?.toLowerCase();
          const creatorEmail = config.creatorEmail.toLowerCase();
          const partnerEmail = config.partnerEmail.toLowerCase();

          if (userEmail === creatorEmail || userEmail === partnerEmail) {
            setSpaceConfig(config);
            setIsAccessDenied(false);
          } else {
            // Logged in user is not part of this space!
            setSpaceConfig(null);
            setIsAccessDenied(true);
            setDeniedEmail(user.email);
          }
        } else {
          // No configuration found. Only 'abbasmian100@gmail.com' can perform setup
          const userEmail = user.email?.toLowerCase();
          if (userEmail === "abbasmian100@gmail.com") {
            setSpaceConfig(null); // Will trigger setup screen
          } else {
            setSpaceConfig(null);
            setIsAccessDenied(true);
            setDeniedEmail(user.email);
          }
        }
      } catch (err) {
        console.error("Error checking space configuration:", err);
        
        // Try loading from localStorage cache
        const cached = localStorage.getItem("letters_space_config");
        if (cached) {
          try {
            const config = JSON.parse(cached) as SpaceConfig;
            const userEmail = user.email?.toLowerCase();
            const creatorEmail = config.creatorEmail.toLowerCase();
            const partnerEmail = config.partnerEmail.toLowerCase();
            if (userEmail === creatorEmail || userEmail === partnerEmail) {
              setSpaceConfig(config);
              setIsAccessDenied(false);
              setConfigLoading(false);
              return;
            }
          } catch (jsonErr) {
            console.error("Error parsing cached space config:", jsonErr);
          }
        }

        // Offline rescue fallback for primary user
        const userEmail = user.email?.toLowerCase();
        if (userEmail === "abbasmian100@gmail.com") {
          const defaultOfflineConfig: SpaceConfig = {
            initialized: true,
            creatorEmail: "abbasmian100@gmail.com",
            creatorName: "Abbas",
            partnerEmail: "fatima@example.com",
            partnerName: "Fatima",
            createdAt: new Date().toISOString()
          };
          setSpaceConfig(defaultOfflineConfig);
          setIsAccessDenied(false);
          setConfigLoading(false);
          return;
        }

        setConfigError(err instanceof Error ? err.message : "Failed to load database. Please check your network connection.");
      } finally {
        setConfigLoading(false);
      }
    };

    checkSpaceConfig();
  }, [user, retryCount]);

  // 3. Real-time data streams for authorized members
  useEffect(() => {
    if (!user || !spaceConfig) return;

    // Real-time letters
    const lettersQuery = query(collection(db, "letters"), orderBy("createdAt", "desc"));
    const unsubscribeLetters = onSnapshot(lettersQuery, (snapshot) => {
      const lettersData: Letter[] = [];
      snapshot.forEach((doc) => {
        lettersData.push({ id: doc.id, ...doc.data() } as Letter);
      });

      // Handle real-time browser notifications for incoming letters
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const letter = change.doc.data() as Letter;
          const createdTime = letter.createdAt ? new Date(letter.createdAt).getTime() : 0;
          const now = Date.now();
          if (
            letter.recipientEmail?.toLowerCase() === user.email?.toLowerCase() &&
            letter.status === "sent" &&
            (now - createdTime) < 15000
          ) {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(`New Letter from ${letter.senderName}!`, {
                body: letter.subject || "Open your mailbox to read.",
                icon: "/logo.jpg",
              });
            }
          }
        }
      });

      setLetters(lettersData);
    }, (err) => {
      console.warn("Letters stream warning (expected during setup or rules deploy):", err);
    });

    // Real-time thoughts
    const thoughtsQuery = query(collection(db, "thoughts"), orderBy("createdAt", "desc"));
    const unsubscribeThoughts = onSnapshot(thoughtsQuery, (snapshot) => {
      const thoughtsData: Thought[] = [];
      snapshot.forEach((doc) => {
        thoughtsData.push({ id: doc.id, ...doc.data() } as Thought);
      });
      setThoughts(thoughtsData);
    }, (err) => {
      console.warn("Thoughts stream warning (expected during setup or rules deploy):", err);
    });

    return () => {
      unsubscribeLetters();
      unsubscribeThoughts();
    };
  }, [user, spaceConfig]);

  const handleSetupComplete = (config: SpaceConfig) => {
    setSpaceConfig(config);
    setIsAccessDenied(false);
  };

  const handleEditDraft = (draft: Letter) => {
    setEditingDraft(draft);
    setIsComposing(true);
  };

  const handleComposeNew = () => {
    setEditingDraft(null);
    setIsComposing(true);
  };

  // Loading Screens
  if (authLoading || (user && configLoading)) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6">
        <motion.div
          animate={{ scale: [0.95, 1, 0.95] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex flex-col items-center text-center"
        >
          <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-4 animate-pulse">
            <Heart className="w-6 h-6 fill-rose-500/10" />
          </div>
          <Loader2 className="w-5 h-5 text-stone-400 animate-spin mb-2" />
          <p className="text-xs text-stone-400 font-light tracking-wide font-mono">Opening your private post box...</p>
        </motion.div>
      </div>
    );
  }

  // Connection / Offline Error Screen
  if (user && configError) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 md:p-10 rounded-2xl shadow-xl border-2 border-rose-100 max-w-md w-full relative overflow-hidden"
        >
          {/* Top subtle decorative pattern */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-300 via-amber-300 to-rose-300" />
          
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-5 border border-rose-100/50">
            <ShieldAlert className="w-8 h-8" />
          </div>
          
          <h2 className="font-serif text-2xl font-semibold text-stone-800 mb-2">Connection is Offline</h2>
          <p className="text-sm text-stone-500 font-light mb-6 leading-relaxed">
            The letter box couldn't connect to the database because you or the server are currently offline. 
            We will automatically try to reconnect once your network is restored.
          </p>
          
          {configError && (
            <div className="mb-6 p-3 bg-stone-50 border border-stone-100 rounded-lg text-[10px] font-mono text-stone-400 break-all max-h-24 overflow-y-auto text-left">
              {configError}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={() => setRetryCount((prev) => prev + 1)}
              className="px-5 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium transition shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer w-full"
            >
              <Sparkles className="w-4 h-4" />
              Try Reconnecting Now
            </button>
            <button
              onClick={async () => {
                await auth.signOut();
                setUser(null);
                setSpaceConfig(null);
                setIsAccessDenied(false);
                setDeniedEmail(null);
                setConfigError(null);
              }}
              className="px-5 py-2 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-xl text-xs font-mono transition cursor-pointer w-full"
            >
              Sign Out / Switch Account
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // User is NOT logged in or has been denied access
  if (!user || isAccessDenied) {
    return (
      <Login
        isAccessDenied={isAccessDenied}
        deniedEmail={deniedEmail}
        onClearDenial={() => {
          setIsAccessDenied(false);
          setDeniedEmail(null);
        }}
      />
    );
  }

  // User IS logged in, but space is NOT setup yet (Only creator can be here due to check above)
  if (!spaceConfig) {
    return (
      <SpaceSetup
        creatorEmail={user.email || "abbasmian100@gmail.com"}
        onSetupComplete={handleSetupComplete}
      />
    );
  }

  // Core application views (Fully authenticated & config validated)
  const isCreator = user.email?.toLowerCase() === spaceConfig.creatorEmail.toLowerCase();
  const currentUserName = isCreator ? spaceConfig.creatorName : spaceConfig.partnerName;

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <Navigation
        activeView={activeView}
        onViewChange={(view) => {
          setActiveView(view);
          setIsComposing(false);
        }}
        spaceConfig={spaceConfig}
        currentEmail={user.email || ""}
      />

      <main className="flex-grow pb-16">
        <AnimatePresence mode="wait">
          {activeView === "letters" ? (
            <motion.div
              key="letters-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {isComposing ? (
                <LetterEditor
                  spaceConfig={spaceConfig}
                  currentEmail={user.email || ""}
                  currentUserUid={user.uid}
                  currentUserName={currentUserName}
                  editingDraft={editingDraft}
                  onClose={() => setIsComposing(false)}
                />
              ) : (
                <LetterBox
                  letters={letters}
                  spaceConfig={spaceConfig}
                  currentEmail={user.email || ""}
                  onEditDraft={handleEditDraft}
                  onComposeNew={handleComposeNew}
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="board-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <ThoughtsBoard
                thoughts={thoughts}
                spaceConfig={spaceConfig}
                currentEmail={user.email || ""}
                currentUserUid={user.uid}
                currentUserName={currentUserName}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Clean elegant minimal footer */}
      <footer className="py-6 border-t border-stone-200/40 bg-white text-center text-xs text-stone-400 font-light font-sans mt-auto">
        <div className="flex items-center justify-center gap-1.5 mb-1 text-rose-400">
          <Lock className="w-3.5 h-3.5" />
          <span>Two of Us • Secure Shared Space</span>
        </div>
        <p>A private, interactive notebook & mailbox. Under lock and key.</p>
      </footer>
    </div>
  );
}
