import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

export default async function AppIndex() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  if (profile.role === "HR") {
    redirect("/app/hr/users");
  }

  if (profile.role === "SUPERVISOR") {
    redirect("/app/supervisor/dashboard");
  }

  redirect("/app/cleaner/today");
}
