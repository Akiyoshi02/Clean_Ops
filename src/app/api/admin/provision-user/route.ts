import { NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { nowIso } from "@/lib/firebase/db";
import { requireApiRole } from "@/lib/api-auth";

const payloadSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(["HR", "SUPERVISOR", "CLEANER"]),
  phone: z.string().optional().nullable(),
  employeeId: z.string().optional().nullable(),
  payRate: z.number().optional().nullable(),
  isActive: z.boolean().optional(),
});

function buildTempPassword() {
  const token = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  return `Clean${token}!`;
}

export async function POST(request: Request) {
  const { response, profile } = await requireApiRole(["HR"]);
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const tempPassword = buildTempPassword();
  try {
    const created = await adminAuth.createUser({
      email: parsed.data.email.toLowerCase(),
      password: tempPassword,
      displayName: parsed.data.name,
      disabled: parsed.data.isActive === false,
    });

    const now = nowIso();
    await adminDb.collection("profiles").doc(created.uid).set({
      id: created.uid,
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      phone: parsed.data.phone ?? null,
      employee_id: parsed.data.employeeId ?? null,
      pay_rate: parsed.data.payRate ?? null,
      is_active: parsed.data.isActive ?? true,
      created_at: now,
      updated_at: now,
      created_by: profile?.id ?? null,
    });

    return NextResponse.json(
      { userId: created.uid, tempPassword },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create user";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
