import { NextResponse } from "next/server";
import type { Profile, Role } from "@/lib/types";
import { getCurrentProfile } from "@/lib/auth";

export async function requireApiRole(roles?: Role[]) {
  const profile = await getCurrentProfile();
  if (!profile || !profile.is_active) {
    return {
      profile: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (roles && roles.length > 0 && !roles.includes(profile.role)) {
    return {
      profile,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { profile: profile as Profile, response: null };
}
