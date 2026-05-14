import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles, Trophy, Calendar, IdCard } from "lucide-react";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const FACTION_LABELS: Record<string, string> = {
  SHI: "Secured Health Initiative",
  TECK: "Technology",
  MINDUP: "Mind Up",
  DYP: "Discover Your Purpose",
};

export default function PublicProfile() {
  const { userId } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["public-profile", userId],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_public_profile", { _user_id: userId! });
      return (data as any[])?.[0];
    },
    enabled: !!userId,
  });

  if (isLoading) return <div className="min-h-screen bg-background"><Header /><div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div></div>;
  if (!data) return <div className="min-h-screen bg-background"><Header /><div className="p-12 text-center text-muted-foreground">Profile not found.</div></div>;

  const xpForNext = ((data.member_level || 1) ** 2) * 100;
  const progress = Math.min(100, Math.round(((data.xp || 0) / xpForNext) * 100));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Cover */}
      <div className="relative h-56 md:h-72 bg-gradient-to-r from-primary via-indigo-600 to-fuchsia-600 overflow-hidden">
        {data.public_image_url && (
          <img src={data.public_image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      </div>

      <main className="container mx-auto px-4 -mt-20 pb-12 max-w-4xl">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="relative">
            <div className="w-36 h-36 rounded-full border-4 border-background overflow-hidden bg-muted shadow-xl">
              {data.headshot_url ? (
                <img src={data.headshot_url} alt={data.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-black bg-primary text-primary-foreground">
                  {(data.full_name || "?").slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 pt-4">
            <h1 className="font-display text-3xl font-bold text-foreground">{data.full_name}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              {data.faction && <Badge>{FACTION_LABELS[data.faction] || data.faction}</Badge>}
              <Badge variant="outline" className="gap-1"><Trophy className="h-3 w-3" /> Level {data.member_level || 1}</Badge>
              <Badge variant="secondary" className="gap-1"><Sparkles className="h-3 w-3" /> {(data.xp || 0).toLocaleString()} XP</Badge>
            </div>
            {data.favourite_quote && (
              <p className="mt-4 italic text-muted-foreground border-l-2 border-primary pl-3">"{data.favourite_quote}"</p>
            )}
          </div>
          <Button asChild variant="outline" className="gap-2">
            <Link to={`/facecard/${data.user_id}`}><IdCard className="h-4 w-4" /> View Facecard</Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <Card>
            <CardContent className="p-5">
              <div className="text-xs text-muted-foreground tracking-widest mb-1">PROGRESS TO NEXT LEVEL</div>
              <Progress value={progress} className="h-2 mt-2" />
              <div className="text-xs text-muted-foreground mt-2">{data.xp || 0} / {xpForNext} XP</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-xs text-muted-foreground tracking-widest mb-1">YEARS IN DIT</div>
              <div className="text-3xl font-black">{data.date_joined_year ? new Date().getFullYear() - data.date_joined_year : "—"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-xs text-muted-foreground tracking-widest mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> MEMBER SINCE</div>
              <div className="text-base font-semibold mt-1">{format(new Date(data.created_at), "MMM yyyy")}</div>
            </CardContent>
          </Card>
        </div>

        {data.bio && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="text-xs text-muted-foreground tracking-widest mb-2">BIO</div>
              <p className="text-foreground leading-relaxed">{data.bio}</p>
            </CardContent>
          </Card>
        )}

        {data.public_image_url && (
          <Card className="mt-6 overflow-hidden">
            <img src={data.public_image_url} alt="" className="w-full max-h-[500px] object-cover" />
          </Card>
        )}
      </main>
    </div>
  );
}
