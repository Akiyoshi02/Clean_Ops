"use client";

import { AlertTriangle, CloudOff, CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSyncEngine } from "@/lib/offline/useSyncEngine";

export function SyncStatusBanner({ className }: { className?: string }) {
  const { pendingCount, needsAttentionCount } = useSyncEngine();

  if (pendingCount === 0 && needsAttentionCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning",
        className,
      )}
    >
      {needsAttentionCount > 0 ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <CloudUpload className="h-4 w-4" />
      )}
      <span>
        {needsAttentionCount > 0
          ? `${needsAttentionCount} item(s) need attention`
          : `${pendingCount} change(s) queued to sync`}
      </span>
      {!navigator.onLine && <CloudOff className="h-4 w-4" />}
    </div>
  );
}
