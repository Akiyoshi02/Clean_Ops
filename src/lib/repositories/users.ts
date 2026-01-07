import { adminDb } from "@/lib/firebase/admin";
import { mapDocs } from "@/lib/firebase/db";
import type { Profile } from "@/lib/types";

export async function listProfiles() {
  const snapshot = await adminDb.collection("profiles").orderBy("name").get();
  return mapDocs<Profile>(snapshot);
}

export async function listProfilesByRole(role: Profile["role"]) {
  const snapshot = await adminDb
    .collection("profiles")
    .where("role", "==", role)
    .get();
  const profiles = mapDocs<Profile>(snapshot);
  return profiles.sort((a, b) => a.name.localeCompare(b.name));
}
