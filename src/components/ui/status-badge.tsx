"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Circle,
  Loader2,
  Play,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        success: "bg-success/10 text-success border border-success/20",
        warning: "bg-warning/10 text-warning border border-warning/20",
        error: "bg-destructive/10 text-destructive border border-destructive/20",
        info: "bg-primary/10 text-primary border border-primary/20",
        muted: "bg-muted text-muted-foreground",
      },
      size: {
        sm: "text-[10px] px-2 py-0.5",
        default: "text-xs px-2.5 py-0.5",
        lg: "text-sm px-3 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  icon?: LucideIcon;
  showDot?: boolean;
}

export function StatusBadge({
  className,
  variant,
  size,
  icon: Icon,
  showDot,
  children,
  ...props
}: StatusBadgeProps) {
  const dotColors = {
    default: "bg-secondary-foreground",
    success: "bg-success",
    warning: "bg-warning",
    error: "bg-destructive",
    info: "bg-primary",
    muted: "bg-muted-foreground",
  };

  return (
    <span
      className={cn(statusBadgeVariants({ variant, size }), className)}
      {...props}
    >
      {showDot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            dotColors[variant ?? "default"]
          )}
        />
      )}
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}

// Job status badge with appropriate colors and icons
const jobStatusConfig: Record<
  string,
  { variant: "default" | "success" | "warning" | "error" | "info" | "muted"; icon: LucideIcon; label: string }
> = {
  DRAFT: { variant: "muted", icon: Circle, label: "Draft" },
  PUBLISHED: { variant: "info", icon: Clock, label: "Published" },
  IN_PROGRESS: { variant: "warning", icon: Play, label: "In Progress" },
  COMPLETED_PENDING_REVIEW: { variant: "info", icon: Clock, label: "Pending Review" },
  APPROVED: { variant: "success", icon: CheckCircle2, label: "Approved" },
  REWORK_REQUIRED: { variant: "error", icon: RotateCcw, label: "Rework Required" },
  CANCELLED: { variant: "muted", icon: XCircle, label: "Cancelled" },
};

export function JobStatusBadge({ status }: { status: string }) {
  const config = jobStatusConfig[status] ?? {
    variant: "default" as const,
    icon: Circle,
    label: status,
  };

  return (
    <StatusBadge variant={config.variant} icon={config.icon}>
      {config.label}
    </StatusBadge>
  );
}

// Issue status badge
const issueStatusConfig: Record<
  string,
  { variant: "default" | "success" | "warning" | "error" | "info" | "muted"; label: string }
> = {
  OPEN: { variant: "error", label: "Open" },
  ACKNOWLEDGED: { variant: "warning", label: "Acknowledged" },
  RESOLVED: { variant: "success", label: "Resolved" },
};

export function IssueStatusBadge({ status }: { status: string }) {
  const config = issueStatusConfig[status] ?? { variant: "default" as const, label: status };
  return (
    <StatusBadge variant={config.variant} showDot>
      {config.label}
    </StatusBadge>
  );
}

// Issue severity badge
const issueSeverityConfig: Record<
  string,
  { variant: "default" | "success" | "warning" | "error" | "info" | "muted"; label: string }
> = {
  LOW: { variant: "muted", label: "Low" },
  MEDIUM: { variant: "warning", label: "Medium" },
  HIGH: { variant: "error", label: "High" },
};

export function IssueSeverityBadge({ severity }: { severity: string }) {
  const config = issueSeverityConfig[severity] ?? {
    variant: "default" as const,
    label: severity,
  };
  return <StatusBadge variant={config.variant}>{config.label}</StatusBadge>;
}

// Timesheet status badge
const timesheetStatusConfig: Record<
  string,
  { variant: "default" | "success" | "warning" | "error" | "info" | "muted"; label: string }
> = {
  OPEN: { variant: "info", label: "Open" },
  SUBMITTED: { variant: "warning", label: "Submitted" },
  APPROVED: { variant: "success", label: "Approved" },
};

export function TimesheetStatusBadge({ status }: { status: string }) {
  const config = timesheetStatusConfig[status] ?? {
    variant: "default" as const,
    label: status,
  };
  return (
    <StatusBadge variant={config.variant} showDot>
      {config.label}
    </StatusBadge>
  );
}

// Role badge
const roleConfig: Record<
  string,
  { variant: "default" | "success" | "warning" | "error" | "info" | "muted"; label: string }
> = {
  HR: { variant: "info", label: "HR" },
  SUPERVISOR: { variant: "warning", label: "Supervisor" },
  CLEANER: { variant: "success", label: "Cleaner" },
};

export function RoleBadge({ role }: { role: string }) {
  const config = roleConfig[role] ?? { variant: "default" as const, label: role };
  return <StatusBadge variant={config.variant}>{config.label}</StatusBadge>;
}

// Sync status badge
export function SyncStatusBadge({
  pending,
  failed,
}: {
  pending: number;
  failed: number;
}) {
  if (failed > 0) {
    return (
      <StatusBadge variant="error" icon={AlertTriangle}>
        {failed} failed
      </StatusBadge>
    );
  }
  if (pending > 0) {
    return (
      <StatusBadge variant="warning" icon={Loader2}>
        {pending} syncing
      </StatusBadge>
    );
  }
  return (
    <StatusBadge variant="success" icon={CheckCircle2}>
      Synced
    </StatusBadge>
  );
}

// Geofence status badge
export function GeofenceBadge({
  isWithin,
  distance,
}: {
  isWithin: boolean | null;
  distance?: number | null;
}) {
  if (isWithin === null) {
    return <StatusBadge variant="muted">Unknown</StatusBadge>;
  }
  if (isWithin) {
    return (
      <StatusBadge variant="success" icon={CheckCircle2}>
        Within geofence
      </StatusBadge>
    );
  }
  return (
    <StatusBadge variant="warning" icon={AlertTriangle}>
      Outside ({Math.round(distance ?? 0)}m)
    </StatusBadge>
  );
}
