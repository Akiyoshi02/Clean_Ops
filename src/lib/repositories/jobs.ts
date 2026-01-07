import { adminDb } from "@/lib/firebase/admin";
import { mapDocs, withId } from "@/lib/firebase/db";
import type {
  BreakEvent,
  Client,
  Job,
  JobAttachment,
  JobClockEvent,
  JobStatusEvent,
  JobTask,
  Issue,
  Site,
} from "@/lib/types";

export async function listJobs(params?: {
  start?: string;
  end?: string;
  cleanerId?: string;
}) {
  if (params?.cleanerId && !params.start && !params.end) {
    const snapshot = await adminDb
      .collection("jobs")
      .where("assigned_cleaner_id", "==", params.cleanerId)
      .get();
    const jobs = mapDocs<Job>(snapshot);
    return jobs.sort(
      (a, b) =>
        new Date(a.scheduled_start).getTime() -
        new Date(b.scheduled_start).getTime(),
    );
  }

  if (params?.cleanerId && (params.start || params.end)) {
    const snapshot = await adminDb
      .collection("jobs")
      .where("assigned_cleaner_id", "==", params.cleanerId)
      .get();
    const jobs = mapDocs<Job>(snapshot);
    const filtered = jobs.filter((job) => {
      const startOk = params.start
        ? new Date(job.scheduled_start) >= new Date(params.start)
        : true;
      const endOk = params.end
        ? new Date(job.scheduled_start) <= new Date(params.end)
        : true;
      return startOk && endOk;
    });
    return filtered.sort(
      (a, b) =>
        new Date(a.scheduled_start).getTime() -
        new Date(b.scheduled_start).getTime(),
    );
  }

  let query: FirebaseFirestore.Query = adminDb
    .collection("jobs")
    .orderBy("scheduled_start");
  if (params?.start) {
    query = query.where("scheduled_start", ">=", params.start);
  }
  if (params?.end) {
    query = query.where("scheduled_start", "<=", params.end);
  }
  if (params?.cleanerId) {
    query = query.where("assigned_cleaner_id", "==", params.cleanerId);
  }
  const snapshot = await query.get();
  return mapDocs<Job>(snapshot);
}

export async function listOverdueJobs(cutoffIso: string) {
  const snapshot = await adminDb
    .collection("jobs")
    .where("status", "==", "IN_PROGRESS")
    .get();
  const jobs = mapDocs<Job>(snapshot);
  return jobs
    .filter((job) => new Date(job.scheduled_end) <= new Date(cutoffIso))
    .sort(
      (a, b) =>
        new Date(a.scheduled_end).getTime() -
        new Date(b.scheduled_end).getTime(),
    );
}

export async function getJobsByIds(ids: string[]) {
  if (ids.length === 0) {
    return [];
  }
  const refs = ids.map((id) => adminDb.collection("jobs").doc(id));
  const docs = await adminDb.getAll(...refs);
  return docs
    .filter((doc) => doc.exists)
    .map((doc) => ({ ...(doc.data() as Job), id: doc.id } as Job));
}

export async function getJobDetail(jobId: string) {
  const jobDoc = await adminDb.collection("jobs").doc(jobId).get();
  if (!jobDoc.exists) {
    return null;
  }

  const job = { ...(jobDoc.data() as Job), id: jobDoc.id } as Job;

  const [
    tasksSnap,
    clockSnap,
    breakSnap,
    attachmentsSnap,
    issuesSnap,
    statusSnap,
    siteDoc,
  ] = await Promise.all([
    adminDb.collection("job_tasks").where("job_id", "==", jobId).get(),
    adminDb.collection("job_clock_events").where("job_id", "==", jobId).get(),
    adminDb.collection("break_events").where("job_id", "==", jobId).get(),
    adminDb.collection("job_attachments").where("job_id", "==", jobId).get(),
    adminDb.collection("issues").where("job_id", "==", jobId).get(),
    adminDb.collection("job_status_events").where("job_id", "==", jobId).get(),
    adminDb.collection("sites").doc(job.site_id).get(),
  ]);

  const site = siteDoc.exists ? ({ ...(siteDoc.data() as Site), id: siteDoc.id } as Site) : null;
  let client: Client | null = null;
  if (site?.client_id) {
    const clientDoc = await adminDb.collection("clients").doc(site.client_id).get();
    client = clientDoc.exists
      ? ({ ...(clientDoc.data() as Client), id: clientDoc.id } as Client)
      : null;
  }

  return {
    job,
    site,
    client,
    tasks: tasksSnap.docs.map((doc) => withId<JobTask>(doc)),
    clock_events: clockSnap.docs.map((doc) => withId<JobClockEvent>(doc)),
    break_events: breakSnap.docs.map((doc) => withId<BreakEvent>(doc)),
    attachments: attachmentsSnap.docs.map((doc) => withId<JobAttachment>(doc)),
    issues: issuesSnap.docs.map((doc) => withId<Issue>(doc)),
    status_events: statusSnap.docs.map((doc) => withId<JobStatusEvent>(doc)),
  };
}
