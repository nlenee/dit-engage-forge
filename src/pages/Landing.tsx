import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Sparkles,
  Users,
  Target,
  Compass,
  Send,
  Mail,
  MapPin,
} from "lucide-react";
import ditLogo from "@/assets/dit-logo.jpg";

const FACTIONS = [
  { code: "SHI", name: "Secured Health Initiative", desc: "DIT's health faction. Addressing health challenges through awareness, education, and developing health-intelligent individuals." },
  { code: "DYP", name: "Discover Your Purpose", desc: "DIT's purpose and personal development faction. Helping individuals discover their God-given purpose and begin the journey of living it." },
  { code: "TECK", name: "Tecknallogy", desc: "DIT's technology faction. Developing technologically excellent individuals and solutions." },
  { code: "MindUp", name: "MindUp", desc: "DIT's education and mindset faction (rebranded 2025 from Virtuous Minds Network). Building educationally excellent, mentally strong individuals." },
];

const TIMELINE = [
  { year: "2016", body: "Four engineering students at FUTA — Divine, Bolanle, Precious, and Marvelous — began. They called themselves Young Engineering Students. Founded on 31 May 2016, with passion before direction and vision before vocabulary for it." },
  { year: "2017", body: "Found the name Divine Intelligence Team. Vision set. Mission articulated. Team grew from four to ten. Four departments established." },
  { year: "2018", body: 'DIT grew to 21 members, then experienced a painful collapse. Seventeen left. Blessing Akinnodi\'s words — "Let us build a bigger and better DIT" — saved the organization. Four stayed and rebuilt.' },
  { year: "2019", body: "DIT restructured, established recruitment criteria, and birthed its first initiative: Discover Your Purpose (DYP)." },
  { year: "2020", body: "New leadership appointed. Departments transformed into Factions. Technology arm established." },
  { year: "2021–2022", body: "Growth continued. New members, new programs, new milestones." },
  { year: "2023", body: "Technological expansion accelerated. Letura Robotics established as a DIT entity." },
  { year: "2024", body: "MindUp faction rebranding begins (from Virtuous Minds Network)." },
  { year: "2025", body: "MindUp officially rebranded. Organizational governance fully restructured." },
  { year: "2026", body: "DIT marks its 10th anniversary. A decade of perseverance, growth, and impact." },
];

const VALUES = [
  { title: "The Purpose of Glorifying God", quote: "Everything we are, everything we have, and everything we will ever become is given by God — and we live to give it back to Him.", body: "We live — individually and collectively — to give Him glory. Not as religious performance but as a genuine, daily orientation of everything we do." },
  { title: "Personal Growth of Each Member", quote: "If the team must reach its potential, every individual on the team must reach theirs — and no one grows alone here.", body: "DIT is not a platform for already-finished people. It is a community for people committed to becoming." },
  { title: "Humility and Respect for Others", quote: "In a community of intelligent, purpose-driven people, humility is not a weakness to be tolerated — it is a strength to be built.", body: "We put people first. We seek others' opinions before asserting our own. We do not look down on anyone." },
  { title: "Partnership", quote: "Our goals are too large for any one of us — and we were never meant to build this alone.", body: "Partnership is not a last resort. It is a first instinct — a proactive recognition that the right collaborations accelerate the mission." },
  { title: "Excellence", quote: "We do not celebrate mediocrity.", body: "We do not accept intellectual laziness. Every output, every program, every interaction carries the standard of a team that believes the name it carries." },
];

