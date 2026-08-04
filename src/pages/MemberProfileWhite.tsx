import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import ImageRevealBackground from "@/components/purewhite/ImageRevealBackground";

const FACTION_LABELS: Record<string, string> = {
  SHI: "Secured Health Initiative",
  TECK: "Tecknallogy",
  MINDUP: "Mind Up",
  DYP: "Discover Your Purpose",
};

const EASE = [0.25, 0.1, 0.25, 1] as const;

export default function MemberProfileWhite() {
  const { userId, slug } = useParams();
  const id = userId ?? slug;

  const { data, isLoading } = useQuery({
    queryKey: ["public-profile", id],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_public_profile", { _user_id: id! });
      return (data as any[])?.[0];
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (data?.full_name) document.title = `${data.full_name} — DIT Member Profile`;
  }, [data?.full_name]);

  const label = "uppercase tracking-[0.2em] text-[0.6rem] sm:text-xs";

  return (
    <div
      className="pure-white-root relative min-h-screen"
      style={{ background: "var(--pw-bg)", color: "var(--pw-text)" }}
    >
      <ImageRevealBackground
        baseImage={data?.public_image_url ?? null}
        revealImage={data?.headshot_url ?? data?.public_image_url ?? null}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-5 sm:px-8 py-14 sm:py-20">
        <Link to="/members" className={`${label} hover:opacity-60`} style={{ color: "var(--pw-gray-400)" }}>
          ← Member Directory
        </Link>

        {isLoading && <p className="mt-16 text-sm">Loading profile…</p>}
        {!isLoading && !data && <p className="mt-16 text-sm">Profile not found.</p>}

        {data && (
          <>
            <motion.header
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
              className="mt-10 flex flex-col sm:flex-row sm:items-end gap-8"
            >
              <div
                className="w-32 h-32 sm:w-40 sm:h-40 overflow-hidden shrink-0"
                style={{ border: "1px solid var(--pw-gray-200)" }}
              >
                {data.headshot_url ? (
                  <img src={data.headshot_url} alt={data.full_name} className="w-full h-full object-cover grayscale" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl pw-display">
                    {(data.full_name || "?").slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className={label} style={{ color: "var(--pw-gray-400)" }}>
                  {data.faction ? FACTION_LABELS[data.faction] || data.faction : "Divine Intelligence Team"}
                </p>
                <h1
                  className="pw-display uppercase leading-[0.95] mt-3"
                  style={{ fontSize: "clamp(2.25rem, 7vw, 5rem)" }}
                >
                  {data.full_name}
                </h1>
              </div>
            </motion.header>

            {data.favourite_quote && (
              <motion.blockquote
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
                className="mt-12 pl-5 text-lg sm:text-2xl font-light leading-relaxed"
                style={{ borderLeft: "1px solid var(--pw-text)" }}
              >
                “{data.favourite_quote}”
              </motion.blockquote>
            )}

            <div
              className="mt-14 grid grid-cols-2 md:grid-cols-4"
              style={{ borderTop: "1px solid var(--pw-gray-200)" }}
            >
              {[
                { k: "Level", v: String(data.member_level || 1) },
                { k: "XP", v: (data.xp || 0).toLocaleString() },
                { k: "Joined", v: data.date_joined_year ? String(data.date_joined_year) : "—" },
                { k: "Faction", v: data.faction || "—" },
              ].map((s) => (
                <div
                  key={s.k}
                  className="py-7 px-4"
                  style={{ borderBottom: "1px solid var(--pw-gray-200)" }}
                >
                  <div className={label} style={{ color: "var(--pw-gray-400)" }}>
                    {s.k}
                  </div>
                  <div className="pw-display mt-2" style={{ fontSize: "clamp(1.35rem, 3vw, 2.25rem)" }}>
                    {s.v}
                  </div>
                </div>
              ))}
            </div>

            {data.bio && (
              <section className="mt-14 max-w-2xl">
                <h2 className={label} style={{ color: "var(--pw-gray-400)" }}>
                  About
                </h2>
                <p className="mt-4 text-base sm:text-lg font-light leading-relaxed">{data.bio}</p>
              </section>
            )}

            <div className="mt-16">
              <Link
                to={`/facecard/${data.user_id}`}
                className={`${label} inline-block px-8 py-4 transition-colors duration-200 hover:opacity-70`}
                style={{ border: "1px solid var(--pw-text)" }}
              >
                View Facecard
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}