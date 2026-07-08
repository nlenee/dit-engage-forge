import { useState } from "react";
import { Search, Users, MapPin, Calendar, Shield, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface DirectoryMember {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  faction: string | null;
  date_of_birth: string | null;
  status: string;
  bio: string | null;
  created_at: string;
  role?: string;
}

const FACTION_LABELS: Record<string, string> = {
  SHI: "Secured Health Initiative",
  TECK: "Technology",
  MINDUP: "Mind Up",
  DYP: "Discover Your Purpose",
};

const FACTION_COLORS: Record<string, string> = {
  SHI: "bg-purple-100 text-purple-800",
  TECK: "bg-green-100 text-green-800",
  MINDUP: "bg-orange-100 text-orange-800",
  DYP: "bg-blue-100 text-blue-800",
};

export default function MemberDirectory() {
  const { isAdminOrES } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [factionFilter, setFactionFilter] = useState("all");

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["member-directory"],
    queryFn: async () => {
      // Use safe directory RPC (excludes phone, email, DOB for non-admins)
      const { data: profiles, error } = await supabase.rpc("get_member_directory");
      if (error) throw error;

      // Admin/ES can additionally fetch contact details (RLS allows)
      let contactMap: Record<string, { email: string | null; phone: string | null; date_of_birth: string | null }> = {};
      if (isAdminOrES) {
        const { data: full } = await supabase
          .from("profiles")
          .select("user_id, email, phone, date_of_birth");
        (full || []).forEach((f: any) => {
          contactMap[f.user_id] = { email: f.email, phone: f.phone, date_of_birth: f.date_of_birth };
        });
      }

      // Executive role labels for everyone (public columns)
      const { data: execRows } = await supabase
        .from("profiles")
        .select("user_id, executive_role, executive_role_abbr");
      const execMap: Record<string, { executive_role: string | null; executive_role_abbr: string | null }> = {};
      (execRows || []).forEach((r: any) => {
        execMap[r.user_id] = { executive_role: r.executive_role, executive_role_abbr: r.executive_role_abbr };
      });

      return (profiles || []).map((p: any) => {
        const contact = contactMap[p.user_id] || { email: null, phone: null, date_of_birth: null };
        const exec = execMap[p.user_id] || { executive_role: null, executive_role_abbr: null };
        return {
          ...p,
          ...contact,
          ...exec,
          role: p.primary_role || "user",
        } as DirectoryMember;
      });
    },
  });

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.faction?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFaction = factionFilter === "all" || m.faction === factionFilter;
    return matchesSearch && matchesFaction;
  });

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "admin": return "Admin";
      case "chief_executive_director": return "Chief Executive Director";
      case "executive_secretary": return "Executive Secretary";
      case "community_manager": return "Community Manager";
      case "chief_finance_officer": return "Chief Financial Officer";
      case "executive_director": return "Executive Director";
      case "executive_assistant": return "Executive Assistant";
      default: return "Member";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Member Directory
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse all community members ({filteredMembers.length} members)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, role, or faction..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={factionFilter} onValueChange={setFactionFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by faction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Factions</SelectItem>
              {Object.entries(FACTION_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No members found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((member) => (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(member.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{member.full_name || "—"}</CardTitle>
                      <p className="text-sm text-primary font-medium flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {(member as any).executive_role || getRoleLabel(member.role)}
                        {(member as any).executive_role_abbr && (
                          <Badge variant="outline" className="ml-1 text-[10px]">
                            {(member as any).executive_role_abbr}
                          </Badge>
                        )}
                      </p>
                    </div>
                    {member.faction && (
                      <Badge className={FACTION_COLORS[member.faction] || "bg-muted text-muted-foreground"}>
                        {member.faction}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {member.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2 italic">
                      "{member.bio}"
                    </p>
                  )}

                  {member.faction && (
                    <p className="text-sm text-muted-foreground">
                      {FACTION_LABELS[member.faction] || member.faction}
                    </p>
                  )}

                  {isAdminOrES && member.email && (
                    <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Joined {format(new Date(member.created_at), "MMM yyyy")}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
