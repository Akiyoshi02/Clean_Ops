import { z } from "zod";
import { publicEnv } from "./env";

const emptyToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }
  return value;
};

const serverSchema = z.object({
  FIREBASE_SERVICE_ACCOUNT_JSON: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
  FIREBASE_SERVICE_ACCOUNT_BASE64: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
});

const parsed = serverSchema.parse({
  FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
  FIREBASE_SERVICE_ACCOUNT_BASE64: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
});

/**
 * Detect if we're in a build-time context where Firebase credentials aren't needed.
 * This includes:
 * - CI builds (GitHub Actions, etc.)
 * - Local builds without credentials
 * - Next.js static analysis phase
 */
export function isBuildTime(): boolean {
  // Check for common CI environment variables
  const isCI = !!(
    process.env.CI ||
    process.env.GITHUB_ACTIONS ||
    process.env.VERCEL_ENV === "preview" ||
    process.env.NETLIFY ||
    process.env.GITLAB_CI
  );
  
  // During Next.js build, NODE_ENV is 'production' but we're not actually running
  // Check if we have the required credentials - if not, assume build time
  const hasCredentials = !!(
    parsed.FIREBASE_SERVICE_ACCOUNT_JSON || 
    parsed.FIREBASE_SERVICE_ACCOUNT_BASE64
  );
  
  // If in CI without credentials, it's build time
  // If no credentials at all in production build, assume build time
  return isCI || (process.env.NODE_ENV === "production" && !hasCredentials);
}

// Compute the service account JSON, returns undefined if not available
function getServiceAccountJson(): string | undefined {
  if (parsed.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return parsed.FIREBASE_SERVICE_ACCOUNT_JSON;
  }
  if (parsed.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    return Buffer.from(parsed.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf-8");
  }
  return undefined;
}

export const serverEnv = {
  FIREBASE_SERVICE_ACCOUNT_JSON: getServiceAccountJson(),
};

export const combinedEnv = {
  ...publicEnv,
  ...serverEnv,
};
