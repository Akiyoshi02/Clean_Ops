import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-sm",
        outline:
          "border-2 border-input bg-background hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
        ghost: 
          "hover:bg-accent hover:text-accent-foreground",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
        success:
          "bg-success text-success-foreground shadow-sm hover:bg-success/90 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
        warning:
          "bg-warning text-warning-foreground shadow-sm hover:bg-warning/90 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
        link: 
          "text-primary underline-offset-4 hover:underline",
        subtle:
          "bg-primary/10 text-primary hover:bg-primary/20",
        "subtle-destructive":
          "bg-destructive/10 text-destructive hover:bg-destructive/20",
        "subtle-success":
          "bg-success/10 text-success hover:bg-success/20",
      },
      size: {
        xs: "h-7 px-2.5 text-xs rounded-lg gap-1.5",
        sm: "h-9 px-3.5 gap-1.5",
        default: "h-11 px-5",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-base font-bold",
        icon: "h-10 w-10 p-0",
        "icon-xs": "h-7 w-7 p-0 rounded-lg",
        "icon-sm": "h-8 w-8 p-0",
        "icon-lg": "h-12 w-12 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading, 
    leftIcon,
    rightIcon,
    children, 
    disabled, 
    ...props 
  }, ref) => {
    // Don't use Slot when loading, as Slot requires a single child
    const Comp = asChild && !loading ? Slot : "button";
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="[&>svg]:h-4 [&>svg]:w-4">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="[&>svg]:h-4 [&>svg]:w-4">{rightIcon}</span>}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
