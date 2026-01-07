"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { deleteJson, patchJson, postJson } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Site } from "@/lib/types";

type SiteRow = Site;

const siteSchema = z.object({
  client_id: z.string().min(1),
  name: z.string().min(2),
  address_line1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  lat: z.string(),
  lng: z.string(),
  geofence_radius_meters: z.string(),
  access_notes: z.string().optional(),
  default_checklist_template_id: z.string().optional(),
});

export function SitesManager({
  initialSites,
  clients,
  templates,
}: {
  initialSites: SiteRow[];
  clients: Array<{ id: string; name: string }>;
  templates: Array<{ id: string; name: string }>;
}) {
  const [sites, setSites] = React.useState<SiteRow[]>(initialSites);

  const handleDelete = async (site: SiteRow) => {
    const { error } = await deleteJson<{ id: string }>(`/api/sites/${site.id}`);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSites((prev) => prev.filter((item) => item.id !== site.id));
  };

  const handleSave = async (
    values: z.infer<typeof siteSchema>,
    siteId?: string,
  ) => {
    const payload = {
      client_id: values.client_id,
      name: values.name,
      address_line1: values.address_line1 || null,
      city: values.city || null,
      state: values.state || null,
      postal_code: values.postal_code || null,
      lat: Number(values.lat),
      lng: Number(values.lng),
      geofence_radius_meters: Number(values.geofence_radius_meters),
      access_notes: values.access_notes || null,
      default_checklist_template_id: values.default_checklist_template_id || null,
    };

    if (siteId) {
      const { data, error } = await patchJson<SiteRow>(
        `/api/sites/${siteId}`,
        payload,
      );
      if (error) {
        toast.error(error.message);
        return;
      }
      if (data) {
        setSites((prev) => prev.map((item) => (item.id === siteId ? data : item)));
      }
      return;
    }

    const { data, error } = await postJson<SiteRow>("/api/sites", payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) {
      setSites((prev) => [data, ...prev]);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sites</CardTitle>
          <SiteDialog
            title="Add site"
            onSave={handleSave}
            clients={clients}
            templates={templates}
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {sites.map((site) => (
            <div
              key={site.id}
              className="rounded-xl border border-border bg-background/80 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{site.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {clients.find((client) => client.id === site.client_id)?.name ??
                      "Client"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {site.city}, {site.state}
                  </p>
                </div>
                <div className="flex gap-2">
                  <SiteDialog
                    title="Edit site"
                    onSave={handleSave}
                    clients={clients}
                    templates={templates}
                    site={site}
                  />
                  <Button variant="outline" size="sm" onClick={() => handleDelete(site)}>
                    Remove
                  </Button>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                Geofence radius: {site.geofence_radius_meters}m -{" "}
                <a
                  className="underline"
                  href={`https://maps.google.com/?q=${site.lat},${site.lng}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View map
                </a>
              </div>
            </div>
          ))}
          {sites.length === 0 && (
            <p className="text-sm text-muted-foreground">No sites yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SiteDialog({
  title,
  onSave,
  clients,
  templates,
  site,
}: {
  title: string;
  onSave: (values: z.infer<typeof siteSchema>, siteId?: string) => Promise<void>;
  clients: Array<{ id: string; name: string }>;
  templates: Array<{ id: string; name: string }>;
  site?: SiteRow;
}) {
  const [open, setOpen] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
  } = useForm<z.infer<typeof siteSchema>>({
    resolver: zodResolver(siteSchema),
    defaultValues: site
      ? {
          client_id: site.client_id,
          name: site.name,
          address_line1: site.address_line1 ?? "",
          city: site.city ?? "",
          state: site.state ?? "",
          postal_code: site.postal_code ?? "",
          lat: String(site.lat),
          lng: String(site.lng),
          geofence_radius_meters: String(site.geofence_radius_meters),
          access_notes: site.access_notes ?? "",
          default_checklist_template_id: site.default_checklist_template_id ?? "",
        }
      : {
          client_id: "",
          name: "",
          lat: "",
          lng: "",
          geofence_radius_meters: "150",
        },
  });

  const submit = async (values: z.infer<typeof siteSchema>) => {
    await onSave(values, site?.id);
    setOpen(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={site ? "outline" : "default"} size="sm">
          {title}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit(submit)}>
          <input type="hidden" {...register("client_id")} />
          <input type="hidden" {...register("default_checklist_template_id")} />
          <div className="space-y-1">
            <Label>Client</Label>
            <Select
              defaultValue={site?.client_id}
              onValueChange={(value) => setValue("client_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.client_id && (
              <p className="text-sm text-destructive">{errors.client_id.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label>Name</Label>
            <Input {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Latitude</Label>
              <Input {...register("lat")} />
            </div>
            <div className="space-y-1">
              <Label>Longitude</Label>
              <Input {...register("lng")} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Geofence radius (meters)</Label>
            <Input {...register("geofence_radius_meters")} />
          </div>
          <div className="space-y-1">
            <Label>Checklist template</Label>
            <Select
              defaultValue={site?.default_checklist_template_id ?? ""}
              onValueChange={(value) =>
                setValue("default_checklist_template_id", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Access notes</Label>
            <Textarea {...register("access_notes")} />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save site"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
