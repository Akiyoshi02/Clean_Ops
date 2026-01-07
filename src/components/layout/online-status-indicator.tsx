"use client";

import * as React from "react";
import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { MotionDiv, fadeIn } from "@/components/ui/motion";

interface OnlineStatusIndicatorProps {
  className?: string;
  collapsed?: boolean;
}

export function OnlineStatusIndicator({
  className,
  collapsed = false,
}: OnlineStatusIndicatorProps) {
  const [online, setOnline] = React.useState(true);

  React.useEffect(() => {
    setOnline(navigator.onLine);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (collapsed) {
    return (
      <MotionDiv
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full",
          online
            ? "bg-success/10 text-success"
            : "bg-warning/10 text-warning",
          className
        )}
        title={online ? "Online" : "Offline"}
      >
        {online ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
      </MotionDiv>
    );
  }

  return (
    <MotionDiv
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium",
        online
          ? "border-success/20 bg-success/5 text-success"
          : "border-warning/20 bg-warning/5 text-warning",
        className
      )}
    >
      {online ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
      <span>{online ? "Online" : "Offline"}</span>
    </MotionDiv>
  );
}

// Minimal badge version for headers
export function OnlineStatusBadge({ className }: { className?: string }) {
  const [online, setOnline] = React.useState(true);

  React.useEffect(() => {
    setOnline(navigator.onLine);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border border-warning/20 bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning",
        className
      )}
    >
      <WifiOff className="h-3 w-3" />
      Offline
    </div>
  );
}
