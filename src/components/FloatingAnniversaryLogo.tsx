import { useEffect, useRef } from "react";

/**
 * DVD-style floating "10 Years" mark that bounces around its container.
 */
export const FloatingAnniversaryLogo = () => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const container = containerRef.current;
    if (!el || !container) return;

    let x = Math.random() * 200;
    let y = Math.random() * 200;
    let vx = (Math.random() > 0.5 ? 1 : -1) * (0.6 + Math.random() * 0.6);
    let vy = (Math.random() > 0.5 ? 1 : -1) * (0.6 + Math.random() * 0.6);
    let raf = 0;

    const tick = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const w = el.offsetWidth;
      const h = el.offsetHeight;

      x += vx;
      y += vy;

      if (x <= 0) { x = 0; vx = Math.abs(vx); }
      if (x + w >= cw) { x = cw - w; vx = -Math.abs(vx); }
      if (y <= 0) { y = 0; vy = Math.abs(vy); }
      if (y + h >= ch) { y = ch - h; vy = -Math.abs(vy); }

      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={containerRef} className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
      <div
        ref={ref}
        className="absolute will-change-transform"
        style={{ transform: "translate3d(0,0,0)" }}
      >
        <div className="relative">
          <div className="absolute inset-0 blur-2xl opacity-60 bg-gradient-to-tr from-fuchsia-500 via-amber-400 to-cyan-400 rounded-full" />
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-fuchsia-500 via-amber-400 to-cyan-400 p-[2px] shadow-2xl">
            <div className="w-full h-full rounded-full bg-[#0a1027] flex flex-col items-center justify-center">
              <span className="text-2xl sm:text-3xl font-black text-white leading-none">10</span>
              <span className="text-[8px] sm:text-[9px] tracking-widest text-white/70 mt-0.5">YEARS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
