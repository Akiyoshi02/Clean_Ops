import Dexie, { type Table } from "dexie";

export type QueueStatus = "PENDING" | "FAILED" | "NEEDS_ATTENTION";

export type QueueItem = {
  id?: number;
  type:
    | "CLOCK_EVENT"
    | "BREAK_EVENT"
    | "TASK_UPDATE"
    | "JOB_STATUS"
    | "ISSUE";
  payload: Record<string, unknown>;
  created_at: string;
  retry_count: number;
  next_attempt_at: string | null;
  status: QueueStatus;
  last_error?: string | null;
};

export type CachedJob = {
  job_id: string;
  payload: Record<string, unknown>;
  cached_at: string;
};

class CleanOpsDB extends Dexie {
  queue!: Table<QueueItem, number>;
  cachedJobs!: Table<CachedJob, string>;

  constructor() {
    super("cleanops-db");
    this.version(2).stores({
      queue: "++id, type, created_at, status, next_attempt_at",
      cachedJobs: "job_id, cached_at",
    });
  }
}

export const offlineDb = new CleanOpsDB();
