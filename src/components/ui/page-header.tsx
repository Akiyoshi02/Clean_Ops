"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";
import { MotionDiv, fadeInUp } from "@/components/ui/motion";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: "primary" | "success" | "warning" | "destructive" | "info";
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  iconColor = "primary",
  badge,
  actions,
  className,
  children,
}: PageHeaderProps) {
  const iconColorStyles = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
    info: "bg-info/10 text-info",
  };

  return (
    <MotionDiv
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className={cn("mb-8", className)}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {Icon && (
            <div
              className={cn(
                "hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl",
                iconColorStyles[iconColor]
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl truncate">
                {title}
              </h1>
              {badge}
            </div>
            {description && (
              <p className="mt-1 text-muted-foreground max-w-2xl">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex flex-shrink-0 items-center gap-2">
            {actions}
          </div>
        )}
      </div>
      {children}
    </MotionDiv>
  );
}

// Section header for dividing page content
interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex-shrink-0">{actions}</div>
      )}
    </div>
  );
}

// Card header with icon
interface CardHeaderWithIconProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: "primary" | "success" | "warning" | "destructive" | "info" | "muted";
  actions?: React.ReactNode;
  className?: string;
}

export function CardHeaderWithIcon({
  title,
  description,
  icon: Icon,
  iconColor = "muted",
  actions,
  className,
}: CardHeaderWithIconProps) {
  const iconColorStyles = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
    info: "text-info",
    muted: "text-muted-foreground",
  };

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-3">
        {Icon && (
          <Icon className={cn("h-5 w-5", iconColorStyles[iconColor])} />
        )}
        <div>
          <h3 className="font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions}
    </div>
  );
}
