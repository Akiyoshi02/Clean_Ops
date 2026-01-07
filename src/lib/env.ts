import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
});

// Lazy validation - only validate when accessed at runtime, not at build time
// This allows builds to succeed in CI without env vars set
let _publicEnv: z.infer<typeof publicSchema> | null = null;

function getPublicEnv(): z.infer<typeof publicSchema> {
  if (!_publicEnv) {
    _publicEnv = publicSchema.parse({
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }
  return _publicEnv;
}

const publicEnvKeys: (keyof z.infer<typeof publicSchema>)[] = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
];

export const publicEnv = new Proxy({} as z.infer<typeof publicSchema>, {
  get(_target, prop: string) {
    return getPublicEnv()[prop as keyof z.infer<typeof publicSchema>];
  },
  ownKeys() {
    return publicEnvKeys;
  },
  getOwnPropertyDescriptor(_target, prop) {
    if (publicEnvKeys.includes(prop as keyof z.infer<typeof publicSchema>)) {
      return {
        enumerable: true,
        configurable: true,
        value: getPublicEnv()[prop as keyof z.infer<typeof publicSchema>],
      };
    }
    return undefined;
  },
});
