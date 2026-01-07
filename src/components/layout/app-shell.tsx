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
  ChevronRight,
  User,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { navByRole } from "@/lib/nav";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { OnlineStatusPill } from "@/components/layout/online-status";
import { useSyncEngine } from "@/lib/offline/useSyncEngine";

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
  const { pendingCount, needsAttentionCount } = useSyncEngine();

  const isMobile = profile.role === "CLEANER";

  const initials = profile.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Role colors for visual distinction
  const roleColors = {
    HR: "from-violet-500 to-purple-600",
    SUPERVISOR: "from-blue-500 to-cyan-500",
    CLEANER: "from-emerald-500 to-teal-500",
  };

  return (
    <div className="relative min-h-screen bg-gradient-page">
      {/* Desktop Sidebar - HR and Supervisor */}
      {!isMobile && (
        <>
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border/60 bg-card/80 backdrop-blur-xl transition-all duration-300 ease-out-expo lg:flex",
              sidebarCollapsed ? "w-[72px]" : "w-[280px]"
            )}
          >
            {/* Logo Section */}
            <div
              className={cn(
                "flex h-16 items-center border-b border-border/60",
                sidebarCollapsed ? "justify-center px-2" : "justify-between px-4"
              )}
            >
              <Link 
                href="/app" 
                className={cn(
                  "flex items-center gap-3 transition-opacity hover:opacity-80",
                  sidebarCollapsed && "justify-center"
                )}
              >
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br font-bold text-white shadow-lg",
                  roleColors[profile.role]
                )}>
                  <Sparkles className="h-5 w-5" />
                </div>
                {!sidebarCollapsed && (
                  <div className="flex flex-col">
                    <span className="text-lg font-bold tracking-tight">CleanOPS</span>
                    <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                      {profile.role}
                    </span>
                  </div>
                )}
              </Link>
              {!sidebarCollapsed && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setSidebarCollapsed(true)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
              {!sidebarCollapsed && (
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Navigation
                </p>
              )}
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href as Route}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      sidebarCollapsed && "justify-center px-2"
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 flex-shrink-0 transition-transform duration-200",
                        !isActive && "group-hover:scale-110"
                      )}
                    />
                    {!sidebarCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                    {isActive && !sidebarCollapsed && (
                      <motion.div
                        layoutId="sidebar-indicator"
                        className="absolute right-3 h-1.5 w-1.5 rounded-full bg-primary-foreground"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Sidebar footer */}
            <div
              className={cn(
                "border-t border-border/60 p-3 space-y-3",
                sidebarCollapsed && "flex flex-col items-center"
              )}
            >
              {!sidebarCollapsed && (
                <div className="rounded-xl bg-muted/50 p-3">
                  <OnlineStatusPill className="w-full justify-center" />
                </div>
              )}
              
              {sidebarCollapsed ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground"
                  onClick={() => setSidebarCollapsed(false)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <SignOutButton className="w-full" variant="outline" />
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
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
                <motion.aside
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="fixed inset-y-0 left-0 z-50 w-[300px] border-r border-border/60 bg-card shadow-2xl lg:hidden"
                >
                  <div className="flex h-16 items-center justify-between border-b border-border/60 px-4">
                    <Link href="/app" className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br font-bold text-white shadow-lg",
                        roleColors[profile.role]
                      )}>
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-lg font-bold tracking-tight">CleanOPS</span>
                        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                          {profile.role}
                        </span>
                      </div>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                    <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Navigation
                    </p>
                    {navItems.map((item) => {
                      const isActive = pathname.startsWith(item.href);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href as Route}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                  
                  <div className="border-t border-border/60 p-4 space-y-3">
                    <div className="rounded-xl bg-muted/50 p-3">
                      <OnlineStatusPill className="w-full justify-center" />
                    </div>
                    <SignOutButton className="w-full" variant="outline" />
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
          "flex min-h-screen flex-col transition-all duration-300 ease-out-expo",
          !isMobile && !sidebarCollapsed && "lg:pl-[280px]",
          !isMobile && sidebarCollapsed && "lg:pl-[72px]",
          isMobile && "pb-[calc(5rem+env(safe-area-inset-bottom,0px))]"
        )}
      >
        {/* Top header */}
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
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
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br font-bold text-white shadow-md",
                    roleColors[profile.role]
                  )}>
                    <Sparkles className="h-4 w-4" />
                  </div>
                </Link>
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Welcome back
                </p>
                <h1 className="truncate text-lg font-bold leading-tight">
                  {profile.name.split(" ")[0]}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Sync status indicator */}
              {(pendingCount > 0 || needsAttentionCount > 0) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold sm:flex",
                    needsAttentionCount > 0
                      ? "bg-destructive/10 text-destructive"
                      : "bg-warning/10 text-warning"
                  )}
                >
                  <span className="relative flex h-2 w-2">
                    <span className={cn(
                      "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                      needsAttentionCount > 0 ? "bg-destructive" : "bg-warning"
                    )} />
                    <span className={cn(
                      "relative inline-flex h-2 w-2 rounded-full",
                      needsAttentionCount > 0 ? "bg-destructive" : "bg-warning"
                    )} />
                  </span>
                  {needsAttentionCount > 0
                    ? `${needsAttentionCount} failed`
                    : `${pendingCount} pending`}
                </motion.div>
              )}

              <OnlineStatusPill className="hidden sm:flex" />

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full p-0 ring-2 ring-border ring-offset-2 ring-offset-background transition-all hover:ring-primary/50 focus-visible:outline-none focus-visible:ring-primary"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={cn(
                        "bg-gradient-to-br text-white font-bold text-sm",
                        roleColors[profile.role]
                      )}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2" sideOffset={8}>
                  <div className="flex items-center gap-3 px-2 py-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className={cn(
                        "bg-gradient-to-br text-white font-bold",
                        roleColors[profile.role]
                      )}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{profile.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {profile.email}
                      </p>
                      <span className={cn(
                        "mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white",
                        profile.role === "HR" && "bg-violet-500",
                        profile.role === "SUPERVISOR" && "bg-blue-500",
                        profile.role === "CLEANER" && "bg-emerald-500",
                      )}>
                        {profile.role}
                      </span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/app/profile" className="flex items-center gap-3 cursor-pointer py-2.5 rounded-lg">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Profile Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <SignOutButton
                    variant="ghost"
                    size="sm"
                    showIcon={true}
                    className="w-full justify-start gap-3 px-2 py-2.5 text-sm font-normal text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-7xl"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile bottom navigation - Cleaner only */}
      {isMobile && (
        <nav 
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-xl"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="flex items-center justify-around px-2 py-2">
            {navItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href as Route}
                  className={cn(
                    "relative flex min-w-[64px] flex-col items-center gap-1 rounded-2xl px-3 py-2 transition-all duration-200",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground active:scale-95"
                  )}
                >
                  <motion.div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
                      isActive && "bg-primary/10 shadow-lg shadow-primary/10"
                    )}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Icon className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      isActive && "scale-110"
                    )} />
                  </motion.div>
                  <span className={cn(
                    "text-[11px] font-medium transition-colors",
                    isActive && "font-semibold"
                  )}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-indicator"
                      className="absolute -bottom-1 h-1 w-6 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
