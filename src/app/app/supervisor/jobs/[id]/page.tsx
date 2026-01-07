import { requireRole } from "@/lib/auth";
import { getJobDetail } from "@/lib/repositories/jobs";
import { JobReview } from "./review";

export default async function JobReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRole(["SUPERVISOR", "HR"]);
  const detail = await getJobDetail(id);
  if (!detail) {
    return null;
  }

  const activity = [
    ...detail.clock_events.map((event) => ({
      event_type: "CLOCK",
      event_action: event.type,
      occurred_at: event.at,
      note: null,
    })),
    ...detail.break_events.map((event) => ({
      event_type: "BREAK",
      event_action: event.type,
      occurred_at: event.at,
      note: null,
    })),
    ...detail.issues.map((issue) => ({
      event_type: "ISSUE",
      event_action: issue.status,
      occurred_at: issue.created_at,
      note: issue.message,
    })),
    ...detail.status_events.map((event) => ({
      event_type: "STATUS",
      event_action: event.new_status,
      occurred_at: event.created_at,
      note: event.note ?? null,
    })),
  ].sort(
    (a, b) =>
      new Date(b.occurred_at ?? 0).getTime() -
      new Date(a.occurred_at ?? 0).getTime(),
  );

  return (
    <JobReview
      job={{
        ...detail.job,
        site: detail.site,
        tasks: detail.tasks,
        clock_events: detail.clock_events,
        break_events: detail.break_events,
        attachments: detail.attachments,
        issues: detail.issues,
      }}
      activity={activity}
    />
  );
}
