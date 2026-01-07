"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { patchJson } from "@/lib/api-client";
import { toast } from "sonner";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

type ProfileProps = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
};

export function ProfileForm({ profile }: { profile: ProfileProps }) {
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile.name,
      phone: profile.phone ?? "",
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setSaving(true);
    const { error } = await patchJson("/api/profile", {
      name: values.name,
      phone: values.phone ?? null,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Profile updated successfully");
    }
    setSaving(false);
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          placeholder="Your name"
          className="h-11"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+1 (555) 123-4567"
          className="h-11"
          {...register("phone")}
        />
        <p className="text-xs text-muted-foreground">
          Optional. Used for urgent notifications.
        </p>
      </div>
      <Button
        type="submit"
        disabled={saving || !isDirty}
        loading={saving}
        className="w-full sm:w-auto"
      >
        {saving ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
