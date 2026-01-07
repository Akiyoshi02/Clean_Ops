import { requireRole } from "@/lib/auth";
import {
  listChecklistTemplates,
  listTemplateItems,
  listSitesForOverrides,
} from "@/lib/repositories/checklists";
import { ChecklistManager } from "./checklist-manager";

export default async function ChecklistsPage() {
  await requireRole(["SUPERVISOR", "HR"]);
  const [templates, items, sites] = await Promise.all([
    listChecklistTemplates(),
    listTemplateItems(),
    listSitesForOverrides(),
  ]);

  return (
    <ChecklistManager
      initialTemplates={templates ?? []}
      initialItems={items ?? []}
      sites={sites ?? []}
    />
  );
}
