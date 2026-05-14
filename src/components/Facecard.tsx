import { forwardRef } from "react";
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
}

export const Facecard = forwardRef<HTMLDivElement, Props>(
  ({ fullName, faction, role, yearsInDIT, quote, headshotUrl, level = 1, xp = 0 }, ref) => {
    return (
      <div
        ref={ref}
        className="relative w-[420px] h-[600px] rounded-3xl overflow-hidden shadow-2xl text-white"
        style={{
          background:
            "linear-gradient(135deg, #0a1027 0%, #1e1e5a 40%, #4f46e5 70%, #c9a84c 100%)",
        }}
      >
        {/* Decorative rings */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-400/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-fuchsia-500/30 blur-3xl" />
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <img src={ditLogo} alt="" className="w-full h-full object-contain" />
        </div>

        {/* Top: brand */}
        <div className="relative z-10 p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={ditLogo} alt="DIT" className="h-9 w-9 rounded-lg" />
            <div className="leading-tight">
              <div className="text-xs tracking-[0.3em] font-bold">DIT</div>
              <div className="text-[9px] tracking-[0.2em] text-white/70">10TH ANNIVERSARY</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] tracking-widest text-white/60">LEVEL</div>
            <div className="text-2xl font-black text-amber-300">{level}</div>
          </div>
        </div>

        {/* Headshot */}
        <div className="relative z-10 px-6 mt-2">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-300 to-pink-500 p-[3px] shadow-2xl">
            <div className="w-full h-full rounded-full bg-[#0a1027] overflow-hidden">
              {headshotUrl ? (
                <img src={headshotUrl} alt={fullName} crossOrigin="anonymous" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-black">
                  {fullName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Identity */}
        <div className="relative z-10 px-6 mt-5">
          <div className="text-3xl font-black leading-tight">{fullName}</div>
          <div className="mt-1 flex flex-wrap gap-2">
            {role && (
              <span className="text-[10px] tracking-widest uppercase bg-white/15 backdrop-blur px-2 py-1 rounded-full">
                {role}
              </span>
            )}
            {faction && (
              <span className="text-[10px] tracking-widest uppercase bg-amber-400/30 text-amber-100 px-2 py-1 rounded-full">
                {faction}
              </span>
            )}
            {yearsInDIT != null && (
              <span className="text-[10px] tracking-widest uppercase bg-cyan-400/20 text-cyan-100 px-2 py-1 rounded-full">
                {yearsInDIT}+ yrs in DIT
              </span>
            )}
          </div>
        </div>

        {/* Quote */}
        <div className="relative z-10 mx-6 mt-5 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
          <div className="text-[10px] tracking-widest text-white/60 mb-1">FAVOURITE QUOTE</div>
          <div className="text-sm italic leading-relaxed line-clamp-4">
            {quote || "…the game changers — for the kingdom, for the generation."}
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 inset-x-0 z-10 p-5 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-between">
          <div className="text-[10px] tracking-widest text-white/70">DIVINE INTELLIGENCE TEAM</div>
          <div className="text-right">
            <div className="text-[9px] tracking-widest text-white/50">XP</div>
            <div className="text-sm font-bold text-amber-300">{xp.toLocaleString()}</div>
          </div>
        </div>
      </div>
    );
  }
);
Facecard.displayName = "Facecard";
