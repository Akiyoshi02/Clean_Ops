import { requireRole } from "@/lib/auth";
import { listProfiles } from "@/lib/repositories/users";
import { UserManagement } from "./user-management";

export default async function UsersPage() {
  await requireRole(["HR"]);
  const profiles = await listProfiles();
  return <UserManagement initialProfiles={profiles} />;
}
