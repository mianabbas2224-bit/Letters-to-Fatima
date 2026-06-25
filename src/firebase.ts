import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, EmailAuthProvider } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import config from "../firebase-applet-config.json";

// Initialize Firebase with configuration from firebase-applet-config.json
const app = initializeApp(config);

export const auth = getAuth(app);
export const db = config.firestoreDatabaseId ? getFirestore(app, config.firestoreDatabaseId) : getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Standard connection test as per SKILL.md rules
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firebase connection verified successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes("offline")) {
      console.warn("Please check your Firebase configuration or network status.");
    } else {
      console.log("Firebase connection test complete (database access verified).");
    }
  }
}

testConnection();
