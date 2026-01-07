import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { createSessionCookie, getSessionCookieOptions } from "@/lib/firebase/session";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/constants";

const payloadSchema = z.object({
  idToken: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(parsed.data.idToken);
    const profileDoc = await adminDb.collection("profiles").doc(decoded.uid).get();
    const profile = profileDoc.exists ? profileDoc.data() : null;
    if (!profile?.is_active) {
      return NextResponse.json({ error: "Account inactive" }, { status: 403 });
    }

    const sessionCookie = await createSessionCookie(parsed.data.idToken);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, getSessionCookieOptions());
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create session" },
      { status: 401 },
    );
  }
}
