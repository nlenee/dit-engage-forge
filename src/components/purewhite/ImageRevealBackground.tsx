import { useEffect, useRef, useState } from "react";

export default function ImageRevealBackground({
  baseImage,
  revealImage,
}: {
  baseImage?: string | null;
  revealImage?: string | null;
}) {
  const mouseRef = useRef({ x: 0, y: 0 });
  const smoothRef = useRef({ x: 0, y: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>();
  const [mask, setMask] = useState<string>("");
  const [cell, setCell] = useState(48);
  const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const resize = () =>
      setCell(Math.round(Math.min(64, Math.max(36, window.innerWidth * 0.028))));
    resize();
    window.addEventListener("resize", resize);

    const tick = () => {
      const s = smoothRef.current;
      s.x += (mouseRef.current.x - s.x) * 0.1;
      s.y += (mouseRef.current.y - s.y) * 0.1;

      const w = window.innerWidth;
      const h = window.innerHeight;
      const radius = Math.round(Math.min(420, Math.max(160, w * 0.16)));

      if (ctx) {
        canvas.width = w;
        canvas.height = h;
        ctx.clearRect(0, 0, w, h);
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, radius);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(0.4, "rgba(255,255,255,1)");
        g.addColorStop(0.6, "rgba(255,255,255,0.75)");
        g.addColorStop(0.75, "rgba(255,255,255,0.4)");
        g.addColorStop(0.88, "rgba(255,255,255,0.12)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        setMask(canvas.toDataURL());
      }

      const cx = s.x / w - 0.5;
      const cy = s.y / h - 0.5;
      const o = offsetRef.current;
      o.x += (cx * 16 - o.x) * 0.06;
      o.y += (cy * 16 - o.y) * 0.06;
      setGridOffset({ x: o.x, y: o.y });

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="hidden lg:block fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {baseImage && (
        <img src={baseImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
      )}
      {revealImage && mask && (
        <img
          src={revealImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            maskImage: `url(${mask})`,
            WebkitMaskImage: `url(${mask})`,
            maskSize: "100% 100%",
            WebkitMaskSize: "100% 100%",
            willChange: "mask-image",
          }}
        />
      )}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.1 }}>
        <defs>
          <pattern
            id="pw-grid"
            width={cell}
            height={cell}
            patternUnits="userSpaceOnUse"
            x={gridOffset.x}
            y={gridOffset.y}
          >
            <path
              d={`M ${cell} 0 L 0 0 0 ${cell}`}
              fill="none"
              stroke="var(--pw-grid)"
              strokeWidth={0.6}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pw-grid)" />
      </svg>
    </div>
  );
}