"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  MapPin,
  Clock,
  ChevronRight,
  Bell,
  AlertTriangle,
  WifiOff,
  Calendar,
} from "lucide-react";
import { offlineDb } from "@/lib/offline/db";
import { SyncBanner } from "@/components/layout/sync-indicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { JobStatusBadge } from "@/components/ui/status-badge";
import type { Job, Notification, Site } from "@/lib/types";

type JobRow = Job & {
  sites?: Pick<Site, "name" | "city" | "state"> | null;
};

type NotificationRow = Notification;

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
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

  return (
    <div className="space-y-6">
      {/* Sync status banner */}
      <SyncBanner />

      {/* Offline warning */}
      {offline && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-2xl border border-warning/20 bg-warning/5 p-4"
        >
          <WifiOff className="h-5 w-5 text-warning" />
          <div>
            <p className="font-medium text-warning">You&apos;re offline</p>
            <p className="text-sm text-warning/80">
              Showing cached jobs. Changes will sync when online.
            </p>
          </div>
        </motion.div>
      )}

      {/* Date header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Today</h2>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d")}
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Calendar className="h-6 w-6" />
        </div>
      </div>

      {/* In Progress section */}
      {inProgressJobs.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-2 w-2 animate-pulse rounded-full bg-primary" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {inProgressJobs.map((job) => (
                <motion.div key={job.id} variants={staggerItem}>
                  <JobCard job={job} highlighted />
                </motion.div>
              ))}
            </motion.div>
          </CardContent>
        </Card>
      )}

      {/* Today's Jobs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {inProgressJobs.length > 0 ? "Upcoming" : "Today's Jobs"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingJobs.length > 0 ? (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {upcomingJobs.map((job) => (
                <motion.div key={job.id} variants={staggerItem}>
                  <JobCard job={job} />
                </motion.div>
              ))}
            </motion.div>
          ) : jobs.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No jobs today"
              description="You don't have any jobs scheduled for today. Enjoy your day off!"
            />
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No more jobs scheduled
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-muted-foreground" />
            Notifications
          </CardTitle>
          {notifications.length > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
              {notifications.length}
            </span>
          )}
        </CardHeader>
        <CardContent>
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((note) => (
                <div
                  key={note.id}
                  className="rounded-xl border border-border/50 bg-muted/30 p-3"
                >
                  <p className="font-medium text-sm">{note.title}</p>
                  <p className="text-sm text-muted-foreground">{note.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No new notifications
            </p>
          )}
          <Button asChild variant="outline" className="mt-4 w-full" size="sm">
            <Link href="/app/cleaner/issues">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Report an issue
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function JobCard({ job, highlighted }: { job: JobRow; highlighted?: boolean }) {
  return (
    <Link
      href={`/app/cleaner/jobs/${job.id}`}
      className={`group flex items-center gap-4 rounded-2xl border p-4 transition-all active:scale-[0.98] ${
        highlighted
          ? "border-primary/30 bg-card shadow-sm"
          : "border-border/50 bg-card hover:border-border hover:shadow-sm"
      }`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
        <MapPin className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{job.sites?.name ?? "Site"}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {format(new Date(job.scheduled_start), "h:mm a")}
          </span>
          {job.sites?.city && (
            <span className="truncate">
              {job.sites.city}, {job.sites.state}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <JobStatusBadge status={job.status} />
        <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
