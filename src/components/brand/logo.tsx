"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
  inverted?: boolean;
};

const sizeMap = {
  sm: { mark: "h-8 w-8", word: "text-[15px]" },
  md: { mark: "h-9 w-9", word: "text-base" },
  lg: { mark: "h-11 w-11", word: "text-lg" },
};

/**
 * Hostora mark — geometric H with a warm ora disc (host + ora).
 * Solid, high-contrast, reads at favicon size.
 */
export function BrandLogo({
  className,
  markClassName,
  showWordmark = true,
  size = "md",
  inverted = false,
}: BrandLogoProps) {
  const s = sizeMap[size];
  const uid = useId().replace(/:/g, "");

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        className={cn("shrink-0", s.mark, markClassName)}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <rect width="40" height="40" rx="11" fill={`url(#${uid}-bg)`} />
        <defs>
          <linearGradient
            id={`${uid}-bg`}
            x1="8"
            y1="4"
            x2="34"
            y2="38"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#0F766E" />
            <stop offset="1" stopColor="#115E59" />
          </linearGradient>
        </defs>

        {/* Left pillar */}
        <rect x="10" y="9" width="6.5" height="22" rx="3.25" fill="white" />
        {/* Right pillar */}
        <rect x="23.5" y="9" width="6.5" height="22" rx="3.25" fill="white" />
        {/* Crossbar segments (gap for ora) */}
        <rect x="14" y="16.75" width="4.5" height="6.5" rx="1.5" fill="white" />
        <rect x="21.5" y="16.75" width="4.5" height="6.5" rx="1.5" fill="white" />
        {/* Ora — warm welcome light */}
        <circle cx="20" cy="20" r="4.15" fill="#F97316" />
        <circle cx="18.7" cy="18.6" r="1.15" fill="#FFEDD5" opacity="0.9" />
      </svg>

      {showWordmark ? (
        <div className="flex flex-col leading-none">
          <span
            className={cn(
              "font-semibold tracking-[-0.04em]",
              inverted ? "text-white" : "text-foreground",
              s.word
            )}
          >
            Hostora
          </span>
          {size !== "sm" ? (
            <span
              className={cn(
                "mt-1 text-[10px] font-medium tracking-[0.12em]",
                inverted ? "text-white/50" : "text-muted-foreground"
              )}
            >
              PROPERTY CRM
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
