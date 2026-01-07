"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { offlineDb } from "@/lib/offline/db";
import { syncPendingQueue } from "@/lib/offline/sync";

export function useSyncEngine() {
  const [isSyncing, setIsSyncing] = React.useState(false);
  
  const pendingQueue = useLiveQuery(
    () => offlineDb.queue.where("status").equals("PENDING").count(),
    [],
  );
  const needsAttention = useLiveQuery(
    () =>
      offlineDb.queue.where("status").equals("NEEDS_ATTENTION").count(),
    [],
  );

  React.useEffect(() => {
    const handleOnline = async () => {
      setIsSyncing(true);
      try {
        await syncPendingQueue();
      } finally {
        setIsSyncing(false);
      }
    };
    window.addEventListener("online", handleOnline);
    if (navigator.onLine) {
      void handleOnline();
    }
    const interval = window.setInterval(() => {
      if (navigator.onLine) {
        void handleOnline();
      }
    }, 30000);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.clearInterval(interval);
    };
  }, []);

  return {
    pendingCount: pendingQueue ?? 0,
    needsAttentionCount: needsAttention ?? 0,
    isSyncing,
  };
}
