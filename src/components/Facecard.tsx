import { forwardRef } from "react";
import { Calendar, Target, Star, Quote } from "lucide-react";
import ditLogo from "@/assets/dit-logo.jpg";

interface Props {
  fullName: string;
  faction?: string | null;
  role?: string | null;
  yearsInDIT?: number | null;
  quote?: string | null;
  headshotUrl?: string | null;
  publicImageUrl?: string | null;
  xp?: number;
  level?: number;
  joinedDate?: string | null;
}

export const Facecard = forwardRef<HTMLDivElement, Props>(
  (
    {
      fullName,
      faction,
      role,
      yearsInDIT,
      quote,
      headshotUrl,
      level = 1,
      xp = 0,
      joinedDate,
    },
    ref
  ) => {
    const initials = fullName
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return (
      <div
        ref={ref}
        className="relative w-[420px] h-[680px] rounded-[36px] overflow-hidden text-white select-none"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, #2a1d6b 0%, #1a1450 35%, #0b0a2c 70%, #050618 100%)",
          boxShadow:
            "0 40px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.06)",
          fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
        }}
      >
        {/* Ambient glows */}
        <div className="absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full blur-3xl opacity-60"
          style={{ background: "radial-gradient(circle, #ff6a3d 0%, #ff2d95 40%, transparent 70%)" }} />
        <div className="absolute -bottom-32 -left-24 w-[420px] h-[420px] rounded-full blur-3xl opacity-50"
          style={{ background: "radial-gradient(circle, #3b6bff 0%, #6f3dff 40%, transparent 70%)" }} />
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "3px 3px",
          }} />

        {/* HEADSHOT — dominant */}
        <div className="absolute inset-0">
          {headshotUrl ? (
            <img
              src={headshotUrl}
              alt={fullName}
              crossOrigin="anonymous"
              className="w-full h-full object-cover"
              style={{
                objectPosition: "center 25%",
                filter: "contrast(1.05) saturate(1.1) brightness(0.95)",
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, black 12%, black 55%, transparent 88%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0%, black 12%, black 55%, transparent 88%)",
              }}
            />
          ) : (
            <div className="absolute inset-x-0 top-[15%] h-[55%] flex items-center justify-center">
              <div className="text-[140px] font-black text-white/10 tracking-tighter">{initials}</div>
            </div>
          )}
          {/* Rim lighting overlays */}
          <div className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,8,40,0.55) 0%, rgba(10,8,40,0) 18%, rgba(10,8,40,0) 50%, rgba(5,6,24,0.85) 78%, rgba(5,6,24,0.98) 100%)",
            }} />
          <div className="absolute inset-0 mix-blend-overlay"
            style={{
              background:
                "radial-gradient(60% 40% at 80% 30%, rgba(255,90,40,0.35), transparent 70%), radial-gradient(60% 50% at 15% 35%, rgba(70,120,255,0.45), transparent 70%)",
            }} />
        </div>

        {/* TOP BAR */}
        <div className="relative z-10 flex items-start justify-between px-6 pt-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl overflow-hidden bg-white/95 shadow-lg shadow-black/40 p-1">
              <img src={ditLogo} alt="DIT" className="w-full h-full object-contain" />
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-black tracking-[0.18em]">DIT</div>
              <div className="text-[9px] tracking-[0.22em] text-white/70 font-medium">
                DIVINE INTELLIGENCE TEAM
              </div>
            </div>
          </div>

          {/* 10TH ANNIVERSARY mark */}
          <div className="flex flex-col items-center">
            <div className="relative flex items-baseline">
              <span
                className="text-[58px] leading-none font-black"
                style={{
                  background:
                    "linear-gradient(135deg, #5fb8ff 0%, #b46bff 45%, #ff5cb4 75%, #ffb24a 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 14px rgba(180,107,255,0.55))",
                  letterSpacing: "-0.04em",
                }}
              >
                10
              </span>
              <span className="text-[14px] font-bold text-white/90 ml-1">TH</span>
            </div>
            <div className="text-[9px] tracking-[0.45em] text-white/80 mt-1 font-medium">
              ANNIVERSARY
            </div>
          </div>
        </div>

        {/* LEFT VERTICAL */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-3">
          <div className="w-px h-16 bg-gradient-to-b from-transparent via-white/40 to-transparent" />
          <div
            className="text-[9px] tracking-[0.45em] font-semibold text-cyan-200/90"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            {yearsInDIT != null ? `${yearsInDIT}+ YEARS IN DIT` : "MEMBER · DIT"}
          </div>
          <div className="w-px h-16 bg-gradient-to-b from-transparent via-white/40 to-transparent" />
        </div>

        {/* BACKGROUND "TEAM" word */}
        <div
          className="absolute left-2 top-[18%] z-0 text-[110px] font-black leading-none tracking-tighter pointer-events-none"
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            color: "rgba(255,255,255,0.04)",
          }}
        >
          TEAM
        </div>

        {/* BOTTOM CONTENT */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-5">
          {/* Name + role */}
          <div className="pl-4">
            <h2
              className="text-[40px] leading-[0.95] font-black tracking-tight"
              style={{ textShadow: "0 4px 24px rgba(0,0,0,0.55)" }}
            >
              {fullName}
            </h2>
            {role && (
              <div
                className="mt-2 text-[12px] tracking-[0.3em] font-bold"
                style={{ color: "#ffc24a", textShadow: "0 0 12px rgba(255,194,74,0.4)" }}
              >
                {role.toUpperCase()}
              </div>
            )}

            {/* Tags */}
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill tone="indigo">ADMIN</Pill>
              {faction && <Pill tone="dark">{faction.toUpperCase()}</Pill>}
              {yearsInDIT != null && <Pill tone="blue">{yearsInDIT}+ YRS IN DIT</Pill>}
            </div>

            {/* Quote */}
            <div
              className="mt-3 rounded-2xl px-4 py-3 border border-white/10 flex gap-3 items-start"
              style={{
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 24px rgba(0,0,0,0.35)",
              }}
            >
              <Quote className="w-4 h-4 text-white/60 mt-0.5 shrink-0" />
              <p className="text-[12px] italic leading-snug text-white/90 line-clamp-3">
                {quote || "…the game changers — for the kingdom, for the generation."}
              </p>
            </div>
          </div>

          {/* LEVEL ring (absolute over right) */}
          <div className="absolute right-6 bottom-[170px]">
            <div
              className="w-[88px] h-[88px] rounded-full flex items-center justify-center relative"
              style={{
                background:
                  "conic-gradient(from 180deg, #ff8a3d, #ff3d8a, #6b3dff, #3d9fff, #ff8a3d)",
                padding: 2,
                boxShadow:
                  "0 0 30px rgba(255,90,160,0.45), 0 0 60px rgba(100,90,255,0.3)",
              }}
            >
              <div className="w-full h-full rounded-full bg-[#0a0a24] flex flex-col items-center justify-center">
                <div className="text-[8px] tracking-[0.3em] text-white/70 font-semibold">
                  LEVEL
                </div>
                <div
                  className="text-[32px] font-black leading-none mt-0.5"
                  style={{ color: "#ffc24a", textShadow: "0 0 14px rgba(255,194,74,0.5)" }}
                >
                  {level}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom info bar */}
          <div
            className="mt-4 rounded-2xl px-4 py-3 border border-white/10 flex items-stretch"
            style={{
              background: "rgba(10,10,36,0.55)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <InfoCell
              icon={<Calendar className="w-4 h-4 text-white/70" />}
              label="JOINED DIT"
              value={joinedDate || "—"}
            />
            <Divider />
            <InfoCell
              icon={<Target className="w-4 h-4 text-white/70" />}
              label="ROLE"
              value={(role || "Member").toUpperCase()}
            />
            <Divider />
            <InfoCell
              icon={<Star className="w-4 h-4 text-amber-300" />}
              label="XP"
              value={xp.toLocaleString()}
              gold
            />
          </div>

          <div className="flex items-center justify-between mt-3 px-1">
            <span className="text-[9px] text-white/40 tracking-wider">
              © {new Date().getFullYear()} Divine Intelligence Team
            </span>
            <span className="text-[10px] italic text-white/60">…the game changers</span>
          </div>
        </div>
      </div>
    );
  }
);
Facecard.displayName = "Facecard";

