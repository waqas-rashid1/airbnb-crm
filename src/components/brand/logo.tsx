import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: { mark: "h-7 w-7", icon: 16, word: "text-[15px]" },
  md: { mark: "h-9 w-9", icon: 20, word: "text-base" },
  lg: { mark: "h-11 w-11", icon: 24, word: "text-xl" },
};

/** Compact StayCRM mark — simple and ownable, not a third-party trademark. */
export function BrandLogo({
  className,
  markClassName,
  showWordmark = true,
  size = "md",
}: BrandLogoProps) {
  const s = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--brand))] text-white",
          s.mark,
          markClassName
        )}
        aria-hidden
      >
        <svg
          width={s.icon}
          height={s.icon}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 5c-4.2 0-7.6 3.2-7.6 7.6 0 5.2 5.3 10.5 7 12a1 1 0 0 0 1.2 0c1.7-1.5 7-6.8 7-12C23.6 8.2 20.2 5 16 5Z"
            fill="currentColor"
          />
          <circle cx="16" cy="12.4" r="2.6" fill="white" />
        </svg>
      </div>
      {showWordmark ? (
        <span className={cn("font-semibold text-foreground", s.word)}>
          StayCRM
        </span>
      ) : null}
    </div>
  );
}
