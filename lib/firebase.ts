import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

// Initialize Firebase only if we have valid configuration
let app: any;
let authInstance: any;
let databaseInstance: any;

try {
  if (getApps().length === 0 && firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    authInstance = getAuth(app);
    databaseInstance = getDatabase(app);
  } else if (getApps().length > 0) {
    app = getApps()[0];
    authInstance = getAuth(app);
    databaseInstance = getDatabase(app);
  } else {
    // During build or when config is missing, use null placeholders
    app = null;
    authInstance = null;
    databaseInstance = null;
  }
} catch (error) {
  // If Firebase initialization fails, use null placeholders
  console.warn("Firebase initialization error during build:", error);
  app = null;
  authInstance = null;
  databaseInstance = null;
}

export const auth = authInstance;
export const database = databaseInstance;
export default app;
