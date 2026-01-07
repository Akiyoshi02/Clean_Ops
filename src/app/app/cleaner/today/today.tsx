"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Clock,
  ChevronRight,
  Bell,
  AlertTriangle,
  WifiOff,
  Calendar,
  Sparkles,
  Play,
  CheckCircle2,
  Building2,
  ArrowUpRight,
} from "lucide-react";
import { offlineDb } from "@/lib/offline/db";
import { SyncBanner } from "@/components/layout/sync-indicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { JobStatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import type { Job, Notification, Site } from "@/lib/types";

type JobRow = Job & {
  sites?: Pick<Site, "name" | "city" | "state"> | null;
};

type NotificationRow = Notification;

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 }
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
  },
};

export function CleanerToday({
  initialJobs,
  notifications,
}: {
  initialJobs: JobRow[];
  notifications: NotificationRow[];
}) {
  const [jobs, setJobs] = React.useState<JobRow[]>(initialJobs);
  const [offline, setOffline] = React.useState(false);

  React.useEffect(() => {
    const cacheJobs = async () => {
      await offlineDb.cachedJobs.bulkPut(
        initialJobs.map((job) => ({
          job_id: job.id,
          payload: job as unknown as Record<string, unknown>,
          cached_at: new Date().toISOString(),
        })),
      );
    };
    void cacheJobs();
  }, [initialJobs]);

  React.useEffect(() => {
    const updateOnlineStatus = () => {
      setOffline(!navigator.onLine);
      if (!navigator.onLine) {
        offlineDb.cachedJobs.toArray().then((cached) => {
          const cachedJobs = cached.map(
            (entry) => entry.payload as JobRow,
          );
          if (cachedJobs.length > 0) {
            setJobs(cachedJobs);
          }
        });
      }
    };
    updateOnlineStatus();
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  const inProgressJobs = jobs.filter((j) => j.status === "IN_PROGRESS");
  const upcomingJobs = jobs.filter((j) => j.status !== "IN_PROGRESS");
  const completedToday = jobs.filter((j) => j.status === "APPROVED" || j.status === "COMPLETED_PENDING_REVIEW").length;

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Sync status banner */}
      <SyncBanner />

      {/* Offline warning */}
      <AnimatePresence>
        {offline && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="flex items-center gap-4 rounded-2xl border border-warning/30 bg-gradient-to-r from-warning/10 via-warning/5 to-transparent p-4 shadow-lg shadow-warning/5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/20">
              <WifiOff className="h-5 w-5 text-warning" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-warning">You&apos;re offline</p>
              <p className="text-sm text-warning/80">
                Showing cached jobs. Changes will sync when online.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero section with greeting */}
      <motion.div variants={fadeInUp} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/80 p-6 text-primary-foreground shadow-xl shadow-primary/20">
        {/* Background decorations */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
        
        <div className="relative flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary-foreground/80" />
              <span className="text-sm font-medium text-primary-foreground/80">
                {format(new Date(), "EEEE")}
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {format(new Date(), "MMMM d")}
            </h1>
            <p className="text-primary-foreground/80">
              {jobs.length === 0 
                ? "No jobs scheduled today" 
                : `${jobs.length} job${jobs.length === 1 ? "" : "s"} on your schedule`}
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Calendar className="h-8 w-8" />
          </div>
        </div>

        {/* Quick stats */}
        <div className="relative mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
            <div className="flex items-center gap-1.5">
              <Play className="h-3.5 w-3.5" />
              <span className="text-xs font-medium text-primary-foreground/80">Active</span>
            </div>
            <p className="mt-1 text-xl font-bold">{inProgressJobs.length}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-xs font-medium text-primary-foreground/80">Pending</span>
            </div>
            <p className="mt-1 text-xl font-bold">{upcomingJobs.length}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="text-xs font-medium text-primary-foreground/80">Done</span>
            </div>
            <p className="mt-1 text-xl font-bold">{completedToday}</p>
          </div>
        </div>
      </motion.div>

      {/* In Progress section */}
      <AnimatePresence>
        {inProgressJobs.length > 0 && (
          <motion.div
            variants={staggerItem}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card variant="elevated" className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-primary opacity-30" />
                    <div className="relative flex h-3 w-3 rounded-full bg-primary shadow-lg shadow-primary/50" />
                  </div>
                  In Progress
                  <span className="ml-auto text-sm font-normal text-muted-foreground">
                    {inProgressJobs.length} active
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {inProgressJobs.map((job, index) => (
                  <motion.div 
                    key={job.id} 
                    variants={staggerItem}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.05 }}
                  >
                    <JobCard job={job} variant="active" />
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upcoming Jobs */}
      <motion.div variants={staggerItem}>
        <Card variant="default">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              {inProgressJobs.length > 0 ? "Up Next" : "Today's Jobs"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingJobs.length > 0 ? (
              <div className="space-y-3">
                {upcomingJobs.map((job, index) => (
                  <motion.div 
                    key={job.id} 
                    variants={staggerItem}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: (inProgressJobs.length + index) * 0.05 }}
                  >
                    <JobCard job={job} />
                  </motion.div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <EmptyState
                icon="calendar"
                title="No jobs today"
                description="You don't have any jobs scheduled for today. Enjoy your day off!"
                size="sm"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-medium text-muted-foreground">
                  All caught up!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div variants={staggerItem}>
        <Card variant="default">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-muted-foreground" />
              Notifications
            </CardTitle>
            {notifications.length > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/30"
              >
                {notifications.length}
              </motion.span>
            )}
          </CardHeader>
          <CardContent>
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((note, index) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative rounded-2xl border border-border/60 bg-muted/30 p-4 transition-all duration-200 hover:border-border hover:bg-muted/50"
                  >
                    <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary/60 opacity-0 transition-opacity group-hover:opacity-100" />
                    <p className="font-semibold text-sm">{note.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{note.body}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  No new notifications
                </p>
              </div>
            )}
            <Button 
              asChild 
              variant="outline" 
              className="mt-4 w-full group" 
              size="default"
            >
              <Link href="/app/cleaner/issues">
                <AlertTriangle className="mr-2 h-4 w-4 text-warning" />
                Report an issue
                <ArrowUpRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

interface JobCardProps {
  job: JobRow;
  variant?: "default" | "active";
}

function JobCard({ job, variant = "default" }: JobCardProps) {
  const isActive = variant === "active";
  
  return (
    <Link
      href={`/app/cleaner/jobs/${job.id}`}
      className={cn(
        "group relative flex items-center gap-4 rounded-2xl border p-4 transition-all duration-200 active:scale-[0.98]",
        isActive
          ? "border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-lg shadow-primary/10"
          : "border-border/60 bg-card hover:border-border hover:shadow-md"
      )}
    >
      {/* Active indicator bar */}
      {isActive && (
        <motion.div 
          className="absolute left-0 top-1/2 h-12 w-1.5 -translate-y-1/2 rounded-r-full bg-primary"
          layoutId="active-job-indicator"
        />
      )}
      
      {/* Site icon */}
      <div className={cn(
        "flex h-14 w-14 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
        isActive 
          ? "bg-primary/20 text-primary" 
          : "bg-muted text-muted-foreground"
      )}>
        <MapPin className="h-6 w-6" />
      </div>
      
      {/* Job details */}
      <div className="min-w-0 flex-1">
        <p className={cn(
          "truncate font-semibold transition-colors",
          isActive && "text-primary"
        )}>
          {job.sites?.name ?? "Site"}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium">
            <Clock className="h-3.5 w-3.5" />
            {format(new Date(job.scheduled_start), "h:mm a")}
          </span>
          {job.sites?.city && (
            <span className="truncate text-muted-foreground/80">
              {job.sites.city}, {job.sites.state}
            </span>
          )}
        </div>
      </div>
      
      {/* Status and arrow */}
      <div className="flex flex-col items-end gap-2.5">
        <JobStatusBadge status={job.status} />
        <ChevronRight className={cn(
          "h-5 w-5 text-muted-foreground transition-all duration-200 group-hover:translate-x-1",
          isActive && "text-primary"
        )} />
      </div>
    </Link>
  );
}
