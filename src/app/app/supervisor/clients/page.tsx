import { requireRole } from "@/lib/auth";
import { listClients } from "@/lib/repositories/clients";
import { ClientsManager } from "./clients-manager";

export default async function ClientsPage() {
  await requireRole(["SUPERVISOR", "HR"]);
  const clients = await listClients();

  return <ClientsManager initialClients={clients ?? []} />;
}
