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

export const serverEnv = {
  FIREBASE_SERVICE_ACCOUNT_JSON:
    parsed.FIREBASE_SERVICE_ACCOUNT_JSON ??
    (parsed.FIREBASE_SERVICE_ACCOUNT_BASE64
      ? Buffer.from(parsed.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString(
          "utf-8",
        )
      : ""),
};

// Only warn at runtime, not during build
// Check if we're in a build environment by looking for common CI/build indicators
const isBuildTime = process.env.NODE_ENV === "production" && !process.env.VERCEL_ENV && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!serverEnv.FIREBASE_SERVICE_ACCOUNT_JSON && !isBuildTime) {
  console.warn(
    "FIREBASE_SERVICE_ACCOUNT_JSON is not set. Firebase Admin will fail until provided.",
  );
}

export const combinedEnv = {
  ...publicEnv,
  ...serverEnv,
};
