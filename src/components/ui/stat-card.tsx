"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { MotionDiv, fadeInUp } from "@/components/ui/motion";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning" | "error";
  size?: "default" | "lg";
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = "default",
  size = "default",
  className,
}: StatCardProps) {
  const variantStyles = {
    default: "bg-card border-border/60",
    primary: "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20",
    success: "bg-gradient-to-br from-success/5 to-success/10 border-success/20",
    warning: "bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20",
    error: "bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20",
  };

  const iconStyles = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    error: "bg-destructive/10 text-destructive",
  };

  return (
    <MotionDiv
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className={cn(
        "group relative overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-md",
        size === "lg" ? "p-8" : "p-6",
        variantStyles[variant],
        className
      )}
    >
      {/* Background decoration */}
      <div 
        className={cn(
          "absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-50 blur-2xl transition-opacity duration-300 group-hover:opacity-70",
          variant === "default" && "bg-muted",
          variant === "primary" && "bg-primary/20",
          variant === "success" && "bg-success/20",
          variant === "warning" && "bg-warning/20",
          variant === "error" && "bg-destructive/20",
        )}
      />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className={cn(
            "mt-2 font-bold tracking-tight",
            size === "lg" ? "text-4xl" : "text-3xl"
          )}>
            {value}
          </p>
          {description && (
            <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
          )}
          {trend && (
            <div className="mt-3 flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                  trend.isPositive 
                    ? "bg-success/10 text-success" 
                    : "bg-destructive/10 text-destructive"
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </span>
              {trend.label && (
                <span className="text-xs text-muted-foreground">{trend.label}</span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110",
              size === "lg" ? "h-14 w-14" : "h-12 w-12",
              iconStyles[variant]
            )}
          >
            <Icon className={size === "lg" ? "h-7 w-7" : "h-6 w-6"} />
          </div>
        )}
      </div>
    </MotionDiv>
  );
}

// Stats grid container
export function StatsGrid({
  children,
  columns = 4,
  className,
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const colsClass = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  };
  
  return (
    <div
      className={cn(
        "grid gap-4",
        colsClass[columns],
        className
      )}
    >
      {children}
    </div>
  );
}

// Compact stat for inline display
export function InlineStat({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {Icon && (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div>
        <span className="text-xs text-muted-foreground">{label}</span>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}
