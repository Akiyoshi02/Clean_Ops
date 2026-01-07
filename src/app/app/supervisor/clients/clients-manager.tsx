"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Mail,
  Plus,
  Pencil,
  Trash2,
  Search,
  StickyNote,
} from "lucide-react";
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
import { EmptyState } from "@/components/ui/empty-state";
import type { Client } from "@/lib/types";

type ClientRow = Client;

const clientSchema = z.object({
  name: z.string().min(2),
  billing_email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
});

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export function ClientsManager({ initialClients }: { initialClients: ClientRow[] }) {
  const [clients, setClients] = React.useState<ClientRow[]>(initialClients);
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.billing_email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
  });

  const onSubmit = async (values: z.infer<typeof clientSchema>) => {
    const { data, error } = await postJson<ClientRow>("/api/clients", {
      name: values.name,
      billing_email: values.billing_email || null,
      notes: values.notes || null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) {
      setClients((prev) => [data, ...prev]);
    }
    setOpen(false);
    reset();
    toast.success("Client created");
  };

  const handleUpdate = async (clientId: string, values: z.infer<typeof clientSchema>) => {
    const { data, error } = await patchJson<ClientRow>(`/api/clients/${clientId}`, {
      name: values.name,
      billing_email: values.billing_email || null,
      notes: values.notes || null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) {
      setClients((prev) => prev.map((item) => (item.id === clientId ? data : item)));
      toast.success("Client updated");
    }
  };

  const handleDelete = async (client: ClientRow) => {
    const { error } = await deleteJson<{ id: string }>(`/api/clients/${client.id}`);
    if (error) {
      toast.error(error.message);
      return;
    }
    setClients((prev) => prev.filter((item) => item.id !== client.id));
    toast.success("Client removed");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Manage your client accounts
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Client</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input {...register("name")} placeholder="Client name" className="h-11" />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Billing Email</Label>
                <Input
                  {...register("billing_email")}
                  placeholder="billing@example.com"
                  className="h-11"
                />
                {errors.billing_email && (
                  <p className="text-sm text-destructive">
                    {errors.billing_email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  {...register("notes")}
                  placeholder="Additional notes..."
                  className="min-h-[80px] resize-none"
                />
              </div>
              <Button type="submit" className="h-11 w-full" loading={isSubmitting}>
                Create Client
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-11 pl-10"
        />
      </div>

      {/* Clients Grid */}
      {filteredClients.length > 0 ? (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredClients.map((client) => (
            <motion.div key={client.id} variants={staggerItem}>
              <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold">{client.name}</p>
                        <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="truncate">
                            {client.billing_email || "No email"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {client.notes && (
                    <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted/50 p-2.5">
                      <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {client.notes}
                      </p>
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    <ClientDialog
                      title="Edit"
                      client={client}
                      onSave={(values) => handleUpdate(client.id, values)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(client)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No clients yet"
          description="Add your first client to start managing their sites and jobs."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={Search}
          title="No results"
          description={`No clients match "${searchQuery}"`}
        />
      )}
    </div>
  );
}

function ClientDialog({
  title,
  client,
  onSave,
}: {
  title: string;
  client: ClientRow;
  onSave: (values: z.infer<typeof clientSchema>) => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client.name,
      billing_email: client.billing_email ?? "",
      notes: client.notes ?? "",
    },
  });

  const submit = async (values: z.infer<typeof clientSchema>) => {
    await onSave(values);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          {title}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(submit)}>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input {...register("name")} className="h-11" />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Billing Email</Label>
            <Input {...register("billing_email")} className="h-11" />
            {errors.billing_email && (
              <p className="text-sm text-destructive">
                {errors.billing_email.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea {...register("notes")} className="min-h-[80px] resize-none" />
          </div>
          <Button type="submit" className="h-11 w-full" loading={isSubmitting}>
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
