import { requireRole } from "@/lib/auth";
import { getJobDetail } from "@/lib/repositories/jobs";
import { CleanerJobDetail } from "./job-detail";

export default async function CleanerJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRole(["CLEANER"]);
  const detail = await getJobDetail(id);
  if (!detail) {
    return null;
  }

  return (
    <CleanerJobDetail
      job={{
        ...detail.job,
        site: detail.site,
        tasks: detail.tasks,
        clock_events: detail.clock_events,
        break_events: detail.break_events,
        attachments: detail.attachments,
        issues: detail.issues,
      }}
    />
  );
}
