import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

// Force dynamic rendering - Firebase Admin requires runtime credentials
export const dynamic = "force-dynamic";
import { mapDocs } from "@/lib/firebase/db";
import { requireApiRole } from "@/lib/api-auth";
import type { Profile } from "@/lib/types";

export async function GET() {
  const { response } = await requireApiRole(["HR"]);
  if (response) return response;

  const snapshot = await adminDb.collection("profiles").orderBy("name").get();
  const profiles = mapDocs<Profile>(snapshot);
  return NextResponse.json(profiles, { status: 200 });
}
