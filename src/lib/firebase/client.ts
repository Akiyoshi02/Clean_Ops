import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { publicEnv } from "@/lib/env";

// Lazy initialization for client-side Firebase
// This prevents initialization errors during SSR/build when env vars may be empty
let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

function getFirebaseApp(): FirebaseApp {
  if (_app) return _app;

  if (getApps().length) {
    _app = getApp();
    return _app;
  }

  const firebaseConfig = {
    apiKey: publicEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: publicEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: publicEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: publicEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
    storageBucket: publicEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  };

  // Only initialize if we have valid config (not empty strings from build time)
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error("Firebase client requires NEXT_PUBLIC_FIREBASE_* environment variables");
  }

  _app = initializeApp(firebaseConfig);
  return _app;
}

// Helper to bind functions properly
type AnyFunction = (...args: unknown[]) => unknown;

// Export the app directly since it's needed for some imports
export const firebaseApp = new Proxy({} as FirebaseApp, {
  get(_target, prop) {
    const app = getFirebaseApp();
    const value = (app as unknown as Record<string, unknown>)[prop as string];
    if (typeof value === "function") {
      return (value as AnyFunction).bind(app);
    }
    return value;
  },
});

export const firebaseAuth: Auth = new Proxy({} as Auth, {
  get(_target, prop) {
    if (!_auth) {
      _auth = getAuth(getFirebaseApp());
    }
    const value = (_auth as unknown as Record<string, unknown>)[prop as string];
    if (typeof value === "function") {
      return (value as AnyFunction).bind(_auth);
    }
    return value;
  },
});

export const firebaseDb: Firestore = new Proxy({} as Firestore, {
  get(_target, prop) {
    if (!_db) {
      _db = getFirestore(getFirebaseApp());
    }
    const value = (_db as unknown as Record<string, unknown>)[prop as string];
    if (typeof value === "function") {
      return (value as AnyFunction).bind(_db);
    }
    return value;
  },
});
