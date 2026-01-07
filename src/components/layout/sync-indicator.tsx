"use client";

import * as React from "react";
import { CloudUpload, AlertTriangle, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSyncEngine } from "@/lib/offline/useSyncEngine";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MotionDiv, fadeIn } from "@/components/ui/motion";

export function SyncIndicator({ className }: { className?: string }) {
  const { pendingCount, needsAttentionCount, isSyncing } = useSyncEngine();

  // Don't show if everything is synced
  if (pendingCount === 0 && needsAttentionCount === 0) {
    return null;
  }

  const hasError = needsAttentionCount > 0;
  const isPending = pendingCount > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-2 px-2",
            hasError && "text-destructive hover:text-destructive",
            isPending && !hasError && "text-warning hover:text-warning",
            className
          )}
        >
          {hasError ? (
            <AlertTriangle className="h-4 w-4" />
          ) : isSyncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CloudUpload className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {hasError
              ? `${needsAttentionCount} failed`
              : `${pendingCount} pending`}
          </span>
          <span className="sm:hidden">{hasError ? needsAttentionCount : pendingCount}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {hasError ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <CloudUpload className="h-5 w-5 text-warning" />
            )}
            <div>
              <p className="font-medium">
                {hasError ? "Sync issues" : "Syncing changes"}
              </p>
              <p className="text-sm text-muted-foreground">
                {hasError
                  ? `${needsAttentionCount} item(s) need attention`
                  : `${pendingCount} change(s) waiting to sync`}
              </p>
            </div>
          </div>
          {hasError && (
            <p className="text-sm text-muted-foreground">
              Some changes couldn&apos;t be synced. They will retry automatically
              when you&apos;re back online.
            </p>
          )}
          {!hasError && (
            <p className="text-sm text-muted-foreground">
              Your changes are saved locally and will sync when you&apos;re online.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Banner version for mobile
export function SyncBanner({ className }: { className?: string }) {
  const { pendingCount, needsAttentionCount } = useSyncEngine();

  if (pendingCount === 0 && needsAttentionCount === 0) {
    return null;
  }

  const hasError = needsAttentionCount > 0;

  return (
    <MotionDiv
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 text-sm",
        hasError
          ? "border-destructive/20 bg-destructive/5 text-destructive"
          : "border-warning/20 bg-warning/5 text-warning",
        className
      )}
    >
      {hasError ? (
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
      ) : (
        <CloudUpload className="h-5 w-5 flex-shrink-0" />
      )}
      <div className="flex-1">
        <p className="font-medium">
          {hasError
            ? `${needsAttentionCount} item(s) need attention`
            : `${pendingCount} change(s) pending sync`}
        </p>
        <p className="text-xs opacity-80">
          {hasError
            ? "Check your connection and try again"
            : "Will sync automatically when online"}
        </p>
      </div>
    </MotionDiv>
  );
}
