"use client";

import * as React from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { postJson } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

type JobRow = {
  id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  assigned_cleaner_id: string | null;
  sites?: { name: string } | null;
};

type SiteOption = {
  id: string;
  name: string;
  default_checklist_template_id: string | null;
};

type CleanerOption = {
  id: string;
  name: string;
};

const weekdays = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

export function ScheduleManager({
  initialJobs,
  sites,
  cleaners,
}: {
  initialJobs: JobRow[];
  sites: SiteOption[];
  cleaners: CleanerOption[];
}) {
  const [jobs, setJobs] = React.useState<JobRow[]>(initialJobs);
  const [selectedDays, setSelectedDays] = React.useState<number[]>([1, 3, 5]);
  const [oneOffSiteId, setOneOffSiteId] = React.useState("");
  const [oneOffCleanerId, setOneOffCleanerId] = React.useState("");
  const [recurringSiteId, setRecurringSiteId] = React.useState("");
  const [recurringCleanerId, setRecurringCleanerId] = React.useState("");

  React.useEffect(() => {
    if (sites.length > 0 && !oneOffSiteId) {
      setOneOffSiteId(sites[0].id);
    }
    if (sites.length > 0 && !recurringSiteId) {
      setRecurringSiteId(sites[0].id);
    }
  }, [sites, oneOffSiteId, recurringSiteId]);

  const createOneOff = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const siteId = String(formData.get("site_id"));
    const date = String(formData.get("date"));
    const startTime = String(formData.get("start_time"));
    const duration = Number(formData.get("duration"));
    const cleanerId = String(formData.get("cleaner_id") ?? "");
    const jobType = String(formData.get("job_type") ?? "");
    const instructions = String(formData.get("instructions") ?? "");

    const site = sites.find((s) => s.id === siteId);
    const checklistTemplateId = site?.default_checklist_template_id;
    if (!checklistTemplateId) {
      toast.error("Site has no default checklist template.");
      return;
    }

    const { data: job, error } = await postJson<JobRow>("/api/schedule/one-off", {
      siteId,
      checklistTemplateId,
      date,
      startTime,
      durationMins: duration,
      assignedCleanerId: cleanerId || null,
      jobType: jobType || null,
      instructions: instructions || null,
    });

    if (error || !job) {
      toast.error(error?.message ?? "Failed to create job");
      return;
    }

    const siteName = site?.name ?? "Site";
    setJobs((prev) => [
      { ...job, sites: { name: siteName } },
      ...prev,
    ]);
    event.currentTarget.reset();
    toast.success("Job created");
  };

  const createRecurring = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const siteId = String(formData.get("site_id"));
    const date = String(formData.get("start_date"));
    const startTime = String(formData.get("start_time"));
    const duration = Number(formData.get("duration"));
    const cleanerId = String(formData.get("cleaner_id") ?? "");
    const jobType = String(formData.get("job_type") ?? "");
    const instructions = String(formData.get("instructions") ?? "");
    const weeks = Number(formData.get("weeks") ?? 4);

    const site = sites.find((s) => s.id === siteId);
    const checklistTemplateId = site?.default_checklist_template_id;
    if (!checklistTemplateId) {
      toast.error("Site has no default checklist template.");
      return;
    }

    const { data, error } = await postJson<{ count?: number }>(
      "/api/schedule/recurring",
      {
        siteId,
        checklistTemplateId,
        startDate: date,
        startTime,
        durationMins: duration,
        daysOfWeek: selectedDays,
        weeks,
        assignedCleanerId: cleanerId || null,
        jobType: jobType || null,
        instructions: instructions || null,
      },
    );

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Created ${data?.count ?? 0} jobs`);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="oneoff">
        <TabsList>
          <TabsTrigger value="oneoff">One-off job</TabsTrigger>
          <TabsTrigger value="recurring">Recurring</TabsTrigger>
        </TabsList>
        <TabsContent value="oneoff">
          <Card>
            <CardHeader>
              <CardTitle>Create one-off job</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3 md:grid-cols-2" onSubmit={createOneOff}>
                <input type="hidden" name="site_id" value={oneOffSiteId} />
                <input type="hidden" name="cleaner_id" value={oneOffCleanerId} />
                <div className="space-y-1">
                  <Label>Site</Label>
                  <Select value={oneOffSiteId} onValueChange={setOneOffSiteId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>
                    <SelectContent>
                      {sites.map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Cleaner</Label>
                  <Select value={oneOffCleanerId} onValueChange={setOneOffCleanerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Assign cleaner" />
                    </SelectTrigger>
                    <SelectContent>
                      {cleaners.map((cleaner) => (
                        <SelectItem key={cleaner.id} value={cleaner.id}>
                          {cleaner.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Date</Label>
                  <Input name="date" type="date" required />
                </div>
                <div className="space-y-1">
                  <Label>Start time</Label>
                  <Input name="start_time" type="time" required />
                </div>
                <div className="space-y-1">
                  <Label>Duration (mins)</Label>
                  <Input name="duration" type="number" defaultValue={120} />
                </div>
                <div className="space-y-1">
                  <Label>Job type</Label>
                  <Input name="job_type" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label>Instructions</Label>
                  <Input name="instructions" />
                </div>
                <Button type="submit">Create job</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="recurring">
          <Card>
            <CardHeader>
              <CardTitle>Generate recurring jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3 md:grid-cols-2" onSubmit={createRecurring}>
                <input type="hidden" name="site_id" value={recurringSiteId} />
                <input type="hidden" name="cleaner_id" value={recurringCleanerId} />
                <div className="space-y-1">
                  <Label>Site</Label>
                  <Select value={recurringSiteId} onValueChange={setRecurringSiteId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>
                    <SelectContent>
                      {sites.map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Cleaner</Label>
                  <Select value={recurringCleanerId} onValueChange={setRecurringCleanerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Assign cleaner" />
                    </SelectTrigger>
                    <SelectContent>
                      {cleaners.map((cleaner) => (
                        <SelectItem key={cleaner.id} value={cleaner.id}>
                          {cleaner.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Start date</Label>
                  <Input name="start_date" type="date" required />
                </div>
                <div className="space-y-1">
                  <Label>Start time</Label>
                  <Input name="start_time" type="time" required />
                </div>
                <div className="space-y-1">
                  <Label>Duration (mins)</Label>
                  <Input name="duration" type="number" defaultValue={120} />
                </div>
                <div className="space-y-1">
                  <Label>Weeks</Label>
                  <Input name="weeks" type="number" defaultValue={4} min={1} max={12} />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label>Days of week</Label>
                  <div className="flex flex-wrap gap-2">
                    {weekdays.map((day) => (
                      <label
                        key={day.value}
                        className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm"
                      >
                        <Checkbox
                          checked={selectedDays.includes(day.value)}
                          onCheckedChange={(checked) => {
                            setSelectedDays((prev) =>
                              checked
                                ? [...prev, day.value]
                                : prev.filter((value) => value !== day.value),
                            );
                          }}
                        />
                        {day.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Job type</Label>
                  <Input name="job_type" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label>Instructions</Label>
                  <Input name="instructions" />
                </div>
                <Button type="submit">Generate jobs</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming jobs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between rounded-xl border border-border bg-background/80 p-4"
            >
              <div>
                <p className="font-semibold">{job.sites?.name ?? "Site"}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(job.scheduled_start), "MMM dd, h:mm a")}
                </p>
              </div>
              <Badge variant={job.status === "APPROVED" ? "success" : "secondary"}>
                {job.status}
              </Badge>
            </div>
          ))}
          {jobs.length === 0 && (
            <p className="text-sm text-muted-foreground">No upcoming jobs.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
