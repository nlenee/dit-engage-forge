import { Link } from "react-router-dom";

const gradientStyle: React.CSSProperties = {
  background:
    "linear-gradient(123deg, #0d1b2e 7%, #c9a84c 37%, #0d1b2e 72%, #c9a84c 100%)",
  boxShadow:
    "0px 4px 4px rgba(201,168,76,0.25), 4px 4px 12px #0d1b2e inset",
  outline: "2px solid #ffffff",
  outlineOffset: "-3px",
};

export function GradientCTA({
  children,
  to,
  className = "",
}: {
  children: React.ReactNode;
  to?: string;
  className?: string;
}) {
  const cls =
    "inline-block rounded-full text-white font-medium uppercase tracking-widest px-8 py-3 sm:px-10 sm:py-3.5 md:px-12 md:py-4 text-xs sm:text-sm transition-transform duration-200 hover:scale-[1.03] " +
    className;
  if (to)
    return (
      <Link to={to} className={cls} style={gradientStyle}>
        {children}
      </Link>
    );
  return (
    <button type="button" className={cls} style={gradientStyle}>
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full border-2 uppercase tracking-widest px-5 py-2 text-[0.65rem] sm:text-xs transition-colors duration-200 " +
        className
      }
      style={{
        borderColor: "var(--dit-gold)",
        color: "var(--dit-gold)",
        backgroundColor: "transparent",
      }}
    >
      {children}
    </button>
  );
}