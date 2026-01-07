"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ChevronLeft,
  Bell,
  Settings,
  LogOut,
  User,
  Moon,
  Sun,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { navByRole } from "@/lib/nav";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { OnlineStatusIndicator } from "@/components/layout/online-status-indicator";
import { SyncIndicator } from "@/components/layout/sync-indicator";

type AppShellProfile = {
  id: string;
  name: string;
  role: "HR" | "SUPERVISOR" | "CLEANER";
  email: string;
};

interface AppShellProps {
  profile: AppShellProfile;
  children: React.ReactNode;
}

export function AppShell({ profile, children }: AppShellProps) {
  const pathname = usePathname();
  const navItems = navByRole[profile.role];
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const isMobile = profile.role === "CLEANER";

  const initials = profile.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative min-h-screen bg-gradient-subtle">
      {/* Desktop Sidebar - HR and Supervisor */}
      {!isMobile && (
        <>
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border/50 bg-card/80 backdrop-blur-xl transition-all duration-300 lg:flex",
              sidebarCollapsed ? "w-[72px]" : "w-64"
            )}
          >
            {/* Logo */}
            <div
              className={cn(
                "flex h-16 items-center border-b border-border/50 px-4",
                sidebarCollapsed ? "justify-center" : "justify-between"
              )}
            >
              {!sidebarCollapsed && (
                <Link href="/app" className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                    CO
                  </div>
                  <span className="font-semibold">CleanOPS</span>
                </Link>
              )}
              {sidebarCollapsed && (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                  CO
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 text-muted-foreground",
                  sidebarCollapsed && "hidden"
                )}
                onClick={() => setSidebarCollapsed(true)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href as Route}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      sidebarCollapsed && "justify-center px-2"
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 flex-shrink-0",
                        isActive
                          ? "text-primary-foreground"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </nav>

            {/* Sidebar footer */}
            <div
              className={cn(
                "border-t border-border/50 p-3",
                sidebarCollapsed && "flex flex-col items-center"
              )}
            >
              <OnlineStatusIndicator collapsed={sidebarCollapsed} />
              {sidebarCollapsed ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-2"
                  onClick={() => setSidebarCollapsed(false)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
              ) : (
                <SignOutButton className="mt-2 w-full justify-start" />
              )}
            </div>
          </aside>

          {/* Mobile sidebar overlay */}
          <AnimatePresence>
            {sidebarOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
                <motion.aside
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="fixed inset-y-0 left-0 z-50 w-72 border-r border-border/50 bg-card lg:hidden"
                >
                  <div className="flex h-16 items-center justify-between border-b border-border/50 px-4">
                    <Link href="/app" className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                        CO
                      </div>
                      <span className="font-semibold">CleanOPS</span>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <nav className="flex-1 space-y-1 p-3">
                    {navItems.map((item) => {
                      const isActive = pathname.startsWith(item.href);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href as Route}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                  <div className="border-t border-border/50 p-3">
                    <OnlineStatusIndicator collapsed={false} />
                    <SignOutButton className="mt-2 w-full justify-start" />
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Main content area */}
      <div
        className={cn(
          "flex min-h-screen flex-col",
          !isMobile && !sidebarCollapsed && "lg:pl-64",
          !isMobile && sidebarCollapsed && "lg:pl-[72px]",
          isMobile && "pb-[calc(4.5rem+var(--safe-area-inset-bottom))]"
        )}
      >
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-4">
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            {isMobile && (
              <Link href="/app" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                  CO
                </div>
              </Link>
            )}
            <div>
              <p className="text-sm text-muted-foreground">{profile.role}</p>
              <h1 className="text-lg font-semibold leading-tight sm:text-xl">
                {profile.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <SyncIndicator />
            <OnlineStatusIndicator className="hidden sm:flex" collapsed />

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{profile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {profile.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/app/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <SignOutButton
                  variant="ghost"
                  size="sm"
                  showIcon={true}
                  className="w-full justify-start px-2 py-1.5 text-sm font-normal text-destructive hover:text-destructive hover:bg-destructive/10"
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile bottom navigation - Cleaner only */}
      {isMobile && (
        <nav className="action-bar-mobile px-2 pt-2">
          <div className="flex items-center justify-around">
            {navItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href as Route}
                  className={cn(
                    "flex min-w-[64px] flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
                      isActive && "bg-primary/10"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
