"use client";

import * as React from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  Coffee,
  Navigation,
  AlertTriangle,
  Camera,
  ChevronRight,
  MapPinned,
  PlayCircle,
  StopCircle,
  Send,
  Shield,
  Info,
} from "lucide-react";
import { patchJson, postJson } from "@/lib/api-client";
import { offlineDb } from "@/lib/offline/db";
import { haversineDistanceMeters } from "@/lib/geo";
import { calculateBreakSummary } from "@/lib/attendance";
import { SyncBanner } from "@/components/layout/sync-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { JobStatusBadge } from "@/components/ui/status-badge";
import type {
  BreakEvent,
  Issue,
  Job,
  JobAttachment,
  JobClockEvent,
  JobTask,
  Site,
} from "@/lib/types";

type JobDetail = Job & {
  site: Site | null;
  tasks: JobTask[];
  attachments: JobAttachment[];
  clock_events: JobClockEvent[];
  break_events: BreakEvent[];
  issues: Issue[];
};

const issueCategories = [
  { value: "ACCESS", label: "Access Issue" },
  { value: "SAFETY", label: "Safety Hazard" },
  { value: "SUPPLIES", label: "Missing Supplies" },
  { value: "CLIENT_REQUEST", label: "Client Request" },
  { value: "OTHER", label: "Other" },
];

const issueSeverities = [
  { value: "LOW", label: "Low", color: "text-muted-foreground" },
  { value: "MEDIUM", label: "Medium", color: "text-warning" },
  { value: "HIGH", label: "High", color: "text-destructive" },
];

