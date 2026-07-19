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
    <Card className={cn("border bg-card shadow-none", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-[12.5px] font-medium uppercase tracking-[0.04em] text-muted-foreground">
          {title}
        </CardTitle>
        {Icon ? <Icon className="h-4 w-4 text-muted-foreground/70" /> : null}
      </CardHeader>
      <CardContent>
        <div className="tabular text-[1.55rem] font-semibold leading-none tracking-tight">
          {value}
        </div>
        {(subtitle || trend) && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground">
            {trend ? (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-medium",
                  positive
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-red-700 dark:text-red-400"
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
