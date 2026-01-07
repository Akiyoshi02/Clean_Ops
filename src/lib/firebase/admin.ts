import "server-only";
import { cert, getApps, initializeApp, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { combinedEnv } from "@/lib/env.server";
import { publicEnv } from "@/lib/env";

// Lazy initialization - only initialize Firebase Admin when actually needed at runtime
// This allows builds to succeed in CI without Firebase credentials
let _app: App | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

function getAdminApp(): App {
  if (_app) return _app;

  if (getApps().length) {
    _app = getApps()[0];
    return _app;
  }

  const serviceAccountJson = combinedEnv.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error(
      "Firebase Admin SDK requires FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable"
    );
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  _app = initializeApp({
    credential: cert(serviceAccount),
    projectId: publicEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID || serviceAccount.project_id,
  });

  return _app;
}

// Helper to bind functions properly
type AnyFunction = (...args: unknown[]) => unknown;

// Export getters that lazily initialize Firebase Admin
export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_target, prop) {
    if (!_auth) {
      _auth = getAuth(getAdminApp());
    }
    const value = (_auth as unknown as Record<string, unknown>)[prop as string];
    if (typeof value === "function") {
      return (value as AnyFunction).bind(_auth);
    }
    return value;
  },
});

export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_target, prop) {
    if (!_db) {
      _db = getFirestore(getAdminApp());
    }
    const value = (_db as unknown as Record<string, unknown>)[prop as string];
    if (typeof value === "function") {
      return (value as AnyFunction).bind(_db);
    }
    return value;
  },
});
