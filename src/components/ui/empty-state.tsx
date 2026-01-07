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
  FolderOpen,
  Bell,
  MapPin,
  ClipboardList,
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
  folder: FolderOpen,
  bell: Bell,
  "map-pin": MapPin,
  checklist: ClipboardList,
};

interface EmptyStateProps {
  /** Icon name from registry (for Server Components) or LucideIcon (for Client Components) */
  icon?: keyof typeof iconRegistry | LucideIcon;
  title: string;
  description?: string;
  /** Action can be either { label, onClick } for simple buttons or a ReactNode for custom actions */
  action?: React.ReactNode | {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "search" | "error" | "success" | "minimal";
}

const variantIconMap: Record<string, LucideIcon> = {
  default: Inbox,
  search: Search,
  error: AlertCircle,
  success: CheckCircle,
  minimal: FileX,
};

const variantStyles: Record<string, string> = {
  default: "bg-muted/50 text-muted-foreground",
  search: "bg-info/10 text-info",
  error: "bg-destructive/10 text-destructive",
  success: "bg-success/10 text-success",
  minimal: "bg-muted/30 text-muted-foreground/60",
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  size = "default",
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

  const sizeStyles = {
    sm: {
      container: "py-8",
      iconWrapper: "h-12 w-12 rounded-xl",
      icon: "h-6 w-6",
      title: "text-base",
      description: "text-sm",
    },
    default: {
      container: "py-16",
      iconWrapper: "h-16 w-16 rounded-2xl",
      icon: "h-8 w-8",
      title: "text-lg",
      description: "text-sm",
    },
    lg: {
      container: "py-24",
      iconWrapper: "h-20 w-20 rounded-2xl",
      icon: "h-10 w-10",
      title: "text-xl",
      description: "text-base",
    },
  };

  const styles = sizeStyles[size];

  return (
    <MotionDiv
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        styles.container,
        className
      )}
    >
      <div 
        className={cn(
          "flex items-center justify-center",
          styles.iconWrapper,
          variantStyles[variant]
        )}
      >
        <IconComponent className={cn(styles.icon)} />
      </div>
      <h3 className={cn("mt-4 font-semibold text-foreground", styles.title)}>
        {title}
      </h3>
      {description && (
        <p className={cn("mt-2 max-w-sm text-muted-foreground", styles.description)}>
          {description}
        </p>
      )}
      {action && (
        <div className="mt-6">
          {React.isValidElement(action) ? (
            action
          ) : (
            <Button onClick={(action as { label: string; onClick: () => void }).onClick}>
              {(action as { label: string; onClick: () => void }).label}
            </Button>
          )}
        </div>
      )}
    </MotionDiv>
  );
}

// Inline empty state for smaller spaces
export function InlineEmptyState({
  icon: Icon = Inbox,
  message,
  className,
}: {
  icon?: LucideIcon;
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground",
        className
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );
}

// Card placeholder for loading or empty lists
export function CardPlaceholder({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-12 text-center",
        className
      )}
    >
      <FolderOpen className="h-8 w-8 text-muted-foreground/40" />
      {message && (
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
