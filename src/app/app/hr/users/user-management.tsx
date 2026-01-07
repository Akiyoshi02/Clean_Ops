"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Phone,
  DollarSign,
  Shield,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { getJson, patchJson, postJson } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleBadge } from "@/components/ui/status-badge";
import type { Profile } from "@/lib/types";

type ProfileRow = Profile;

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["HR", "SUPERVISOR", "CLEANER"]),
  phone: z.string().optional(),
  employeeId: z.string().optional(),
  payRate: z.string().optional(),
});

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export function UserManagement({ initialProfiles }: { initialProfiles: ProfileRow[] }) {
  const [profiles, setProfiles] = React.useState<ProfileRow[]>(initialProfiles);
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");

  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch =
      profile.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || profile.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const activeCount = profiles.filter((p) => p.is_active).length;
  const roleStats = {
    HR: profiles.filter((p) => p.role === "HR").length,
    SUPERVISOR: profiles.filter((p) => p.role === "SUPERVISOR").length,
    CLEANER: profiles.filter((p) => p.role === "CLEANER").length,
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
  } = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
  });

  const onSubmit = async (values: z.infer<typeof userSchema>) => {
    const { data, error } = await postJson<{ tempPassword?: string }>(
      "/api/admin/provision-user",
      {
        name: values.name,
        email: values.email,
        role: values.role,
        phone: values.phone,
        employeeId: values.employeeId,
        payRate: values.payRate ? Number(values.payRate) : null,
        isActive: true,
      },
    );

    if (error) {
      toast.error(error.message);
      return;
    }

    const tempPassword = data?.tempPassword ?? "";
    toast.success("User created", {
      description: tempPassword ? `Temp password: ${tempPassword}` : "",
    });
    setOpen(false);
    reset();

    const { data: refreshed } = await getJson<Profile[]>("/api/admin/users");
    if (refreshed) {
      setProfiles(refreshed);
    }
  };

  const toggleActive = async (profile: ProfileRow) => {
    const { data, error } = await patchJson<Profile>(
      `/api/admin/users/${profile.id}`,
      { is_active: !profile.is_active },
    );
    if (error) {
      toast.error(error.message);
      return;
    }
    setProfiles((prev) =>
      prev.map((item) => (item.id === profile.id ? data : item)),
    );
    toast.success(data.is_active ? "User activated" : "User deactivated");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground">
            {activeCount} active of {profiles.length} users
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Provision New User</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <input type="hidden" {...register("role")} />
              <div className="space-y-2">
                <Label>Name</Label>
                <Input {...register("name")} placeholder="Full name" className="h-11" />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  {...register("email")}
                  placeholder="email@example.com"
                  className="h-11"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select onValueChange={(value) => setValue("role", value as "HR" | "SUPERVISOR" | "CLEANER")}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                    <SelectItem value="CLEANER">Cleaner</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-destructive">{errors.role.message}</p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input {...register("phone")} placeholder="Phone number" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label>Employee ID</Label>
                  <Input {...register("employeeId")} placeholder="ID" className="h-11" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Pay Rate (hourly)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.25"
                    {...register("payRate")}
                    placeholder="0.00"
                    className="h-11 pl-10"
                  />
                </div>
              </div>
              <Button type="submit" className="h-11 w-full" loading={isSubmitting}>
                Create User
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold">{roleStats.HR}</p>
              <p className="text-xs text-muted-foreground">HR Staff</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
              <Users className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-lg font-bold">{roleStats.SUPERVISOR}</p>
              <p className="text-xs text-muted-foreground">Supervisors</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-bold">{roleStats.CLEANER}</p>
              <p className="text-xs text-muted-foreground">Cleaners</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="h-11 w-full sm:w-40">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="HR">HR</SelectItem>
            <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
            <SelectItem value="CLEANER">Cleaner</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users List */}
      {filteredProfiles.length > 0 ? (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {filteredProfiles.map((profile) => (
            <motion.div key={profile.id} variants={staggerItem}>
              <Card
                className={`transition-all ${
                  profile.is_active
                    ? "border-border/50"
                    : "border-muted bg-muted/30 opacity-70"
                }`}
              >
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold ${
                        profile.is_active
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {profile.name?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="font-semibold">{profile.name}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {profile.email}
                        </span>
                        {profile.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {profile.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <RoleBadge role={profile.role} />
                    <div className="flex items-center gap-2">
                      {profile.is_active ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Switch
                        checked={profile.is_active}
                        onCheckedChange={() => toggleActive(profile)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : profiles.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team members"
          description="Add your first team member to get started."
          action={
            <Button onClick={() => setOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={Search}
          title="No results"
          description={`No users match your search criteria`}
        />
      )}
    </div>
  );
}
