"use client";

import * as React from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Coffee,
  Shield,
  ChevronRight,
  Send,
  RotateCcw,
  MapPinned,
  Activity,
  Info,
  Navigation,
} from "lucide-react";
import { postJson } from "@/lib/api-client";
import { calculateBreakSummary } from "@/lib/attendance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import {
  JobStatusBadge,
  IssueStatusBadge,
  IssueSeverityBadge,
  GeofenceBadge,
} from "@/components/ui/status-badge";
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
  clock_events: JobClockEvent[];
  break_events: BreakEvent[];
  attachments: JobAttachment[];
  issues: Issue[];
};

type ActivityItem = {
  event_type: string | null;
  event_action: string | null;
  occurred_at: string | null;
  note: string | null;
};

export function JobReview({
  job,
  activity,
}: {
  job: JobDetail;
  activity: ActivityItem[];
}) {
  const [reworkNote, setReworkNote] = React.useState(job.rework_note ?? "");
  const [saving, setSaving] = React.useState(false);

  const photosEnabled = false;
  const requiredTasks = job.tasks?.filter((task) => task.required_photo) ?? [];
  const hasRequiredPhoto =
    !photosEnabled ||
    requiredTasks.length === 0 ||
    (job.attachments?.length ?? 0) > 0;
  const photoBadgeLabel = photosEnabled
    ? hasRequiredPhoto
      ? "Photos complete"
      : "Photos missing"
    : "Photos disabled";
  const photoBadgeVariant = photosEnabled
    ? hasRequiredPhoto
      ? "success"
      : "warning"
    : ("secondary" as const);
  const breakSummary = calculateBreakSummary(job.break_events ?? []);
  const totalTasks = (job.tasks ?? []).length;
  const completedTasks = (job.tasks ?? []).filter((t) => t.completed_at).length;
  const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleApprove = async () => {
    setSaving(true);
    const { error } = await postJson(`/api/jobs/${job.id}/review`, {
      action: "APPROVE",
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Job approved");
    }
    setSaving(false);
  };

  const handleRework = async () => {
    if (!reworkNote.trim()) {
      toast.error("Add a rework note for the cleaner");
      return;
    }
    setSaving(true);
    const { error } = await postJson(`/api/jobs/${job.id}/review`, {
      action: "REWORK",
      rework_note: reworkNote,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Rework sent to cleaner");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Site Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <MapPinned className="h-7 w-7 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-semibold">{job.site?.name ?? "Site"}</h2>
                <JobStatusBadge status={job.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {job.site?.address_line1}
                {job.site?.city && `, ${job.site.city} ${job.site.state}`}
              </p>
              {job.site?.access_notes && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/50 p-2 text-sm">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{job.site.access_notes}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant={photoBadgeVariant}>
              <Camera className="mr-1.5 h-3 w-3" />
              {photoBadgeLabel}
            </Badge>
            <Badge variant="secondary">
              <Coffee className="mr-1.5 h-3 w-3" />
              {breakSummary.breakMinutes} min breaks
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Checklist Progress */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4" />
              Checklist Tasks
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {completedTasks}/{totalTasks}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Progress value={taskProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {Math.round(taskProgress)}% complete
            </p>
          </div>
          <div className="space-y-2">
            {(job.tasks ?? []).map((task) => (
              <div
                key={task.id}
                className={`flex items-center justify-between rounded-xl border p-3 ${
                  task.completed_at
                    ? "border-primary/20 bg-primary/5"
                    : "border-warning/20 bg-warning/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  {task.completed_at ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-warning" />
                  )}
                  <span className={task.completed_at ? "" : "text-muted-foreground"}>
                    {task.title}
                  </span>
                </div>
                <Badge variant={task.completed_at ? "success" : "warning"}>
                  {task.completed_at ? "Done" : "Pending"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Clock Events */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Clock Events
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(job.clock_events ?? []).map((event) => (
            <div
              key={event.id}
              className={`flex items-center justify-between rounded-xl border p-3 ${
                event.is_within_geofence === false
                  ? "border-warning/20 bg-warning/5"
                  : "border-border/50 bg-card"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    event.type === "CLOCK_IN" ? "bg-primary/10" : "bg-muted"
                  }`}
                >
                  <Clock
                    className={`h-4 w-4 ${event.type === "CLOCK_IN" ? "text-primary" : "text-muted-foreground"}`}
                  />
                </div>
                <div>
                  <p className="font-medium">
                    {event.type === "CLOCK_IN" ? "Clock In" : "Clock Out"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.at).toLocaleTimeString()}
                    {event.source && ` • ${event.source}`}
                  </p>
                </div>
              </div>
              <GeofenceBadge
                isWithin={event.is_within_geofence !== false}
                distance={event.distance_meters}
              />
            </div>
          ))}
          {(job.clock_events ?? []).length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No clock events recorded
            </p>
          )}
        </CardContent>
      </Card>

      {/* Breaks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Coffee className="h-4 w-4" />
            Breaks
            {(breakSummary.missingStart || breakSummary.missingEnd) && (
              <Badge variant="warning" className="ml-auto">Issues</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
            <span className="text-sm text-muted-foreground">Total break time</span>
            <span className="font-semibold">{breakSummary.breakMinutes} minutes</span>
          </div>
          {(breakSummary.missingStart || breakSummary.missingEnd) && (
            <div className="flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
              <AlertTriangle className="h-4 w-4" />
              Break tracking incomplete
            </div>
          )}
          {(job.break_events ?? []).length > 0 ? (
            <div className="space-y-2">
              {(job.break_events ?? []).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-xl border border-border/50 p-3"
                >
                  <span className="font-medium">
                    {event.type === "BREAK_START" ? "Break Start" : "Break End"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(event.at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No breaks recorded
            </p>
          )}
        </CardContent>
      </Card>

      {/* Issues */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" />
            Issues
            {(job.issues ?? []).filter((i) => i.status !== "RESOLVED").length > 0 && (
              <Badge variant="warning" className="ml-auto">
                {(job.issues ?? []).filter((i) => i.status !== "RESOLVED").length} open
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(job.issues ?? []).length > 0 ? (
            (job.issues ?? []).map((issue) => (
              <div
                key={issue.id}
                className="rounded-xl border border-border/50 bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <IssueSeverityBadge severity={issue.severity} />
                      <span className="text-xs text-muted-foreground">
                        {issue.category?.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{issue.message}</p>
                  </div>
                  <IssueStatusBadge status={issue.status} />
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon={AlertTriangle}
              title="No issues"
              description="No issues reported for this job."
              className="py-6"
            />
          )}
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length > 0 ? (
            <div className="relative space-y-4">
              <div className="absolute left-4 top-2 h-[calc(100%-16px)] w-px bg-border" />
              {activity.map((event, index) => (
                <div
                  key={`${event.event_type}-${event.event_action}-${index}`}
                  className="relative flex gap-4 pl-4"
                >
                  <div className="absolute -left-1 top-2 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                  <div className="flex-1 rounded-xl border border-border/50 bg-card p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">
                        {event.event_type?.replace(/_/g, " ")} - {event.event_action}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {event.occurred_at
                          ? format(new Date(event.occurred_at), "h:mm a")
                          : ""}
                      </span>
                    </div>
                    {event.note && (
                      <p className="mt-1 text-sm text-muted-foreground">{event.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No activity recorded
            </p>
          )}
        </CardContent>
      </Card>

      {/* Supervisor Actions */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Supervisor Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Rework Note</label>
            <Textarea
              value={reworkNote}
              onChange={(event) => setReworkNote(event.target.value)}
              placeholder="Add a note for the cleaner if rework is required..."
              className="min-h-[100px] resize-none"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              onClick={handleApprove}
              disabled={saving || !hasRequiredPhoto}
              className="h-12"
              loading={saving}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve Job
            </Button>
            <Button
              variant="outline"
              onClick={handleRework}
              disabled={saving}
              className="h-12"
              loading={saving}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Require Rework
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
