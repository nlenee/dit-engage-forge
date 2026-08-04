import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Magnet from "@/components/dit/Magnet";
import AnimatedText from "@/components/dit/AnimatedText";
import { GradientCTA, GhostButton } from "@/components/dit/Buttons";
import ditLogo from "@/assets/dit-logo.jpg";
import anniversaryLogo from "@/assets/anniversary-logo.png";
import ditSeal from "@/assets/dit-seal.png";

const EASE = [0.25, 0.1, 0.25, 1] as const;

const NAV = [
  { label: "About", href: "#about" },
  { label: "Factions", href: "#factions" },
  { label: "Programs", href: "#programs" },
  { label: "Join Us", href: "/apply" },
];

const FACTIONS = [
  {
    no: "01",
    name: "SHI",
    desc: "Secured Health Initiative: Community health education, outreach campaigns, and clinical wellness programmes across Nigeria.",
  },
  {
    no: "02",
    name: "DYP",
    desc: "Discover Your Purpose: Faith-based personal development, career mentoring, and purpose coaching for young Nigerians.",
  },
  {
    no: "03",
    name: "TECK",
    desc: "Tecknallogy: Hands-on technology education, AI, robotics, and digital skills for the next generation of innovators.",
  },
  {
    no: "04",
    name: "MindUp",
    desc: "Mental wellness, emotional intelligence, counselling, and creative arts therapy for youth resilience.",
  },
];

const PROGRAMS = [
  { no: "01", category: "Health", title: "Secured Health Outreach" },
  { no: "02", category: "Purpose", title: "Discover Your Purpose Camp" },
  { no: "03", category: "Technology", title: "Tecknallogy Bootcamp" },
];

const FALLBACK_IMAGES = [ditLogo, anniversaryLogo, ditSeal];

function useMemberImages() {
  const { data } = useQuery({
    queryKey: ["landing-member-images"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_member_directory");
      const rows = (data as any[]) ?? [];
      return rows
        .map((r) => r.headshot_url || r.avatar_url)
        .filter(Boolean)
        .slice(0, 12) as string[];
    },
    staleTime: 60_000,
  });
  const imgs = data && data.length ? data : [];
  const pool = [...imgs, ...FALLBACK_IMAGES];
  while (pool.length < 6) pool.push(...FALLBACK_IMAGES);
  return pool;
}

function useMemberCount() {
  const { data } = useQuery({
    queryKey: ["landing-member-count"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_member_directory");
      return ((data as any[]) ?? []).length;
    },
    staleTime: 60_000,
  });
  return data ?? 0;
}

/* ------------------------------- 1. HERO ------------------------------- */
function Hero({ portrait }: { portrait: string }) {
  return (
    <section
      className="relative h-screen flex flex-col justify-between"
      style={{ background: "var(--dit-bg)", overflowX: "clip" }}
    >
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0, ease: EASE }}
        className="relative z-20 flex justify-between px-6 md:px-10 pt-6 md:pt-8"
      >
        {NAV.map((n) =>
          n.href.startsWith("#") ? (
            <a
              key={n.label}
              href={n.href}
              className="font-medium uppercase tracking-wider text-sm md:text-lg lg:text-[1.4rem] transition-opacity duration-200 hover:opacity-70"
              style={{ color: "var(--dit-text)" }}
            >
              {n.label}
            </a>
          ) : (
            <Link
              key={n.label}
              to={n.href}
              className="font-medium uppercase tracking-wider text-sm md:text-lg lg:text-[1.4rem] transition-opacity duration-200 hover:opacity-70"
              style={{ color: "var(--dit-text)" }}
            >
              {n.label}
            </Link>
          )
        )}
      </motion.nav>

      <div className="overflow-hidden">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
          className="hero-heading w-full whitespace-nowrap text-center text-[14vw] sm:text-[15vw] md:text-[16vw] lg:text-[17.5vw] mt-6 sm:mt-4 md:-mt-5"
        >
          We are DIT
        </motion.h1>
      </div>

      <Magnet
        padding={150}
        strength={3}
        className="absolute left-1/2 -translate-x-1/2 z-10 top-1/2 -translate-y-1/2 sm:top-auto sm:translate-y-0 sm:bottom-0 w-[280px] sm:w-[360px] md:w-[440px] lg:w-[520px]"
      >
        <motion.img
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6, ease: EASE }}
          src={portrait}
          alt="Divine Intelligence Team"
          loading="lazy"
          className="w-full object-contain drop-shadow-2xl"
        />
      </Magnet>

      <div className="relative z-20 flex justify-between items-end px-6 md:px-10 pb-7 sm:pb-8 md:pb-10">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: EASE }}
            className="font-light uppercase tracking-wide leading-snug max-w-[160px] sm:max-w-[220px] md:max-w-[260px]"
            style={{ color: "var(--dit-text)", fontSize: "clamp(0.75rem, 1.4vw, 1.5rem)" }}
          >
            The Game Changers — for the kingdom, for the generation
          </motion.p>
          <p
            className="mt-3 font-light uppercase text-[0.6rem] sm:text-xs tracking-widest"
            style={{ color: "var(--dit-gold)" }}
          >
            Est. 2016 · FUTA, Port Harcourt
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
        >
          <GradientCTA to="/apply">Join DIT</GradientCTA>
        </motion.div>
      </div>
    </section>
  );
}

