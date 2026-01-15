import { useState } from "react";
import { Search, Users, MapPin, Calendar, Briefcase, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Country, State } from "country-state-city";
import Header from "@/components/Header";
import { format, differenceInYears } from "date-fns";

interface Member {
  id: string;
  full_name: string;
  email: string;
  country: string | null;
  state: string | null;
  bio: string | null;
  role_in_dit: string | null;
  previous_roles: string[] | null;
  joined_dit_date: string | null;
  faction: string | null;
  email_verified: boolean | null;
}

export default function MemberDirectory() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["member-directory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("id, full_name, email, country, state, bio, role_in_dit, previous_roles, joined_dit_date, faction, email_verified")
        .eq("email_verified", true)
        .order("full_name", { ascending: true });

      if (error) throw error;
      return data as Member[];
    },
  });

  const filteredMembers = members.filter(
    (m) =>
      m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role_in_dit?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.faction?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLocationName = (countryCode: string | null, stateCode: string | null) => {
    if (!countryCode) return null;
    const country = Country.getCountryByCode(countryCode);
    const state = stateCode ? State.getStateByCodeAndCountry(stateCode, countryCode) : null;
    return `${state?.name ? state.name + ", " : ""}${country?.name || ""}`;
  };

  const getYearsInDit = (joinedDate: string | null) => {
    if (!joinedDate) return null;
    const years = differenceInYears(new Date(), new Date(joinedDate));
    return years === 0 ? "< 1 year" : `${years} year${years > 1 ? "s" : ""}`;
  };

  const getFactionColor = (faction: string | null) => {
    switch (faction) {
      case "DYP":
        return "bg-blue-100 text-blue-800";
      case "TECK":
        return "bg-green-100 text-green-800";
      case "SHI":
        return "bg-purple-100 text-purple-800";
      case "MINDUP":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
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
            Browse all registered DIT members
          </p>
        </div>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, role, or faction..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
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
                      <CardTitle className="text-lg truncate">{member.full_name}</CardTitle>
                      {member.role_in_dit && (
                        <p className="text-sm text-primary font-medium">{member.role_in_dit}</p>
                      )}
                    </div>
                    {member.faction && (
                      <Badge className={getFactionColor(member.faction)}>
                        {member.faction}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {member.bio && (
                    <p className="text-sm text-muted-foreground italic">"{member.bio}"</p>
                  )}

                  {getLocationName(member.country, member.state) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{getLocationName(member.country, member.state)}</span>
                    </div>
                  )}

                  {member.joined_dit_date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Joined {format(new Date(member.joined_dit_date), "MMM yyyy")} 
                        ({getYearsInDit(member.joined_dit_date)} in DIT)
                      </span>
                    </div>
                  )}

                  {member.previous_roles && member.previous_roles.length > 0 && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Briefcase className="h-3 w-3 mt-0.5" />
                      <span>Previous: {member.previous_roles.join(", ")}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
