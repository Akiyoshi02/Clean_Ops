"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
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
  Sparkles,
  Filter,
  Building2,
} from "lucide-react";
import { getJson, patchJson, postJson } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard, StatsGrid } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { RoleBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
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
  visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 }
  },
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
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Team Members"
        description={`${activeCount} active of ${profiles.length} users`}
        icon={Users}
        iconColor="primary"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button leftIcon={<UserPlus className="h-4 w-4" />}>
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Provision New User
                </DialogTitle>
              </DialogHeader>
              <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                <input type="hidden" {...register("role")} />
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input {...register("name")} placeholder="Full name" className="h-12" />
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
                    className="h-12"
                    leftIcon={<Mail className="h-4 w-4" />}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select onValueChange={(value) => setValue("role", value as "HR" | "SUPERVISOR" | "CLEANER")}>
                    <SelectTrigger className="h-12">
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
                    <Input 
                      {...register("phone")} 
                      placeholder="Phone number" 
                      className="h-12"
                      leftIcon={<Phone className="h-4 w-4" />}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Employee ID</Label>
                    <Input {...register("employeeId")} placeholder="ID" className="h-12" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Pay Rate (hourly)</Label>
                  <Input
                    type="number"
                    step="0.25"
                    {...register("payRate")}
                    placeholder="0.00"
                    className="h-12"
                    leftIcon={<DollarSign className="h-4 w-4" />}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="h-12 w-full font-semibold" 
                  loading={isSubmitting}
                  leftIcon={<UserPlus className="h-4 w-4" />}
                >
                  Create User
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Stats */}
      <StatsGrid columns={3}>
        <StatCard
          title="HR Staff"
          value={roleStats.HR}
          icon={Shield}
          description="Administrators"
          variant="primary"
        />
        <StatCard
          title="Supervisors"
          value={roleStats.SUPERVISOR}
          icon={Building2}
          description="Team leads"
          variant="default"
        />
        <StatCard
          title="Cleaners"
          value={roleStats.CLEANER}
          icon={Users}
          description="Field staff"
          variant="success"
        />
      </StatsGrid>

      {/* Search & Filter */}
      <Card variant="default" padding="default">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12"
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-12 w-full sm:w-48">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="HR">HR Only</SelectItem>
              <SelectItem value="SUPERVISOR">Supervisors Only</SelectItem>
              <SelectItem value="CLEANER">Cleaners Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {filteredProfiles.length !== profiles.length && (
          <p className="mt-3 text-sm text-muted-foreground">
            Showing {filteredProfiles.length} of {profiles.length} users
          </p>
        )}
      </Card>

      {/* Users List */}
      <AnimatePresence mode="wait">
        {filteredProfiles.length > 0 ? (
          <motion.div
            key="list"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {filteredProfiles.map((profile) => (
              <motion.div key={profile.id} variants={staggerItem} layout>
                <Card
                  variant={profile.is_active ? "default" : "ghost"}
                  className={cn(
                    "group transition-all duration-200 hover:shadow-md",
                    !profile.is_active && "opacity-60"
                  )}
                >
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold transition-transform group-hover:scale-105",
                          profile.is_active
                            ? profile.role === "HR" 
                              ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white"
                              : profile.role === "SUPERVISOR"
                                ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white"
                                : "bg-gradient-to-br from-emerald-500 to-teal-500 text-white"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {profile.name?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{profile.name}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" />
                            {profile.email}
                          </span>
                          {profile.phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5" />
                              {profile.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <RoleBadge role={profile.role} />
                      <div className="flex items-center gap-3 rounded-full bg-muted/50 px-3 py-1.5">
                        {profile.is_active ? (
                          <Badge variant="solid-success" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </Badge>
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
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <EmptyState
              icon="users"
              title="No team members"
              description="Add your first team member to get started."
              action={
                <Button 
                  onClick={() => setOpen(true)}
                  leftIcon={<UserPlus className="h-4 w-4" />}
                >
                  Add User
                </Button>
              }
            />
          </motion.div>
        ) : (
          <motion.div
            key="no-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <EmptyState
              icon="search"
              title="No results found"
              description={`No users match "${searchQuery}" ${roleFilter !== "all" ? `in ${roleFilter} role` : ""}`}
              action={
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setRoleFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
