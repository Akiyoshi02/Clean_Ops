import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-medium transition-colors",
  {
    variants: {
      variant: {
        default: 
          "border border-primary/20 bg-primary text-primary-foreground",
        secondary:
          "border border-border bg-secondary text-secondary-foreground",
        outline: 
          "border-2 border-border bg-transparent text-foreground",
        success: 
          "border border-success/30 bg-success-muted text-success",
        warning: 
          "border border-warning/30 bg-warning-muted text-warning-foreground",
        destructive:
          "border border-destructive/30 bg-destructive-muted text-destructive",
        info: 
          "border border-info/30 bg-info-muted text-info",
        muted: 
          "border border-transparent bg-muted text-muted-foreground",
        // Solid variants
        "solid-success":
          "border border-transparent bg-success text-success-foreground",
        "solid-warning":
          "border border-transparent bg-warning text-warning-foreground",
        "solid-destructive":
          "border border-transparent bg-destructive text-destructive-foreground",
        "solid-info":
          "border border-transparent bg-info text-info-foreground",
      },
      size: {
        xs: "px-1.5 py-0.5 text-[10px] leading-none",
        sm: "px-2 py-0.5 text-xs",
        default: "px-2.5 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  pulse?: boolean;
}

function Badge({ className, variant, size, dot, pulse, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span 
          className={cn(
            "h-1.5 w-1.5 rounded-full bg-current",
            pulse && "animate-pulse"
          )} 
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
