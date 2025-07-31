import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function MetricsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: MetricsCardProps) {
  return (
    <Card className="bg-gradient-card border-border hover:border-tesla-blue/50 transition-all duration-300 shadow-card hover:shadow-tesla group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-tesla-blue group-hover:text-tesla-blue transition-colors" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
        <div className="flex items-center space-x-2">
          <p className="text-xs text-muted-foreground">{description}</p>
          {trend && (
            <span
              className={`text-xs font-medium ${
                trend.isPositive ? "text-tesla-green" : "text-tesla-red"
              }`}
            >
              {trend.isPositive ? "+" : ""}{trend.value}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}