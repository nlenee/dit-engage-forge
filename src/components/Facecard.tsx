import { forwardRef } from "react";
import { Calendar, Target, Star, Quote } from "lucide-react";
import ditLogo from "@/assets/dit-logo.jpg";
import anniversaryLogo from "@/assets/anniversary-logo.png";

export interface FacecardProps {
  fullName: string;
  faction?: string | null;
  role?: string | null;
  yearsInDIT?: number | null;
  quote?: string | null;
  headshotUrl?: string | null;
  xp?: number;
  level?: number;
  joinedDate?: string | null;
  tags?: string[];
}

/**
 * DIT 10th Anniversary Facecard
 * Locked 9:16 portrait composition (760 x 1200 design units, scales via parent).
 * Matches the reference: portrait dominant, neon anniversary logo (asset),
 * vertical TEAM/YEARS, name + role + tags, glass quote, neon level ring, info bar.
 */
export const Facecard = forwardRef<HTMLDivElement, FacecardProps>(
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
      tags,
    },
    ref
  ) => {
    const initials = fullName
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const computedTags =
      tags && tags.length
        ? tags
        : [
            role || "MEMBER",
            faction || "DIT",
            yearsInDIT != null ? `${yearsInDIT}+ YRS IN DIT` : "DIT",
          ];

    return (
      <div
        ref={ref}
        className="relative overflow-hidden text-white select-none"
        style={{
          width: 760,
          height: 1200,
          borderRadius: 40,
          background:
            "radial-gradient(120% 70% at 50% 0%, #1d1a55 0%, #0f0d3a 40%, #07061f 75%, #030314 100%)",
          boxShadow:
            "0 60px 120px -30px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.07)",
          fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif",
        }}
      >
        {/* AMBIENT GLOWS */}
        <div
          className="absolute -top-40 -right-40 w-[640px] h-[640px] rounded-full blur-3xl opacity-60 pointer-events-none animate-pulse"
          style={{
            background:
              "radial-gradient(circle,#ff6a3d 0%, #ff2d95 40%, transparent 70%)",
            animationDuration: "6s",
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-[640px] h-[640px] rounded-full blur-3xl opacity-55 pointer-events-none animate-pulse"
          style={{
            background:
              "radial-gradient(circle,#3b6bff 0%, #6f3dff 40%, transparent 70%)",
            animationDuration: "7s",
          }}
        />
        {/* noise / starfield */}
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.45) 1px, transparent 1px)",
            backgroundSize: "4px 4px",
          }}
        />

        {/* PORTRAIT — dominant */}
        <div className="absolute inset-0">
          {headshotUrl ? (
            <img
              src={headshotUrl}
              alt={fullName}
              crossOrigin="anonymous"
              className="w-full h-full object-cover"
              style={{
                objectPosition: "center 22%",
                filter: "contrast(1.08) saturate(1.12) brightness(0.95)",
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, black 14%, black 56%, transparent 86%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0%, black 14%, black 56%, transparent 86%)",
              }}
            />
          ) : (
            <div className="absolute inset-x-0 top-[15%] h-[55%] flex items-center justify-center">
              <div className="text-[220px] font-black text-white/10 tracking-tighter">
                {initials}
              </div>
            </div>
          )}
          {/* rim lighting */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(7,6,31,0.6) 0%, rgba(7,6,31,0) 18%, rgba(7,6,31,0) 48%, rgba(3,3,20,0.9) 78%, rgba(3,3,20,1) 100%)",
            }}
          />
          <div
            className="absolute inset-0 mix-blend-overlay pointer-events-none"
            style={{
              background:
                "radial-gradient(55% 38% at 78% 28%, rgba(255,100,40,0.45), transparent 70%), radial-gradient(55% 50% at 15% 35%, rgba(70,120,255,0.55), transparent 70%)",
            }}
          />
        </div>

        {/* BACKGROUND TEAM watermark */}
        <div
          className="absolute left-4 top-[12%] z-0 text-[180px] font-black leading-none tracking-tighter pointer-events-none"
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            color: "rgba(255,255,255,0.045)",
          }}
        >
          TEAM
        </div>

        {/* TOP BAR */}
        <div className="relative z-10 flex items-start justify-between px-10 pt-9">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/95 shadow-lg shadow-black/40 p-1.5">
              <img src={ditLogo} alt="DIT" className="w-full h-full object-contain" />
            </div>
            <div className="leading-tight">
              <div className="text-[20px] font-black tracking-[0.22em]">DIT</div>
              <div className="text-[11px] tracking-[0.28em] text-white/75 font-medium mt-0.5">
                DIVINE INTELLIGENCE TEAM
              </div>
            </div>
          </div>

          {/* EXACT anniversary logo asset */}
          <img
            src={anniversaryLogo}
            alt="10th Anniversary"
            crossOrigin="anonymous"
            className="w-[180px] h-auto -mt-2 pointer-events-none"
            style={{
              filter:
                "drop-shadow(0 0 22px rgba(255,90,160,0.55)) drop-shadow(0 0 40px rgba(80,160,255,0.35))",
            }}
          />
        </div>

        {/* LEFT VERTICAL ELEMENT */}
        <div className="absolute left-5 top-[44%] z-10 flex flex-col items-center gap-3">
          <div className="w-px h-24 bg-gradient-to-b from-transparent via-cyan-300/60 to-transparent" />
          <div
            className="text-[12px] tracking-[0.5em] font-semibold text-cyan-100/90"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            {yearsInDIT != null ? `${yearsInDIT}+ YEARS IN DIT` : "MEMBER · DIT"}
          </div>
          <div className="w-px h-24 bg-gradient-to-b from-transparent via-cyan-300/60 to-transparent" />
        </div>

        {/* BOTTOM CONTENT */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-10 pb-7">
          <div className="pl-2">
            <h2
              className="font-black tracking-tight leading-[0.95]"
              style={{
                fontSize: 72,
                textShadow: "0 6px 28px rgba(0,0,0,0.6)",
              }}
            >
              {fullName}
            </h2>
            {role && (
              <div
                className="mt-3 font-bold"
                style={{
                  fontSize: 22,
                  letterSpacing: "0.32em",
                  color: "#ffc24a",
                  textShadow: "0 0 14px rgba(255,194,74,0.45)",
                }}
              >
                {role.toUpperCase()}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2.5">
              {computedTags.filter(Boolean).map((t, i) => (
                <Pill key={i} tone={i === 0 ? "indigo" : i === 1 ? "dark" : "blue"}>
                  {String(t).toUpperCase()}
                </Pill>
              ))}
            </div>

            <div
              className="mt-5 rounded-2xl px-5 py-4 border border-white/12 flex gap-3 items-start max-w-[460px]"
              style={{
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.1), 0 10px 30px rgba(0,0,0,0.4)",
              }}
            >
              <Quote className="w-5 h-5 text-white/55 mt-0.5 shrink-0" />
              <p
                className="italic leading-snug text-white/95"
                style={{ fontSize: 18 }}
              >
                {quote || "…the game changers — for the kingdom, for the generation."}
              </p>
            </div>
          </div>

          {/* LEVEL RING */}
          <div className="absolute right-10 bottom-[230px]">
            <div
              className="rounded-full flex items-center justify-center relative animate-spin"
              style={{
                width: 140,
                height: 140,
                background:
                  "conic-gradient(from 180deg,#ff8a3d,#ff3d8a,#6b3dff,#3d9fff,#ff8a3d)",
                padding: 3,
                animationDuration: "12s",
                boxShadow:
                  "0 0 40px rgba(255,90,160,0.5), 0 0 80px rgba(100,90,255,0.35)",
              }}
            >
              <div
                className="w-full h-full rounded-full bg-[#0a0a24] flex flex-col items-center justify-center"
                style={{ animation: "spin 12s linear infinite reverse" }}
              >
                <div className="text-[11px] tracking-[0.35em] text-white/75 font-semibold">
                  LEVEL
                </div>
                <div
                  className="font-black leading-none mt-1"
                  style={{
                    fontSize: 48,
                    color: "#ffc24a",
                    textShadow: "0 0 18px rgba(255,194,74,0.55)",
                  }}
                >
                  {level}
                </div>
              </div>
            </div>
          </div>

          {/* INFO BAR */}
          <div
            className="mt-6 rounded-2xl px-5 py-4 border border-white/12 flex items-stretch"
            style={{
              background: "rgba(10,10,36,0.55)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
          >
            <InfoCell
              icon={<Calendar className="w-5 h-5 text-white/75" />}
              label="JOINED DIT"
              value={joinedDate || "—"}
            />
            <Divider />
            <InfoCell
              icon={<Target className="w-5 h-5 text-white/75" />}
              label="ROLE"
              value={(role || "Member").toUpperCase()}
            />
            <Divider />
            <InfoCell
              icon={<Star className="w-5 h-5 text-amber-300" />}
              label="XP"
              value={xp.toLocaleString()}
              gold
            />
          </div>

          <div className="flex items-center justify-between mt-4 px-1">
            <span className="text-[11px] text-white/40 tracking-wider">
              © {new Date().getFullYear()} Divine Intelligence Team. All rights reserved.
            </span>
            <span className="text-[12px] italic text-white/60">…the game changers</span>
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
      "linear-gradient(135deg, rgba(99,102,241,0.45), rgba(168,85,247,0.4))",
    dark: "linear-gradient(135deg, rgba(45,45,60,0.85), rgba(25,25,40,0.85))",
    blue: "linear-gradient(135deg, rgba(59,130,246,0.5), rgba(14,165,233,0.4))",
  };
  return (
    <span
      className="px-4 py-1.5 rounded-full font-bold tracking-[0.22em] border border-white/12"
      style={{
        fontSize: 12,
        background: styles[tone],
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
    >
      {children}
    </span>
  );
}

function Divider() {
  return <div className="w-px bg-white/12 mx-4" />;
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
    <div className="flex-1 flex items-center gap-3 min-w-0">
      <div className="w-10 h-10 rounded-full bg-white/8 flex items-center justify-center shrink-0 border border-white/12">
        {icon}
      </div>
      <div className="min-w-0">
        <div
          className="font-semibold text-white/55"
          style={{ fontSize: 10, letterSpacing: "0.28em" }}
        >
          {label}
        </div>
        <div
          className="font-bold truncate"
          style={
            gold
              ? {
                  fontSize: 16,
                  color: "#ffc24a",
                  textShadow: "0 0 10px rgba(255,194,74,0.5)",
                }
              : { fontSize: 14, color: "#fff" }
          }
        >
          {value}
        </div>
      </div>
    </div>
  );
}