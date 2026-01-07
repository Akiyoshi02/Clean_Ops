"use client";

import * as React from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  FileText,
  Calendar,
  Clock,
  Download,
  Plus,
  CheckCircle2,
  AlertCircle,
  Timer,
  Coffee,
  TrendingUp,
} from "lucide-react";
import { getJson, patchJson, postJson } from "@/lib/api-client";
import { calculateOvertimeMinutes } from "@/lib/attendance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

type Period = {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
};

type Entry = {
  id: string;
  cleaner_id: string;
  clock_in_at: string | null;
  clock_out_at: string | null;
  minutes_worked: number | null;
  break_minutes: number;
  exceptions_json: Record<string, unknown>;
  profile?: { name: string | null; employee_id: string | null } | null;
  job?: { site_id: string | null; scheduled_start: string | null } | null;
};

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function TimesheetManager({
  initialPeriods,
  canApprove,
  overtimeThresholdMinutes,
}: {
  initialPeriods: Period[];
  canApprove: boolean;
  overtimeThresholdMinutes: number;
}) {
  const [periods, setPeriods] = React.useState<Period[]>(initialPeriods);
  const [activePeriod, setActivePeriod] = React.useState<Period | null>(
    initialPeriods[0] ?? null,
  );
  const [entries, setEntries] = React.useState<Entry[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const summary = React.useMemo(() => {
    const grouped: Record<
      string,
      { name: string; employeeId: string; minutes: number; breakMinutes: number }
    > = {};
    for (const entry of entries) {
      if (!grouped[entry.cleaner_id]) {
        grouped[entry.cleaner_id] = {
          name: entry.profile?.name ?? "Cleaner",
          employeeId: entry.profile?.employee_id ?? "No ID",
          minutes: 0,
          breakMinutes: 0,
        };
      }
      grouped[entry.cleaner_id].minutes += entry.minutes_worked ?? 0;
      grouped[entry.cleaner_id].breakMinutes += entry.break_minutes ?? 0;
    }

    return Object.values(grouped).map((item) => {
      const { regularMinutes, overtimeMinutes } = calculateOvertimeMinutes(
        item.minutes,
        overtimeThresholdMinutes,
      );
      return { ...item, regularMinutes, overtimeMinutes };
    });
  }, [entries, overtimeThresholdMinutes]);

  const loadEntries = React.useCallback(async () => {
    if (!activePeriod) return;
    setLoading(true);
    const { data, error } = await getJson<Entry[]>(
      `/api/timesheets/entries?periodId=${activePeriod.id}`,
    );
    if (error) {
      toast.error(error.message);
    } else {
      setEntries(data ?? []);
    }
    setLoading(false);
  }, [activePeriod]);

  React.useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const handleCreatePeriod = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const startDate = String(formData.get("start_date"));
    const endDate = String(formData.get("end_date"));
    const { data, error } = await postJson<Period>("/api/timesheets/periods", {
      start_date: startDate,
      end_date: endDate,
      status: "OPEN",
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) {
      setPeriods((prev) => [data, ...prev]);
      setActivePeriod(data);
    }
    setOpen(false);
    form.reset();
  };

  const handleApprove = async () => {
    if (!activePeriod) return;
    const { data, error } = await patchJson<Period>(
      `/api/timesheets/periods/${activePeriod.id}`,
      { status: "APPROVED" },
    );
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) {
      setPeriods((prev) => prev.map((p) => (p.id === data.id ? data : p)));
      setActivePeriod(data);
    }
  };

  const handleExport = async () => {
    if (!activePeriod) return;
    const response = await fetch(`/api/timesheets/export?periodId=${activePeriod.id}`);
    if (!response.ok) {
      toast.error("Failed to export CSV");
      return;
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `timesheet-${activePeriod.start_date}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Timesheets</h1>
          <p className="text-muted-foreground">
            Manage payroll periods and review time entries
          </p>
        </div>
        {canApprove && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Period
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Timesheet Period</DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleCreatePeriod}>
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    name="end_date"
                    type="date"
                    required
                    className="h-11"
                  />
                </div>
                <Button type="submit" className="h-11 w-full">
                  Create Period
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Periods Sidebar */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Pay Periods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {periods.map((period) => (
              <button
                key={period.id}
                type="button"
                className={`w-full rounded-xl border p-3 text-left transition-all ${
                  activePeriod?.id === period.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/50 hover:border-border hover:bg-muted/50"
                }`}
                onClick={() => setActivePeriod(period)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {format(new Date(period.start_date), "MMM d")} -{" "}
                      {format(new Date(period.end_date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Badge
                    variant={period.status === "APPROVED" ? "success" : "secondary"}
                    className="shrink-0"
                  >
                    {period.status === "APPROVED" ? (
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                    ) : (
                      <Clock className="mr-1 h-3 w-3" />
                    )}
                    {period.status}
                  </Badge>
                </div>
              </button>
            ))}
            {periods.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No periods created
              </p>
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Period Header & Actions */}
          {activePeriod && (
            <Card>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
                <div>
                  <h2 className="text-lg font-semibold">
                    {format(new Date(activePeriod.start_date), "MMMM d")} -{" "}
                    {format(new Date(activePeriod.end_date), "MMMM d, yyyy")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {entries.length} entries • {summary.length} workers
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                  {canApprove && activePeriod?.status !== "APPROVED" && (
                    <Button size="sm" onClick={handleApprove}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Approve Period
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Overtime Summary */}
          {summary.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4" />
                  Overtime Summary
                  <span className="ml-auto text-xs font-normal text-muted-foreground">
                    Threshold: {formatMinutes(overtimeThresholdMinutes)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.map((item) => (
                    <div
                      key={item.employeeId}
                      className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.employeeId}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-right">
                          <p className="font-medium">{formatMinutes(item.regularMinutes)}</p>
                          <p className="text-xs text-muted-foreground">Regular</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${item.overtimeMinutes > 0 ? "text-warning" : ""}`}>
                            {formatMinutes(item.overtimeMinutes)}
                          </p>
                          <p className="text-xs text-muted-foreground">Overtime</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Entries List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Time Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 rounded-xl border border-border/50 p-4">
                      <Skeleton className="h-10 w-10 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <div className="space-y-2 text-right">
                        <Skeleton className="ml-auto h-4 w-16" />
                        <Skeleton className="ml-auto h-3 w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : entries.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No entries"
                  description="No time entries found for this period."
                  className="py-8"
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {entries.map((entry) => {
                    const hasExceptions =
                      entry.exceptions_json && Object.keys(entry.exceptions_json).length > 0;

                    return (
                      <div
                        key={entry.id}
                        className={`rounded-xl border p-4 ${
                          hasExceptions
                            ? "border-warning/20 bg-warning/5"
                            : "border-border/50 bg-card"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-semibold">
                              {entry.profile?.name?.charAt(0).toUpperCase() ?? "?"}
                            </div>
                            <div>
                              <p className="font-semibold">
                                {entry.profile?.name ?? "Cleaner"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {entry.profile?.employee_id ?? "No ID"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Timer className="h-4 w-4" />
                              {formatMinutes(entry.minutes_worked ?? 0)}
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Coffee className="h-4 w-4" />
                              {formatMinutes(entry.break_minutes ?? 0)}
                            </div>
                          </div>
                        </div>
                        {hasExceptions && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-warning">
                            <AlertCircle className="h-4 w-4" />
                            Exceptions: {Object.keys(entry.exceptions_json).join(", ")}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
