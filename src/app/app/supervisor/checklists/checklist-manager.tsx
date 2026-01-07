"use client";

import * as React from "react";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { patchJson, postJson } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ChecklistTemplate, ChecklistTemplateItem, Site } from "@/lib/types";

type TemplateRow = ChecklistTemplate;
type ItemRow = ChecklistTemplateItem;
type SiteRow = Site;

const templateSchema = z.object({ name: z.string().min(2) });
const itemSchema = z.object({
  title: z.string().min(2),
  required_photo: z.boolean(),
  sort_order: z.string().optional(),
});

export function ChecklistManager({
  initialTemplates,
  initialItems,
  sites,
}: {
  initialTemplates: TemplateRow[];
  initialItems: ItemRow[];
  sites: SiteRow[];
}) {
  const [templates, setTemplates] = React.useState(initialTemplates);
  const [items, setItems] = React.useState(initialItems);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState(
    initialTemplates[0]?.id ?? "",
  );
  const [selectedSiteId, setSelectedSiteId] = React.useState(sites[0]?.id ?? "");

  const templateForm = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
  });

  const itemForm = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: { required_photo: false },
  });

  const overrideForm = useForm({
    defaultValues: {
      removed_item_ids: "",
      added_items: "",
      notes: "",
    },
  });

  const selectedItems = items.filter((item) => item.template_id === selectedTemplateId);
  const requiredPhotoValue = useWatch({
    control: itemForm.control,
    name: "required_photo",
  });

  const createTemplate = async (values: z.infer<typeof templateSchema>) => {
    const { data, error } = await postJson<TemplateRow>(
      "/api/checklists/templates",
      { name: values.name },
    );
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) {
      setTemplates((prev) => [data, ...prev]);
      setSelectedTemplateId(data.id);
    }
    templateForm.reset();
  };

  const createItem = async (values: z.infer<typeof itemSchema>) => {
    if (!selectedTemplateId) {
      toast.error("Select a template first");
      return;
    }
    const { data, error } = await postJson<ItemRow>("/api/checklists/items", {
      template_id: selectedTemplateId,
      title: values.title,
      required_photo: values.required_photo,
      sort_order: Number(values.sort_order ?? selectedItems.length + 1),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) {
      setItems((prev) => [...prev, data]);
    }
    itemForm.reset({ required_photo: false });
  };

  const toggleRequiredPhoto = async (item: ItemRow) => {
    const { data, error } = await patchJson<ItemRow>(
      `/api/checklists/items/${item.id}`,
      { required_photo: !item.required_photo },
    );
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) {
      setItems((prev) => prev.map((row) => (row.id === item.id ? data : row)));
    }
  };

  const assignTemplateToSite = async (value: string) => {
    const { error } = await patchJson(`/api/sites/${selectedSiteId}`, {
      default_checklist_template_id: value,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Template assigned");
  };

  const saveOverrides = async (values: Record<string, string>) => {
    if (!selectedSiteId || !selectedTemplateId) return;
    const removedIds = values.removed_item_ids
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const addedItems = values.added_items
      .split(",")
      .map((title) => title.trim())
      .filter(Boolean)
      .map((title) => ({ title, required_photo: false }));

    const overrides = {
      removed_item_ids: removedIds,
      added_items: addedItems,
      notes: values.notes,
    };

    const { error } = await postJson("/api/checklists/overrides", {
      site_id: selectedSiteId,
      template_id: selectedTemplateId,
      overrides_json: overrides,
    });

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Overrides saved");
  };

  return (
    <Tabs defaultValue="templates" className="space-y-6">
      <TabsList>
        <TabsTrigger value="templates">Templates</TabsTrigger>
        <TabsTrigger value="overrides">Site overrides</TabsTrigger>
      </TabsList>

      <TabsContent value="templates">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                    selectedTemplateId === template.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-muted"
                  }`}
                  onClick={() => setSelectedTemplateId(template.id)}
                >
                  {template.name}
                </button>
              ))}
              <form
                className="space-y-2 border-t border-border pt-4"
                onSubmit={templateForm.handleSubmit(createTemplate)}
              >
                <Label>New template</Label>
                <Input {...templateForm.register("name")} />
                {templateForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {templateForm.formState.errors.name.message}
                  </p>
                )}
                <Button size="sm" type="submit">
                  Add template
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Template items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-background/80 p-3"
                >
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Order {item.sort_order}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Checkbox
                      checked={item.required_photo}
                      onCheckedChange={() => toggleRequiredPhoto(item)}
                    />
                    Photo required
                  </div>
                </div>
              ))}
              <form
                className="space-y-2 border-t border-border pt-4"
                onSubmit={itemForm.handleSubmit(createItem)}
              >
                <Label>New item</Label>
                <Input {...itemForm.register("title")} />
                {itemForm.formState.errors.title && (
                  <p className="text-sm text-destructive">
                    {itemForm.formState.errors.title.message}
                  </p>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={Boolean(requiredPhotoValue)}
                    onCheckedChange={(value) =>
                      itemForm.setValue("required_photo", Boolean(value))
                    }
                  />
                  Require photo
                </div>
                <Input
                  placeholder="Sort order"
                  {...itemForm.register("sort_order")}
                />
                <Button size="sm" type="submit">
                  Add item
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="overrides">
        <Card>
          <CardHeader>
            <CardTitle>Site overrides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Site</Label>
                <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
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
                <Label>Default template</Label>
                <Select
                  value={selectedTemplateId}
                  onValueChange={(value) => {
                    setSelectedTemplateId(value);
                    void assignTemplateToSite(value);
                  }}
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
            </div>
            <form
              className="space-y-3 rounded-xl border border-border bg-background/80 p-4"
              onSubmit={overrideForm.handleSubmit(saveOverrides)}
            >
              <p className="text-sm text-muted-foreground">
                Optional: Customize tasks for this site. Separate values with commas.
              </p>
              <div className="space-y-1">
                <Label>Removed item IDs</Label>
                <Input {...overrideForm.register("removed_item_ids")} />
              </div>
              <div className="space-y-1">
                <Label>Additional items</Label>
                <Input {...overrideForm.register("added_items")} />
              </div>
              <div className="space-y-1">
                <Label>Override notes</Label>
                <Textarea {...overrideForm.register("notes")} />
              </div>
              <Button size="sm" type="submit">
                Save overrides
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
