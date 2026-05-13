import { useEffect, useState } from "react";

interface Props {
  target: Date;
}

function diff(target: Date) {
  const now = Date.now();
  let ms = Math.max(0, target.getTime() - now);
  const weeks = Math.floor(ms / (1000 * 60 * 60 * 24 * 7));
  ms -= weeks * 1000 * 60 * 60 * 24 * 7;
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  ms -= days * 1000 * 60 * 60 * 24;
  const hours = Math.floor(ms / (1000 * 60 * 60));
  ms -= hours * 1000 * 60 * 60;
  const minutes = Math.floor(ms / (1000 * 60));
  ms -= minutes * 1000 * 60;
  const seconds = Math.floor(ms / 1000);
  return { weeks, days, hours, minutes, seconds };
}

export const CountdownTimer = ({ target }: Props) => {
  const [t, setT] = useState(() => diff(target));
  useEffect(() => {
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const units: Array<[string, number]> = [
    ["Days", t.days],
    ["Hours", t.hours],
    ["Minutes", t.minutes],
    ["Seconds", t.seconds],
  ];

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      {/* Massive Weeks display */}
      <div className="relative flex flex-col items-center">
        <div className="text-[10rem] sm:text-[14rem] md:text-[18rem] lg:text-[22rem] font-black leading-none anniversary-glow-number select-none">
          {String(t.weeks).padStart(1, "0")}
        </div>
        <div className="mt-2 tracking-[0.4em] text-sm md:text-base font-bold text-white/90">
          WEEKS TO GO
        </div>
      </div>

      {/* Live counter row */}
      <div className="grid grid-cols-4 gap-3 sm:gap-6 w-full max-w-2xl">
        {units.map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-3 sm:p-5 text-center shadow-2xl"
          >
            <div className="text-3xl sm:text-5xl font-black text-white tabular-nums">
              {String(value).padStart(2, "0")}
            </div>
            <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-widest text-white/60">
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
