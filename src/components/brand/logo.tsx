import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: { mark: "h-8 w-8", icon: 18, word: "text-sm" },
  md: { mark: "h-10 w-10", icon: 22, word: "text-base" },
  lg: { mark: "h-14 w-14", icon: 30, word: "text-2xl" },
};

/**
 * Original StayCRM mark — hospitality-inspired (not Airbnb's trademarked Bélo).
 * Soft coral loop + dwelling silhouette.
 */
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
          "relative flex shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--brand))] text-white shadow-[0_8px_24px_-10px_hsl(var(--brand)/0.7)]",
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
            d="M16 4.5c-4.6 0-8.4 3.5-8.4 8.4 0 5.7 5.9 11.6 7.7 13.2a1.1 1.1 0 0 0 1.4 0c1.8-1.6 7.7-7.5 7.7-13.2 0-4.9-3.8-8.4-8.4-8.4Z"
            fill="currentColor"
            opacity="0.95"
          />
          <path
            d="M16 10.2c-1.7 0-3.1 1.4-3.1 3.2 0 2.1 1.7 3.7 3.1 4.9 1.4-1.2 3.1-2.8 3.1-4.9 0-1.8-1.4-3.2-3.1-3.2Z"
            fill="white"
            opacity="0.95"
          />
        </svg>
      </div>
      {showWordmark ? (
        <div className="flex flex-col leading-none">
          <span
            className={cn(
              "font-semibold tracking-tight text-foreground",
              s.word
            )}
          >
            Stay<span className="text-[hsl(var(--brand))]">CRM</span>
          </span>
          {size !== "sm" ? (
            <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Property OS
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
