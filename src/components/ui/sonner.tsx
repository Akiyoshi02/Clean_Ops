"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      richColors
      toastOptions={{
        className: "rounded-xl border border-border bg-card text-foreground",
      }}
    />
  );
}