/* ----------------------------- 2. MARQUEE ------------------------------ */
function Marquee({ images }: { images: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      setOffset((window.scrollY - top + window.innerHeight) * 0.3);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const row = [...images, ...images, ...images];

  const Tile = (src: string, i: number) => (
    <img
      key={i}
      src={src}
      alt=""
      loading="lazy"
      className="rounded-2xl object-cover shrink-0"
      style={{ width: 420, height: 270 }}
    />
  );

  return (
    <section
      ref={ref}
      className="overflow-hidden pt-24 sm:pt-32 md:pt-40 pb-10"
      style={{ background: "var(--dit-bg)" }}
    >
      <div
        className="flex gap-3 mb-3"
        style={{ transform: `translateX(${offset - 200}px)`, willChange: "transform" }}
      >
        {row.map(Tile)}
      </div>
      <div
        className="flex gap-3"
        style={{ transform: `translateX(${-(offset - 200)}px)`, willChange: "transform" }}
      >
        {row.map(Tile)}
      </div>
    </section>
  );
}

/* ------------------------------ 3. ABOUT ------------------------------- */
function About({ memberCount }: { memberCount: number }) {
  const corners = [
    { src: ditLogo, cls: "w-[120px] sm:w-[160px] md:w-[210px] top-[4%] left-[1%] sm:left-[2%] md:left-[4%]", x: -80, delay: 0.1 },
    { src: ditSeal, cls: "w-[100px] sm:w-[140px] md:w-[180px] bottom-[8%] left-[3%] sm:left-[6%] md:left-[10%]", x: -80, delay: 0.25 },
    { src: anniversaryLogo, cls: "w-[120px] sm:w-[160px] md:w-[210px] top-[4%] right-[1%] sm:right-[2%] md:right-[4%]", x: 80, delay: 0.15 },
    { src: ditLogo, cls: "w-[130px] sm:w-[170px] md:w-[220px] bottom-[8%] right-[3%] sm:right-[6%] md:right-[10%]", x: 80, delay: 0.3 },
  ];

  const stats = [
    { value: memberCount ? `${memberCount}+` : "500+", label: "Members" },
    { value: `${new Date().getFullYear() - 2016}`, label: "Years Active" },
    { value: "4", label: "Factions" },
    { value: "20+", label: "Programs" },
  ];

  return (
    <section
      id="about"
      className="relative min-h-screen flex flex-col items-center justify-center px-5 sm:px-8 md:px-10 py-20"
      style={{ background: "var(--dit-bg)" }}
    >
      {corners.map((c, i) => (
        <motion.img
          key={i}
          src={c.src}
          alt=""
          loading="lazy"
          initial={{ opacity: 0, x: c.x }}
          whileInView={{ opacity: 0.7, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: c.delay, ease: EASE }}
          className={`absolute pointer-events-none object-contain ${c.cls}`}
        />
      ))}

      <div className="relative z-10 flex flex-col items-center text-center gap-10 sm:gap-14 md:gap-16">
        <h2 className="hero-heading" style={{ fontSize: "clamp(3rem, 12vw, 160px)" }}>
          About DIT
        </h2>
        <AnimatedText
          text="Founded in 2016 at FUTA, Divine Intelligence Team is a faith-driven youth community raising Game Changers across health, technology, purpose, and mental wellness in Nigeria."
          className="font-medium text-center leading-relaxed max-w-[560px]"
          style={{ color: "var(--dit-text)", fontSize: "clamp(1rem, 2vw, 1.35rem)" }}
        />
        <div className="flex flex-wrap justify-center gap-8 sm:gap-14">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div
                className="font-black"
                style={{ color: "var(--dit-gold)", fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
              >
                {s.value}
              </div>
              <div
                className="uppercase tracking-widest text-[0.6rem] sm:text-xs font-light mt-1"
                style={{ color: "var(--dit-text)" }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 sm:mt-8">
          <GradientCTA to="/apply">Become a Member</GradientCTA>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- 4. FACTIONS ----------------------------- */
function Factions() {
  return (
    <section
      id="factions"
      className="relative z-10 rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px] px-5 sm:px-8 md:px-10 py-20 sm:py-24 md:py-32"
      style={{ background: "var(--dit-offwhite)" }}
    >
      <h2
        className="font-black uppercase text-center mb-16 sm:mb-20 md:mb-28"
        style={{ color: "var(--dit-bg)", fontSize: "clamp(3rem, 12vw, 160px)", lineHeight: 1 }}
      >
        Our Factions
      </h2>
      <div className="max-w-5xl mx-auto">
        {FACTIONS.map((f, i) => (
          <motion.div
            key={f.no}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
            className="flex items-start gap-6 sm:gap-10 py-8 sm:py-10 md:py-12"
            style={{
              borderTop: i === 0 ? "1px solid rgba(10, 13, 26, 0.15)" : undefined,
              borderBottom: "1px solid rgba(10, 13, 26, 0.15)",
            }}
          >
            <div
              className="font-black leading-none"
              style={{ color: "var(--dit-bg)", fontSize: "clamp(3rem, 10vw, 140px)" }}
            >
              {f.no}
            </div>
            <div className="flex-1 pt-2">
              <div
                className="font-medium uppercase"
                style={{ color: "var(--dit-bg)", fontSize: "clamp(1rem, 2.2vw, 2.1rem)" }}
              >
                {f.name}
              </div>
              <p
                className="font-light leading-relaxed max-w-2xl mt-2"
                style={{
                  color: "var(--dit-bg)",
                  opacity: 0.6,
                  fontSize: "clamp(0.85rem, 1.6vw, 1.25rem)",
                }}
              >
                {f.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------- 5. PROGRAMS ----------------------------- */
function ProgramCard({
  index,
  total,
  program,
  images,
  progress,
}: {
  index: number;
  total: number;
  program: (typeof PROGRAMS)[number];
  images: string[];
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const targetScale = 1 - (total - 1 - index) * 0.03;
  const scale = useTransform(progress, [index / total, 1], [1, targetScale]);

  return (
    <div className="h-[85vh] flex items-start justify-center sticky top-24 md:top-32">
      <motion.div
        style={{ scale, top: `${index * 28}px`, background: "var(--dit-bg)", borderColor: "var(--dit-gold-soft)" }}
        className="relative w-full max-w-5xl border-2 rounded-[40px] sm:rounded-[50px] md:rounded-[60px] p-4 sm:p-6 md:p-8"
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="uppercase tracking-widest text-[0.65rem] sm:text-xs" style={{ color: "var(--dit-gold)" }}>
              {program.no} · {program.category}
            </div>
            <h3
              className="font-bold uppercase mt-1"
              style={{ color: "var(--dit-offwhite)", fontSize: "clamp(1.1rem, 2.6vw, 2.2rem)" }}
            >
              {program.title}
            </h3>
          </div>
          <GhostButton>Learn More</GhostButton>
        </div>
        <div className="flex gap-3">
          <div className="w-[40%] flex flex-col gap-3">
            <img
              src={images[index % images.length]}
              alt=""
              loading="lazy"
              className="w-full object-cover rounded-[40px] sm:rounded-[50px] md:rounded-[60px]"
              style={{ height: "clamp(130px, 16vw, 230px)" }}
            />
            <img
              src={images[(index + 1) % images.length]}
              alt=""
              loading="lazy"
              className="w-full object-cover rounded-[40px] sm:rounded-[50px] md:rounded-[60px]"
              style={{ height: "clamp(160px, 22vw, 340px)" }}
            />
          </div>
          <div className="w-[60%]">
            <img
              src={images[(index + 2) % images.length]}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover rounded-[40px] sm:rounded-[50px] md:rounded-[60px]"
              style={{ minHeight: "clamp(302px, 38vw, 582px)" }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Programs({ images }: { images: string[] }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  return (
    <section
      id="programs"
      ref={ref}
      className="relative z-10 -mt-10 sm:-mt-12 md:-mt-14 rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px] px-5 sm:px-8 md:px-10 py-20"
      style={{ background: "var(--dit-bg)" }}
    >
      <h2 className="hero-heading text-center mb-10" style={{ fontSize: "clamp(2.5rem, 10vw, 140px)" }}>
        Our Programs
      </h2>
      {PROGRAMS.map((p, i) => (
        <ProgramCard
          key={p.no}
          index={i}
          total={PROGRAMS.length}
          program={p}
          images={images}
          progress={scrollYProgress}
        />
      ))}
    </section>
  );
}

/* ------------------------------ 6. FOOTER ------------------------------ */
function JoinFooter() {
  return (
    <footer
      className="relative z-10 rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px] px-5 sm:px-8 md:px-10 py-20 sm:py-24 text-center"
      style={{ background: "var(--dit-bg)" }}
    >
      <h2 className="hero-heading" style={{ fontSize: "clamp(2.25rem, 9vw, 120px)" }}>
        Become a Game Changer
      </h2>
      <p
        className="mt-6 max-w-xl mx-auto font-light leading-relaxed"
        style={{ color: "var(--dit-text)", fontSize: "clamp(0.9rem, 1.8vw, 1.15rem)" }}
      >
        Join a faith-driven community raising leaders across health, technology, purpose and mental
        wellness.
      </p>
      <div className="mt-8">
        <GradientCTA to="/apply">Apply to Join</GradientCTA>
      </div>
      <div
        className="mt-10 flex justify-center gap-6 uppercase tracking-widest text-[0.65rem] sm:text-xs"
        style={{ color: "var(--dit-gold)" }}
      >
        <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:opacity-70">Instagram</a>
        <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:opacity-70">LinkedIn</a>
        <a href="https://x.com" target="_blank" rel="noreferrer" className="hover:opacity-70">X</a>
      </div>
      <p
        className="mt-8 text-[0.6rem] sm:text-xs font-light uppercase tracking-widest"
        style={{ color: "var(--dit-text)", opacity: 0.6 }}
      >
        © 2016–2026 Divine Intelligence Team · All rights reserved
      </p>
    </footer>
  );
}

export default function LandingDIT() {
  const images = useMemberImages();
  const memberCount = useMemberCount();

  useEffect(() => {
    document.title = "Divine Intelligence Team — The Game Changers";
  }, []);

  return (
    <div className="dit-dark-root" style={{ background: "var(--dit-bg)" }}>
      <Hero portrait={images[0] ?? ditLogo} />
      <Marquee images={images.slice(0, 6)} />
      <About memberCount={memberCount} />
      <Factions />
      <Programs images={images} />
      <JoinFooter />
    </div>
  );
}