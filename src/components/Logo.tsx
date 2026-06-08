"use client";

interface LogoProps {
  size?: number;
  showText?: boolean;
  colorMode?: "light" | "dark";
  className?: string;
}

export default function Logo({ size = 32, showText = true, colorMode = "light", className = "" }: LogoProps) {
  const isDark = colorMode === "dark";
  const fillValue = isDark ? "#ffffff" : "var(--color-primary, #6D28D9)";

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", verticalAlign: "middle" }} className={className}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        style={{ flexShrink: 0 }}
        fill={fillValue}
      >
        {/* Toes */}
        <circle cx="4.5" cy="11.5" r="2.4" />
        <circle cx="9.5" cy="7.2" r="2.8" />
        <circle cx="14.5" cy="7.2" r="2.8" />
        <circle cx="19.5" cy="11.5" r="2.4" />
        {/* Main Pad */}
        <path d="M12 13.2 C 9.5 11, 6.5 12.8, 6.5 16 C 6.5 19.2, 9.5 21, 12 21 C 14.5 21, 17.5 19.2, 17.5 16 C 17.5 12.8, 14.5 11, 12 13.2 Z" />
      </svg>
      {showText && (
        <span style={{ fontWeight: 800, display: "inline-flex", gap: "3px", letterSpacing: "-0.02em" }}>
          <span style={{ color: isDark ? "#ffffff" : "var(--color-primary, #6D28D9)" }}>rede</span>
          <span style={{ color: "var(--color-accent, #F6A25C)" }}>ninhada</span>
        </span>
      )}
    </div>
  );
}