export function CleanerJobDetail({ job }: { job: JobDetail }) {
  const [tasks, setTasks] = React.useState(job.tasks ?? []);
  const [attachments] = React.useState(job.attachments ?? []);
  const [clocking, setClocking] = React.useState(false);
  const [issueCategory, setIssueCategory] = React.useState(issueCategories[0].value);
  const [issueSeverity, setIssueSeverity] = React.useState(issueSeverities[0].value);
  const [breakEvents, setBreakEvents] = React.useState(job.break_events ?? []);
  const [clockEvents, setClockEvents] = React.useState(job.clock_events ?? []);
  const [showIssueForm, setShowIssueForm] = React.useState(false);

  const site = job.site;

  React.useEffect(() => {
    void offlineDb.cachedJobs.put({
      job_id: job.id,
      payload: job as unknown as Record<string, unknown>,
      cached_at: new Date().toISOString(),
    });
  }, [job]);

  const queueTask = async (payload: Record<string, unknown>, type: string) => {
    await offlineDb.queue.add({
      type: type as
        | "TASK_UPDATE"
        | "CLOCK_EVENT"
        | "BREAK_EVENT"
        | "JOB_STATUS"
        | "ISSUE",
      payload,
      created_at: new Date().toISOString(),
      retry_count: 0,
      next_attempt_at: null,
      status: "PENDING",
    });
  };

  const handleClock = async (clockType: "CLOCK_IN" | "CLOCK_OUT") => {
    if (!site) return;
    setClocking(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = position.coords;
        const distance = haversineDistanceMeters(
          coords.latitude,
          coords.longitude,
          site.lat,
          site.lng,
        );
        if (distance > site.geofence_radius_meters) {
          toast.warning(
            `Outside geofence by ${Math.round(distance - site.geofence_radius_meters)}m. Clock recorded as exception.`,
          );
        }

        const payload = {
          job_id: job.id,
          type: clockType,
          at: new Date().toISOString(),
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy_meters: coords.accuracy,
          source: navigator.onLine ? "ONLINE" : "OFFLINE_SYNCED",
        };

        if (navigator.onLine) {
          const { error } = await postJson("/api/clock-events", payload);
          if (error) {
            toast.error(error.message);
          } else {
            setClockEvents((prev) => [
              ...prev,
              payload as unknown as (typeof clockEvents)[number],
            ]);
          }
          if (clockType === "CLOCK_IN") {
            await patchJson(`/api/jobs/${job.id}/status`, {
              status: "IN_PROGRESS",
            });
          }
        } else {
          await queueTask(payload, "CLOCK_EVENT");
          if (clockType === "CLOCK_IN") {
            await queueTask({ job_id: job.id, status: "IN_PROGRESS" }, "JOB_STATUS");
          }
          setClockEvents((prev) => [
            ...prev,
            payload as unknown as (typeof clockEvents)[number],
          ]);
        }

        setClocking(false);
      },
      () => {
        toast.error("Unable to get location");
        setClocking(false);
      },
    );
  };

  const handleBreak = async (breakType: "BREAK_START" | "BREAK_END") => {
    if (!site) return;
    setClocking(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = position.coords;
        const payload = {
          job_id: job.id,
          type: breakType,
          at: new Date().toISOString(),
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy_meters: coords.accuracy,
          source: navigator.onLine ? "ONLINE" : "OFFLINE_SYNCED",
        };

        if (navigator.onLine) {
          const { data, error } = await postJson("/api/break-events", payload);
          if (error) {
            toast.error(error.message);
          } else if (data) {
            setBreakEvents((prev) => [
              ...prev,
              data as typeof breakEvents[number],
            ]);
          }
        } else {
          await queueTask(payload, "BREAK_EVENT");
          setBreakEvents((prev) => [
            ...prev,
            payload as unknown as typeof breakEvents[number],
          ]);
        }

        setClocking(false);
      },
      () => {
        toast.error("Unable to get location");
        setClocking(false);
      },
    );
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    const now = completed ? new Date().toISOString() : null;
    const payload = {
      id: taskId,
      completed_at: now,
    };
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, completed_at: now } : task)),
    );

    if (navigator.onLine) {
      const { error } = await patchJson(`/api/job-tasks/${taskId}`, {
        completed_at: now,
      });
      if (error) {
        toast.error(error.message);
      }
    } else {
      await queueTask(payload, "TASK_UPDATE");
    }
  };

  const submitForReview = async () => {
    if (navigator.onLine) {
      const { error } = await patchJson(`/api/jobs/${job.id}/status`, {
        status: "COMPLETED_PENDING_REVIEW",
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Submitted for review");
      return;
    }
    await queueTask({ job_id: job.id, status: "COMPLETED_PENDING_REVIEW" }, "JOB_STATUS");
    toast.success("Queued submission for review");
  };

  const submitIssue = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const message = String(formData.get("message") ?? "");
    if (!message) {
      toast.error("Enter an issue message");
      return;
    }

    const payload = {
      job_id: job.id,
      category: issueCategory,
      severity: issueSeverity,
      message,
    };

    if (navigator.onLine) {
      const { error } = await postJson("/api/issues", payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Issue submitted");
      event.currentTarget.reset();
      return;
    }

    await queueTask(payload, "ISSUE");
    toast.success("Issue queued for sync");
    event.currentTarget.reset();
  };

  const completedTasks = tasks.filter((task) => task.completed_at);
  const allDone = tasks.length > 0 && completedTasks.length === tasks.length;
  const taskProgress = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;
  const breakSummary = calculateBreakSummary(
    breakEvents.map((event) => ({
      type: event.type as "BREAK_START" | "BREAK_END",
      at: event.at,
    })),
  );
  const clockEventsList = clockEvents ?? [];
  const lastClockEvent = [...clockEventsList].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  )[clockEventsList.length - 1];
  const isClockedIn = lastClockEvent?.type === "CLOCK_IN";

  return (
    <div className="space-y-5">
      <SyncBanner />

      {/* Rework Warning */}
      {job.status === "REWORK_REQUIRED" && job.rework_note && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning/5 p-4"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 text-warning" />
          <div>
            <p className="font-semibold text-warning">Rework Required</p>
            <p className="text-sm text-warning/80">{job.rework_note}</p>
          </div>
        </motion.div>
      )}

      {/* Site Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <MapPinned className="h-7 w-7 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-semibold">{site?.name ?? "Site"}</h2>
                <JobStatusBadge status={job.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {site?.address_line1}
                {site?.city && `, ${site.city} ${site.state}`}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {format(new Date(job.scheduled_start), "h:mm a")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4" />
                  {site?.geofence_radius_meters}m radius
                </span>
              </div>
            </div>
          </div>

          {site && (
            <a
              href={`https://maps.google.com/?q=${site.lat},${site.lng}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
            >
              <Navigation className="h-4 w-4" />
              Get Directions
            </a>
          )}

          {site?.access_notes && (
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-muted/50 p-3">
              <Info className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Access Notes
                </p>
                <p className="mt-0.5 text-sm">{site.access_notes}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clock In/Out Card */}
      <Card className={isClockedIn ? "border-primary/20 bg-primary/5" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Time Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status indicator */}
          <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
            <div className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${isClockedIn ? "animate-pulse bg-primary" : "bg-muted-foreground"}`}
              />
              <div>
                <p className="font-semibold">
                  {isClockedIn ? "On Shift" : "Off Shift"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {breakSummary.onBreak
                    ? "Currently on break"
                    : `${breakSummary.breakMinutes} mins break taken`}
                </p>
              </div>
            </div>
            {breakSummary.onBreak && (
              <Badge variant="warning">On Break</Badge>
            )}
          </div>

          {/* Break warning */}
          {(breakSummary.missingStart || breakSummary.missingEnd) && (
            <div className="flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
              <AlertTriangle className="h-4 w-4" />
              End your break to continue tracking
            </div>
          )}

          {/* Clock buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleClock("CLOCK_IN")}
              disabled={clocking || isClockedIn}
              className="h-12"
              loading={clocking}
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Clock In
            </Button>
            <Button
              variant="outline"
              onClick={() => handleClock("CLOCK_OUT")}
              disabled={clocking || !isClockedIn}
              className="h-12"
              loading={clocking}
            >
              <StopCircle className="mr-2 h-4 w-4" />
              Clock Out
            </Button>
          </div>

          {/* Break buttons */}
          {isClockedIn && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                onClick={() => handleBreak("BREAK_START")}
                disabled={breakSummary.onBreak || clocking}
                className="h-10"
              >
                <Coffee className="mr-2 h-4 w-4" />
                Start Break
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleBreak("BREAK_END")}
                disabled={!breakSummary.onBreak || clocking}
                className="h-10"
              >
                <Coffee className="mr-2 h-4 w-4" />
                End Break
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4" />
              Checklist
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {completedTasks.length}/{tasks.length}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <Progress value={taskProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {Math.round(taskProgress)}% complete
            </p>
          </div>

          {/* Task list */}
          <div className="space-y-2">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                className={`flex items-center gap-3 rounded-xl border p-4 transition-colors ${
                  task.completed_at
                    ? "border-primary/20 bg-primary/5"
                    : "border-border/50 bg-card"
                }`}
              >
                <Checkbox
                  id={task.id}
                  checked={Boolean(task.completed_at)}
                  onCheckedChange={(checked) => toggleTask(task.id, Boolean(checked))}
                  className="h-5 w-5"
                />
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor={task.id}
                    className={`font-medium ${task.completed_at ? "text-muted-foreground line-through" : ""}`}
                  >
                    {task.title}
                  </label>
                </div>
                {task.required_photo && (
                  <Badge variant="warning" className="shrink-0">
                    <Camera className="mr-1 h-3 w-3" />
                    Photo
                  </Badge>
                )}
              </motion.div>
            ))}
          </div>

          {/* Submit button */}
          <Button
            onClick={submitForReview}
            disabled={!allDone}
            className="h-12 w-full"
            variant={allDone ? "default" : "secondary"}
          >
            <Send className="mr-2 h-4 w-4" />
            {allDone ? "Submit for Review" : "Complete all tasks to submit"}
          </Button>
        </CardContent>
      </Card>

      {/* Photo Proof Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Camera className="h-4 w-4" />
            Photo Proof
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 py-8 text-center">
            <Camera className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Photo uploads coming soon
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {attachments.length} photo(s) attached
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Issue Report Card */}
      <Card>
        <CardHeader className="pb-3">
          <button
            type="button"
            onClick={() => setShowIssueForm(!showIssueForm)}
            className="flex w-full items-center justify-between"
          >
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              Report an Issue
            </CardTitle>
            <ChevronRight
              className={`h-5 w-5 text-muted-foreground transition-transform ${
                showIssueForm ? "rotate-90" : ""
              }`}
            />
          </button>
        </CardHeader>
        <AnimatePresence>
          {showIssueForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <CardContent>
                <form className="space-y-4" onSubmit={submitIssue}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={issueCategory} onValueChange={setIssueCategory}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {issueCategories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Severity</Label>
                      <Select value={issueSeverity} onValueChange={setIssueSeverity}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          {issueSeverities.map((sev) => (
                            <SelectItem key={sev.value} value={sev.value}>
                              <span className={sev.color}>{sev.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Issue Details</Label>
                    <Textarea
                      name="message"
                      placeholder="Describe the issue..."
                      required
                      className="min-h-[100px] resize-none"
                    />
                  </div>
                  <Button type="submit" className="h-11 w-full">
                    <Send className="mr-2 h-4 w-4" />
                    Submit Issue
                  </Button>
                </form>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
