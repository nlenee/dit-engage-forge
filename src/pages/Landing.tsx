import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mail, Phone, LogIn, UserPlus, Sparkles } from "lucide-react";
import { CountdownTimer } from "@/components/CountdownTimer";
import { FloatingAnniversaryLogo } from "@/components/FloatingAnniversaryLogo";
import { CONTACT } from "@/config/contact";
import { useAuth } from "@/hooks/useAuth";
import ditLogo from "@/assets/dit-logo.jpg";

const PARTICLES = Array.from({ length: 40 });

const Landing = () => {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen overflow-x-hidden text-white anniversary-bg">
      {/* Curtain frame */}
      <div className="anniversary-curtains absolute inset-0" aria-hidden />

      {/* Particle field */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {PARTICLES.map((_, i) => (
          <span
            key={i}
            className="absolute block rounded-full bg-amber-200/70 animate-twinkle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${1 + Math.random() * 3}px`,
              height: `${1 + Math.random() * 3}px`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Floating bouncing 10 logo */}
      <FloatingAnniversaryLogo />

      {/* Top bar */}
      <header className="relative z-20 flex items-center justify-between px-4 sm:px-8 py-5">
        <div className="flex items-center gap-3">
          <img src={ditLogo} alt="DIT" className="w-10 h-10 rounded-lg shadow-lg" />
          <div className="leading-tight">
            <div className="font-bold tracking-wide">DIT</div>
            <div className="text-[10px] text-white/60 tracking-[0.3em]">DIVINE INTELLIGENCE TEAM</div>
          </div>
        </div>
        <nav className="flex items-center gap-2">
          {user ? (
            <Button asChild variant="secondary" size="sm">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <Link to="/auth?mode=login">Login</Link>
              </Button>
              <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold">
                <Link to="/auth?mode=signup">Join DIT</Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      {/* Hero countdown */}
      <section className="relative z-20 flex flex-col items-center text-center px-4 pt-6 pb-20">
        <div className="tracking-[0.5em] text-xs sm:text-sm text-white/80 font-semibold mb-8">
          31ST MAY, 2026
        </div>

        <CountdownTimer target={CONTACT.anniversaryDate} />

        {/* Big rainbow 10 Years Anniversary mark */}
        <div className="relative mt-16 sm:mt-24 animate-float-slow">
          <div className="relative w-[18rem] h-[18rem] sm:w-[24rem] sm:h-[24rem]">
            <div className="absolute inset-0 rounded-full anniversary-rainbow-ring blur-2xl opacity-60" />
            <div className="absolute inset-3 rounded-full anniversary-rainbow-ring p-[6px]">
              <div className="w-full h-full rounded-full bg-[#0a1027] flex items-center justify-center flex-col">
                <span className="text-7xl sm:text-9xl font-black text-white drop-shadow-[0_4px_24px_rgba(255,255,255,0.25)]">
                  10
                </span>
                <span className="anniversary-script text-2xl sm:text-3xl mt-2">Years</span>
                <span className="anniversary-script text-xl sm:text-2xl">Anniversary</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-16 flex flex-col sm:flex-row gap-4 z-20">
          <Button
            asChild
            size="lg"
            className="bg-white text-[#0a1027] hover:bg-white/90 font-semibold rounded-full px-8 py-6 text-base shadow-2xl hover:scale-105 transition-transform"
          >
            <Link to="/auth?mode=login">
              <LogIn className="w-4 h-4 mr-2" /> Member Login
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:opacity-90 text-white font-semibold rounded-full px-8 py-6 text-base shadow-2xl hover:scale-105 transition-transform animate-glow-pulse"
          >
            <Link to="/auth?mode=signup">
              <Sparkles className="w-4 h-4 mr-2" /> Join DIT
            </Link>
          </Button>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="relative z-20 px-4 sm:px-8 pb-24 max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
          <div className="text-amber-400 text-xs tracking-[0.3em] font-bold mb-3">OUR MISSION</div>
          <p className="text-white/90 leading-relaxed text-lg">{CONTACT.mission}</p>
        </div>
        <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
          <div className="text-cyan-300 text-xs tracking-[0.3em] font-bold mb-3">OUR VISION</div>
          <p className="text-white/90 leading-relaxed text-lg">{CONTACT.vision}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-20 border-t border-white/10 bg-black/30 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 grid md:grid-cols-3 gap-8 text-sm">
          <div>
            <div className="font-bold tracking-wide mb-2">DIVINE INTELLIGENCE TEAM</div>
            <p className="text-white/60">…the game changers</p>
          </div>
          <div className="space-y-2">
            <div className="text-white/80 font-semibold">Contact</div>
            <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2 text-white/70 hover:text-white">
              <Mail className="w-4 h-4" /> {CONTACT.email}
            </a>
            {CONTACT.phones.map((p) => (
              <a key={p} href={`tel:${p.replace(/\s/g, "")}`} className="flex items-center gap-2 text-white/70 hover:text-white">
                <Phone className="w-4 h-4" /> {p}
              </a>
            ))}
          </div>
          <div>
            <div className="text-white/80 font-semibold mb-2">Find us on socials</div>
            <p className="text-white/60">Search: <span className="text-white">DIVINE INTELLIGENCE TEAM</span> on all platforms.</p>
          </div>
        </div>
        <div className="text-center text-xs text-white/40 pb-6">© {new Date().getFullYear()} Divine Intelligence Team</div>
      </footer>
    </div>
  );
};

export default Landing;
