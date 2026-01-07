import { requireRole } from "@/lib/auth";
import { listSites } from "@/lib/repositories/sites";
import { listClients } from "@/lib/repositories/clients";
import { listChecklistTemplates } from "@/lib/repositories/checklists";
import { SitesManager } from "./sites-manager";

export default async function SitesPage() {
  await requireRole(["SUPERVISOR", "HR"]);
  const [sites, clients, templates] = await Promise.all([
    listSites(),
    listClients(),
    listChecklistTemplates(),
  ]);

  const templateOptions = templates.map((template) => ({
    id: template.id,
    name: template.name,
  }));

  const clientOptions = clients.map((client) => ({
    id: client.id,
    name: client.name,
  }));

  return (
    <SitesManager
      initialSites={sites ?? []}
      clients={clientOptions}
      templates={templateOptions}
    />
  );
}
