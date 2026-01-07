"use client";

import * as React from "react";
import { 
  FileX, 
  FileText,
  Inbox, 
  Search, 
  AlertCircle, 
  AlertTriangle,
  Clock,
  CheckCircle,
  Users,
  Calendar,
  Briefcase,
  Building2,
  type LucideIcon 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MotionDiv, fadeInUp } from "@/components/ui/motion";

// Icon registry for Server Component compatibility
const iconRegistry: Record<string, LucideIcon> = {
  inbox: Inbox,
  search: Search,
  "alert-circle": AlertCircle,
  "alert-triangle": AlertTriangle,
  "file-x": FileX,
  "file-text": FileText,
  clock: Clock,
  "check-circle": CheckCircle,
  users: Users,
  calendar: Calendar,
  briefcase: Briefcase,
  building: Building2,
};

interface EmptyStateProps {
  /** Icon name from registry (for Server Components) or LucideIcon (for Client Components) */
  icon?: keyof typeof iconRegistry | LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: "default" | "search" | "error" | "minimal";
}

const variantIconMap: Record<string, LucideIcon> = {
  default: Inbox,
  search: Search,
  error: AlertCircle,
  minimal: FileX,
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  variant = "default",
}: EmptyStateProps) {
  // Resolve icon: string (from registry), component, or variant default
  let IconComponent: LucideIcon;
  if (typeof icon === "string") {
    IconComponent = iconRegistry[icon] ?? variantIconMap[variant];
  } else if (icon) {
    IconComponent = icon;
  } else {
    IconComponent = variantIconMap[variant];
  }

  return (
    <MotionDiv
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className={cn("empty-state", className)}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
        <IconComponent className="h-8 w-8 text-muted-foreground/60" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-4" size="sm">
          {action.label}
        </Button>
      )}
    </MotionDiv>
  );
}

// Inline empty state for smaller spaces
export function InlineEmptyState({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center py-8 text-sm text-muted-foreground",
        className
      )}
    >
      <Inbox className="mr-2 h-4 w-4" />
      {message}
    </div>
  );
}
