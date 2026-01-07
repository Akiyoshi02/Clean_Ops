import { User, Mail, Shield, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth";
import { ProfileForm } from "./profile-form";
import { Badge } from "@/components/ui/badge";

export default async function ProfilePage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return null;
  }

  const roleVariant = {
    HR: "info" as const,
    SUPERVISOR: "warning" as const,
    CLEANER: "success" as const,
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <User className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{profile.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={roleVariant[profile.role]}>{profile.role}</Badge>
            {profile.employee_id && (
              <span className="text-sm text-muted-foreground">
                ID: {profile.employee_id}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Account info card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            Account Information
          </CardTitle>
          <CardDescription>
            Your account details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{profile.phone}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit profile card */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
