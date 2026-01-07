import { adminAuth } from "@/lib/firebase/admin";
const SESSION_EXPIRES_MS = 1000 * 60 * 60 * 24 * 5;

export async function createSessionCookie(idToken: string) {
  return adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_EXPIRES_MS });
}

export async function verifySessionCookie(sessionCookie: string) {
  return adminAuth.verifySessionCookie(sessionCookie, true);
}

export function getSessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_EXPIRES_MS / 1000,
  };
}
