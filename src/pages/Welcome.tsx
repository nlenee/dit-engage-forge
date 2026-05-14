import { useEffect } from "react";
import { Link } from "react-router-dom";
import confetti from "canvas-confetti";
import { Sparkles, IdCard, Users, Trophy, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function Welcome() {
  const { user } = useAuth();

  useEffect(() => {
    const fire = () => confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ["#c9a84c", "#4f46e5", "#ec4899", "#22d3ee"] });
    fire();
    const t = setTimeout(fire, 600);
    return () => clearTimeout(t);
  }, []);

  const fullName = (user?.user_metadata?.full_name as string) || user?.email?.split("@")[0] || "Champion";

  const tasks = [
    { to: "/facecard", icon: IdCard, title: "Create your DIT Facecard", desc: "Upload your headshot & generate your premium identity card." },
    { to: "/anniversary", icon: Trophy, title: "Earn XP for the Anniversary", desc: "Complete tasks, climb the leaderboard, win badges." },
    { to: "/members", icon: Users, title: "Meet the community", desc: "Browse the directory and discover fellow members." },
    { to: "/profile", icon: Sparkles, title: "Polish your profile", desc: "Add a public photo and a favourite quote." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-primary text-xs tracking-widest font-bold mb-4">
            <Sparkles className="h-3 w-3" /> WELCOME TO DIT
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-black text-foreground">
            Hello, {fullName} 👋
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            You just joined the <span className="text-foreground font-semibold">Divine Intelligence Team</span> for our 10th Anniversary movement. Here's how to make the most of it.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {tasks.map((t) => (
            <Card key={t.to} className="hover:border-primary/50 hover:shadow-lg transition-all group">
              <Link to={t.to}>
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-indigo-500 text-white flex items-center justify-center shrink-0">
                    <t.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground flex items-center justify-between">
                      {t.title}
                      <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">{t.desc}</div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button asChild size="lg" className="gap-2">
            <Link to="/dashboard">Go to dashboard <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
