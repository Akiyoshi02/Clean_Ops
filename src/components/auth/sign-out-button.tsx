"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { firebaseAuth } from "@/lib/firebase/client";
import { postJson } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface SignOutButtonProps extends Omit<ButtonProps, "onClick"> {
  showIcon?: boolean;
}

export const SignOutButton = React.forwardRef<HTMLButtonElement, SignOutButtonProps>(
  function SignOutButton(
    {
      className,
      variant = "outline",
      size = "sm",
      showIcon = true,
      children,
      ...props
    },
    ref
  ) {
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSignOut = async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (isLoading) return;
      setIsLoading(true);

      try {
        // Clear server session cookie
        await postJson("/api/auth/logout", {});
        
        // Sign out from Firebase client
        await firebaseAuth.signOut();
        
        // Navigate to login
        router.push("/login");
        router.refresh();
      } catch (error) {
        console.error("Sign out error:", error);
        // Still try to redirect even if there's an error
        router.push("/login");
        router.refresh();
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <Button
        ref={ref}
        type="button"
        variant={variant}
        size={size}
        onClick={handleSignOut}
        disabled={isLoading}
        className={cn(className)}
        {...props}
      >
        {showIcon && <LogOut className="mr-2 h-4 w-4" />}
        {children ?? (isLoading ? "Signing out..." : "Sign out")}
      </Button>
    );
  }
);
