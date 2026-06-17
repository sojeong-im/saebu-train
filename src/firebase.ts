import { initializeApp, getApp, getApps } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { getDatabase, ref, push, set, serverTimestamp } from "firebase/database";
import type { Database } from "firebase/database";
import type { FirebaseConfigData } from "./types";

let firebaseApp: FirebaseApp | null = null;
let firebaseDb: Database | null = null;

// LocalStorage key for Firebase Config
const FIREBASE_CONFIG_KEY = "saebu_train_firebase_config";

export const getSavedFirebaseConfig = (): FirebaseConfigData | null => {
  const saved = localStorage.getItem(FIREBASE_CONFIG_KEY);
  if (saved) {
    try {
      return JSON.parse(saved) as FirebaseConfigData;
    } catch (e) {
      console.error("Failed to parse saved Firebase config", e);
    }
  }

  // Also check vite env as secondary option
  if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_DATABASE_URL) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
      appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
    };
  }

  return null;
};

export const saveFirebaseConfig = (config: FirebaseConfigData) => {
  localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
};

export const clearFirebaseConfig = () => {
  localStorage.removeItem(FIREBASE_CONFIG_KEY);
};

export const initFirebase = (config?: FirebaseConfigData): { app: FirebaseApp; db: Database } | null => {
  const targetConfig = config || getSavedFirebaseConfig();
  
  if (!targetConfig || !targetConfig.apiKey || !targetConfig.databaseURL) {
    return null;
  }

  try {
    // Prevent duplicate app initialization
    if (getApps().length > 0) {
      firebaseApp = getApp();
    } else {
      firebaseApp = initializeApp(targetConfig);
    }
    firebaseDb = getDatabase(firebaseApp);
    return { app: firebaseApp, db: firebaseDb };
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    return null;
  }
};

// Check if Firebase is active
export const isFirebaseActive = (): boolean => {
  return firebaseDb !== null || initFirebase() !== null;
};

// Get active database reference
export const getActiveDb = (): Database | null => {
  if (!firebaseDb) {
    const initialized = initFirebase();
    if (initialized) {
      firebaseDb = initialized.db;
    }
  }
  return firebaseDb;
};

// Submit Score to Firebase or Local Storage / BroadcastChannel
export const submitScore = async (
  teamId: number,
  teamName: string,
  missionId: string,
  missionName: string,
  points: number,
  count: number,
  submitter: string = "leader"
): Promise<{ success: boolean; error?: string }> => {
  const db = getActiveDb();
  const totalPoints = points * count;
  const newSubmission = {
    id: Math.random().toString(36).substring(2, 11),
    teamId,
    teamName,
    missionId,
    missionName,
    points,
    count,
    totalPoints,
    submittedAt: Date.now(), // Local fallback
    submitter,
  };

  if (db) {
    try {
      // Create new reference under 'submissions'
      const submissionsRef = ref(db, "submissions");
      const newRef = push(submissionsRef);
      
      // We will write with Firebase Server Timestamp to ensure server time enforcement
      await set(newRef, {
        ...newSubmission,
        submittedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (e: any) {
      console.error("Firebase submission failed", e);
      return { success: false, error: e.message || "Firebase submission failed" };
    }
  } else {
    // Local fallback: use BroadcastChannel and localStorage
    const savedLogs = localStorage.getItem("saebu_train_local_submissions");
    const logs = savedLogs ? JSON.parse(savedLogs) : [];
    logs.push(newSubmission);
    localStorage.setItem("saebu_train_local_submissions", JSON.stringify(logs));

    // Broadcast the update to other tabs
    try {
      const channel = new BroadcastChannel("saebu_train_channel");
      channel.postMessage({ type: "NEW_SUBMISSION", data: newSubmission });
      channel.close();
    } catch (e) {
      console.error("BroadcastChannel failed", e);
    }

    return { success: true };
  }
};
