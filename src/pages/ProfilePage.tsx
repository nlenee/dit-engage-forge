import { useState, useEffect } from "react";
import { User, Mail, Phone, Calendar, Shield, Loader2, Save, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { ImageUploader } from "@/components/ImageUploader";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  faction: string | null;
  status: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

const FACTION_LABELS: Record<string, string> = {
  SHI: "Secured Health Initiative",
  TECK: "Technology",
  MINDUP: "Mind Up",
  DYP: "Discover Your Purpose",
};

export default function ProfilePage() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user!.id)
      .single();

    if (!error && data) {
      setProfile(data as Profile);
      setPhone(data.phone || "");
      setBio(data.bio || "");
      setFullName(data.full_name || "");
      setAvatarUrl(data.avatar_url || null);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ phone, bio, full_name: fullName, avatar_url: avatarUrl })
      .eq("user_id", user!.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated", description: "Your profile has been saved." });
    }
    setSaving(false);
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case "admin": return "Admin";
      case "executive_secretary": return "Executive Secretary";
      case "community_manager": return "Community Manager";
      case "chief_finance_officer": return "Chief Finance Officer";
      default: return "Member";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
          <User className="h-8 w-8 text-primary" />
          My Profile
        </h1>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4 mb-2">
              <ImageUploader
                bucket="headshots"
                userId={user!.id}
                currentUrl={avatarUrl}
                onUploaded={(url) => setAvatarUrl(url)}
                shape="circle"
                label="Upload photo"
              />
              <div className="flex-1 space-y-2">
                <Label className="text-muted-foreground">Full Name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
              </div>
            </div>
            <CardTitle>{fullName || "—"}</CardTitle>
            <CardDescription className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" />
                {getRoleLabel()}
              </Badge>
              {profile?.faction && (
                <Badge variant="outline">{FACTION_LABELS[profile.faction] || profile.faction}</Badge>
              )}
              <Badge variant={profile?.status === "active" ? "default" : "destructive"}>
                {profile?.status || "active"}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" /> Email
                </Label>
                <Input value={profile?.email || ""} disabled className="bg-muted" />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" /> Phone Number
                </Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter phone number" />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" /> Date of Birth
                </Label>
                <Input value={profile?.date_of_birth || ""} disabled className="bg-muted" />
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Role</Label>
                <Input value={getRoleLabel()} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Roles can only be changed by an admin</p>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Faction</Label>
                <Input value={profile?.faction ? FACTION_LABELS[profile.faction] || profile.faction : "Not assigned"} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Factions can only be changed by an admin</p>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Member Since</Label>
                <Input value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : ""} disabled className="bg-muted" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" /> Bio
              </Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a short bio about yourself..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">{bio.length}/500 characters</p>
            </div>

            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
