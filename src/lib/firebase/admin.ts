import "server-only";
import { cert, getApps, initializeApp, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { combinedEnv, isBuildTime } from "@/lib/env.server";
import { publicEnv } from "@/lib/env";

/**
 * Firebase Admin SDK with lazy initialization.
 * 
 * This module uses Proxy objects to defer Firebase initialization until
 * the SDK is actually used. This allows:
 * - CI/CD builds to succeed without Firebase credentials
 * - Next.js static analysis to complete without errors
 * - Runtime-only initialization when credentials are available
 */

// Cached instances
let _app: App | null = null;

/**
 * Custom error for build-time Firebase access attempts
 */
class FirebaseBuildTimeError extends Error {
  constructor() {
    super(
      "Firebase Admin SDK cannot be used during build time. " +
      "This operation requires FIREBASE_SERVICE_ACCOUNT_JSON to be set."
    );
    this.name = "FirebaseBuildTimeError";
  }
}

/**
 * Lazily initialize the Firebase Admin app.
 * Throws a helpful error during build time or when credentials are missing.
 */
function getAdminApp(): App {
  // Return cached app if available
  if (_app) return _app;

  // Check for existing apps (e.g., hot reload scenarios)
  if (getApps().length) {
    _app = getApps()[0];
    return _app;
  }

  // During build time, throw a specific error that won't break the build
  if (isBuildTime()) {
    throw new FirebaseBuildTimeError();
  }

  // Get service account credentials
  const serviceAccountJson = combinedEnv.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error(
      "Firebase Admin SDK requires FIREBASE_SERVICE_ACCOUNT_JSON or " +
      "FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable to be set."
    );
  }

  // Parse and validate the service account
  let serviceAccount: Record<string, unknown>;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch (e) {
    throw new Error(
      `Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: ${e instanceof Error ? e.message : "Invalid JSON"}`
    );
  }

  // Initialize the app
  _app = initializeApp({
    credential: cert(serviceAccount as Parameters<typeof cert>[0]),
    projectId: publicEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID || (serviceAccount.project_id as string),
  });

  return _app;
}

// Helper type for proxy binding
type AnyFunction = (...args: unknown[]) => unknown;

/**
 * Create a lazy proxy that defers initialization until first access.
 * During build time, accessing properties will throw FirebaseBuildTimeError.
 */
function createLazyProxy<T extends object>(
  getter: () => T,
  cache: { current: T | null }
): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      // Allow checking if it's a proxy or getting constructor name
      if (prop === Symbol.toStringTag) return "FirebaseLazyProxy";
      
      try {
        if (!cache.current) {
          cache.current = getter();
        }
        const value = (cache.current as unknown as Record<string | symbol, unknown>)[prop];
        if (typeof value === "function") {
          return (value as AnyFunction).bind(cache.current);
        }
        return value;
      } catch (error) {
        // During build time, return undefined for property access instead of throwing
        // This allows Next.js to analyze the code without failing
        if (error instanceof FirebaseBuildTimeError) {
          if (isBuildTime()) {
            // Return a no-op function for method calls during build
            return () => {
              throw new FirebaseBuildTimeError();
            };
          }
        }
        throw error;
      }
    },
  });
}

// Caches for auth and db
const authCache = { current: null as Auth | null };
const dbCache = { current: null as Firestore | null };

/**
 * Lazily initialized Firebase Auth instance.
 * Will throw FirebaseBuildTimeError if accessed during build without credentials.
 */
export const adminAuth: Auth = createLazyProxy(
  () => {
    if (!authCache.current) {
      authCache.current = getAuth(getAdminApp());
    }
    return authCache.current;
  },
  authCache
);

/**
 * Lazily initialized Firestore instance.
 * Will throw FirebaseBuildTimeError if accessed during build without credentials.
 */
export const adminDb: Firestore = createLazyProxy(
  () => {
    if (!dbCache.current) {
      dbCache.current = getFirestore(getAdminApp());
    }
    return dbCache.current;
  },
  dbCache
);

/**
 * Check if Firebase Admin is available (credentials are configured).
 * Useful for conditional logic that needs to check before using Firebase.
 */
export function isFirebaseAdminAvailable(): boolean {
  return !isBuildTime() && !!combinedEnv.FIREBASE_SERVICE_ACCOUNT_JSON;
}
