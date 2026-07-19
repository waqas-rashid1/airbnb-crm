import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  subtitle?: string;
  trend?: {
    value: number;
    label?: string;
  };
  className?: string;
};

export function MetricCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  className,
}: MetricCardProps) {
  const positive = trend ? trend.value >= 0 : null;

  return (
    <Card
      className={cn(
        "metric-card overflow-hidden border-border/80 bg-card/90 shadow-[0_10px_30px_-24px_hsl(var(--foreground)/0.35)]",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--brand-soft))] text-[hsl(var(--brand))]">
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="font-display text-2xl font-semibold tracking-tight">
          {value}
        </div>
        {(subtitle || trend) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {trend ? (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-medium",
                  positive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {positive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {positive ? "+" : ""}
                {trend.value}%
                {trend.label ? ` ${trend.label}` : ""}
              </span>
            ) : null}
            {subtitle ? <span>{subtitle}</span> : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
