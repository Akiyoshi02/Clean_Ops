"use client";

import { offlineDb, type QueueItem } from "@/lib/offline/db";
import { patchJson, postJson } from "@/lib/api-client";
import { toast } from "sonner";

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000;

function nextAttemptDelay(retryCount: number) {
  return BASE_DELAY_MS * Math.pow(2, retryCount);
}

function shouldStopRetry(errorMessage?: string | null) {
  if (!errorMessage) {
    return false;
  }
  return (
    errorMessage.includes("Invalid job status transition") ||
    errorMessage.includes("Forbidden") ||
    errorMessage.includes("Unauthorized") ||
    errorMessage.includes("permission") ||
    errorMessage.includes("not allowed")
  );
}

async function processQueueItem(item: QueueItem) {
  switch (item.type) {
    case "CLOCK_EVENT": {
      const { error } = await postJson("/api/clock-events", item.payload);
      return { error };
    }
    case "BREAK_EVENT": {
      const { error } = await postJson("/api/break-events", item.payload);
      return { error };
    }
    case "TASK_UPDATE": {
      if (!item.payload.id) {
        return { error: new Error("Missing task id") };
      }
      const { id, ...updates } = item.payload;
      const { error } = await patchJson(`/api/job-tasks/${id}`, updates);
      return { error };
    }
    case "JOB_STATUS": {
      const { error } = await patchJson(
        `/api/jobs/${item.payload.job_id}/status`,
        { status: item.payload.status },
      );
      return { error };
    }
    case "ISSUE": {
      const { error } = await postJson("/api/issues", item.payload);
      return { error };
    }
    default:
      return { error: new Error("Unknown queue type") };
  }
}

export async function syncPendingQueue() {
  const now = new Date().toISOString();
  const queueItems = await offlineDb.queue
    .where("status")
    .equals("PENDING")
    .and((item) => !item.next_attempt_at || item.next_attempt_at <= now)
    .toArray();

  for (const item of queueItems) {
    const response = await processQueueItem(item);
    if (!response || response.error) {
      const errorMessage = response?.error?.message ?? "Sync failed";
      const stopRetry = shouldStopRetry(errorMessage);
      const retryCount = item.retry_count + 1;
      const status =
        stopRetry || retryCount >= MAX_RETRIES ? "NEEDS_ATTENTION" : "PENDING";
      await offlineDb.queue.update(item.id!, {
        retry_count: retryCount,
        status,
        last_error: errorMessage,
        next_attempt_at:
          status === "PENDING"
            ? new Date(Date.now() + nextAttemptDelay(retryCount)).toISOString()
            : null,
      });
      continue;
    }
    await offlineDb.queue.delete(item.id!);
  }

  if (queueItems.length > 0) {
    toast.success("Offline changes synced");
  }
}