const Landing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    if (params.get("notice") === "members-only") {
      toast({
        title: "Members only",
        description: "This area is for DIT members only. Please apply to join or sign in.",
      });
      params.delete("notice");
      setParams(params, { replace: true });
    }
  }, [params, setParams, toast]);

  const scrollTo = (id: string) => () => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="sticky top-0 z-40 bg-[#0e1829]/95 backdrop-blur border-b border-white/10 text-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={ditLogo} alt="DIT" className="w-9 h-9 rounded-md" />
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-wide">DIT</div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-white/60">Divine Intelligence Team</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <button onClick={scrollTo("who")} className="px-3 py-2 rounded hover:bg-white/10">Who We Are</button>
            <button onClick={scrollTo("story")} className="px-3 py-2 rounded hover:bg-white/10">Our Story</button>
            <button onClick={scrollTo("vision")} className="px-3 py-2 rounded hover:bg-white/10">Vision &amp; Mission</button>
            <button onClick={scrollTo("values")} className="px-3 py-2 rounded hover:bg-white/10">Values</button>
            <button onClick={scrollTo("factions")} className="px-3 py-2 rounded hover:bg-white/10">Factions</button>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild size="sm" className="bg-white text-[#0e1829] hover:bg-white/90 font-semibold">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button asChild size="sm" variant="ghost" className="text-white hover:bg-white/10">
                <Link to="/auth?mode=login">Member Login</Link>
              </Button>
            )}
            <Button asChild size="sm" className="bg-[#3a7bbf] hover:bg-[#2d6aac] text-white font-semibold">
              <Link to="/apply">Apply to Join</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative bg-gradient-to-b from-[#0e1829] via-[#1a2744] to-[#243257] text-white overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-24 sm:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs uppercase tracking-[0.25em] mb-8">
            <ShieldCheck className="w-3.5 h-3.5" /> Since 2016
          </div>
          <h1 className="font-display text-5xl sm:text-7xl font-bold leading-[1.05] tracking-tight">
            Divine Intelligence Team
          </h1>
          <p className="mt-5 font-mono text-xs sm:text-sm tracking-[0.3em] uppercase text-[#b8ddf5]">
            The Game Changers — For the Kingdom, For the Generation
          </p>
          <p className="mt-8 max-w-2xl mx-auto text-base sm:text-lg text-white/80 leading-relaxed">
            A hybrid, mission-driven community organization building purpose-driven leaders and agents of change since 2016.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={scrollTo("who")} size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 bg-transparent">
              <BookOpen className="w-4 h-4 mr-2" /> Learn About Us
            </Button>
            <Button asChild size="lg" className="bg-[#3a7bbf] hover:bg-[#2d6aac] text-white font-semibold">
              <Link to="/apply">
                <Sparkles className="w-4 h-4 mr-2" /> Apply to Join <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* WHO WE ARE */}
      <section id="who" className="py-20 sm:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <SectionLabel>01 — Who We Are</SectionLabel>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-[#1a2744] mt-3 mb-8">Who We Are</h2>
          <div className="prose prose-lg max-w-none text-[#3d4f6e] leading-relaxed space-y-5">
            <p>
              DIT — Divine Intelligence Team — is a hybrid, mission-driven community organization founded on the conviction
              that the problems facing individuals, communities, and nations are solvable. We exist to proffer solutions to
              prevalent problems through analysis, critical thinking, and purposeful action that initiates positive, lasting
              change in society.
            </p>
            <p>The name carries three pillars:</p>
            <div className="grid sm:grid-cols-3 gap-4 not-prose pt-2">
              {[
                { word: "Divine", body: "We believe in God as the living foundation of everything we are." },
                { word: "Intelligence", body: "We believe in the extraordinary capacity of the human mind to think, analyse, and solve." },
                { word: "Team", body: "We believe that no individual can build what a team can build." },
              ].map((p) => (
                <div key={p.word} className="rounded-xl border border-[#1a2744]/10 p-5 bg-[#f0f8fd]">
                  <div className="font-display text-xl font-bold text-[#1a2744]">{p.word}</div>
                  <p className="text-sm text-[#3d4f6e] mt-1 leading-relaxed">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* OUR STORY — TIMELINE */}
      <section id="story" className="py-20 sm:py-28 bg-[#f7f9fc]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <SectionLabel>02 — Our History</SectionLabel>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-[#1a2744] mt-3 mb-12">Our Story</h2>
          <ol className="relative border-l-2 border-[#3a7bbf]/30 pl-6 sm:pl-8 space-y-8">
            {TIMELINE.map((t) => (
              <li key={t.year} className="relative">
                <span className="absolute -left-[33px] sm:-left-[41px] top-1 w-4 h-4 rounded-full bg-[#3a7bbf] ring-4 ring-[#f7f9fc]" />
                <div className="font-mono text-xs tracking-widest text-[#3a7bbf] mb-1">{t.year}</div>
                <p className="text-[#3d4f6e] leading-relaxed">{t.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* VISION & MISSION */}
      <section id="vision" className="py-20 sm:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <SectionLabel>03 — Vision &amp; Mission</SectionLabel>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-[#1a2744] mt-3 mb-10">Vision &amp; Mission</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="border-[#1a2744]/10">
              <CardContent className="p-7">
                <div className="text-xs uppercase tracking-[0.25em] text-[#3a7bbf] font-bold mb-3">Vision</div>
                <p className="text-[#3d4f6e] leading-relaxed">
                  A world where every sector of society is inhabited and influenced by purpose-driven, divinely intelligent
                  leaders and change agents — individuals and institutions built to carry godly wisdom, intellectual
                  excellence, and transformative impact into every community, every nation, and every generation.
                </p>
              </CardContent>
            </Card>
            <Card className="border-[#1a2744]/10">
              <CardContent className="p-7">
                <div className="text-xs uppercase tracking-[0.25em] text-[#3a7bbf] font-bold mb-3">Mission</div>
                <p className="text-[#3d4f6e] leading-relaxed">
                  To build systems and communities that discover, develop, and deploy purpose-driven individuals — grooming
                  them into agents of influence and leaders of excellence who bring divine wisdom, intellectual capacity, and
                  lasting solutions to the problems of their generation, their nation, and their world.
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Compass, title: "Discover", body: "We help every member find what they were made for." },
              { icon: Target, title: "Develop", body: "We build intellectual capacity, character, leadership competence, and spiritual grounding." },
              { icon: Send, title: "Deploy", body: "We send them out as agents of influence into their sectors and communities." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl bg-[#0e1829] text-white p-6">
                <Icon className="w-7 h-7 text-[#b8ddf5] mb-3" />
                <div className="font-display text-xl font-bold mb-1">{title}</div>
                <p className="text-sm text-white/70 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CORE VALUES */}
      <section id="values" className="py-20 sm:py-28 bg-[#0e1829] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <SectionLabel light>04 — Core Values</SectionLabel>
          <h2 className="font-display text-3xl sm:text-5xl font-bold mt-3 mb-12">Our Core Values</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {VALUES.map((v, i) => (
              <div
                key={v.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 hover:bg-white/[0.06] transition"
              >
                <div className="font-mono text-xs text-[#b8ddf5] mb-2">0{i + 1}</div>
                <h3 className="font-display text-xl font-bold mb-3">{v.title}</h3>
                <blockquote className="border-l-2 border-[#3a7bbf] pl-4 italic text-white/85 mb-3 text-sm leading-relaxed">
                  "{v.quote}"
                </blockquote>
                <p className="text-sm text-white/65 leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FACTIONS */}
      <section id="factions" className="py-20 sm:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <SectionLabel>05 — Our Factions</SectionLabel>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-[#1a2744] mt-3 mb-10">Our Factions</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {FACTIONS.map((f) => (
              <div key={f.code} className="rounded-2xl border border-[#1a2744]/10 p-6 hover:shadow-lg transition">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="font-mono text-xs px-2 py-1 rounded bg-[#3a7bbf] text-white">{f.code}</span>
                  <h3 className="font-display text-xl font-bold text-[#1a2744]">{f.name}</h3>
                </div>
                <p className="text-sm text-[#3d4f6e] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-[#1a2744] to-[#0e1829] text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <Users className="w-10 h-10 mx-auto mb-4 text-[#b8ddf5]" />
          <h2 className="font-display text-3xl sm:text-5xl font-bold mb-5">Become a Game Changer</h2>
          <p className="text-white/80 leading-relaxed text-lg mb-8">
            DIT is not for everyone. It is for those who believe that divine wisdom, developed intelligence, and genuine
            teamwork can change the world — and who are willing to be changed by the work of building it.
          </p>
          <Button asChild size="lg" className="bg-[#3a7bbf] hover:bg-[#2d6aac] text-white font-semibold">
            <Link to="/apply">
              Apply to Join DIT <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <p className="mt-6 text-sm text-white/60">
            Already a member?{" "}
            <Link to="/auth" className="text-[#b8ddf5] hover:underline">
              Sign in to your dashboard.
            </Link>
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0a1220] text-white/70 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid md:grid-cols-3 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src={ditLogo} alt="" className="w-8 h-8 rounded" />
              <span className="font-bold text-white">Divine Intelligence Team</span>
            </div>
            <p className="text-xs leading-relaxed">
              Founded 2016 · Port Harcourt, Nigeria
              <br />
              <em>"The Game Changers"</em>
            </p>
          </div>
          <div>
            <div className="text-white font-semibold mb-3">Explore</div>
            <ul className="space-y-1.5">
              <li><Link to="/" className="hover:text-white">Home</Link></li>
              <li><button onClick={scrollTo("who")} className="hover:text-white">About</button></li>
              <li><Link to="/apply" className="hover:text-white">Apply</Link></li>
              <li><Link to="/auth" className="hover:text-white">Member Login</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-white font-semibold mb-3">Contact</div>
            <div className="flex items-center gap-2 mb-1.5">
              <Mail className="w-3.5 h-3.5" /> divintelteam@gmail.com
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" /> Port Harcourt, Nigeria
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 py-4 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Divine Intelligence Team. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

const SectionLabel = ({ children, light = false }: { children: React.ReactNode; light?: boolean }) => (
  <div
    className={`font-mono text-[11px] tracking-[0.25em] uppercase font-semibold ${
      light ? "text-[#b8ddf5]" : "text-[#3a7bbf]"
    }`}
  >
    {children}
  </div>
);

export default Landing;