function Pill({
  children,
  tone = "dark",
}: {
  children: React.ReactNode;
  tone?: "indigo" | "dark" | "blue";
}) {
  const styles: Record<string, string> = {
    indigo:
      "linear-gradient(135deg, rgba(99,102,241,0.4), rgba(168,85,247,0.35))",
    dark: "linear-gradient(135deg, rgba(40,40,55,0.85), rgba(20,20,35,0.85))",
    blue: "linear-gradient(135deg, rgba(59,130,246,0.45), rgba(14,165,233,0.35))",
  };
  return (
    <span
      className="px-3 py-1 rounded-full text-[9px] font-bold tracking-[0.2em] border border-white/10"
      style={{
        background: styles[tone],
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
      }}
    >
      {children}
    </span>
  );
}

function Divider() {
  return <div className="w-px bg-white/10 mx-3" />;
}

function InfoCell({
  icon,
  label,
  value,
  gold,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  gold?: boolean;
}) {
  return (
    <div className="flex-1 flex items-center gap-2 min-w-0">
      <div className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center shrink-0 border border-white/10">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[8px] tracking-[0.25em] text-white/55 font-semibold">
          {label}
        </div>
        <div
          className="text-[11px] font-bold truncate"
          style={
            gold
              ? { color: "#ffc24a", textShadow: "0 0 8px rgba(255,194,74,0.45)" }
              : { color: "#fff" }
          }
        >
          {value}
        </div>
      </div>
    </div>
  );
}
