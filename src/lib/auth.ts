import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { adminDb } from "@/lib/firebase/admin";
import { verifySessionCookie } from "@/lib/firebase/session";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/constants";
import type { Profile } from "@/lib/types";

export async function getCurrentProfile() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!session) {
    return null;
  }
  try {
    const decoded = await verifySessionCookie(session);
    const doc = await adminDb.collection("profiles").doc(decoded.uid).get();
    if (!doc.exists) {
      return null;
    }
    const data = doc.data() as Omit<Profile, "id">;
    if (!data.is_active) {
      return null;
    }
    return { id: doc.id, ...data } as Profile;
  } catch {
    return null;
  }
}

export async function requireRole(roles: Array<"HR" | "SUPERVISOR" | "CLEANER">) {
  const profile = await getCurrentProfile();
  if (!profile || !roles.includes(profile.role)) {
    redirect("/app");
  }
  return profile;
}
