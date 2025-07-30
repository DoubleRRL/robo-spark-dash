import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Battery, MapPin, Clock } from "lucide-react";

interface VehicleStatusCardProps {
  vehicleId: string;
  status: "idle" | "charging" | "maintenance";
  battery: number;
  location: string;
  lastTrip: string;
  revenue: number;
}

const statusConfig = {
  idle: { color: "bg-muted", label: "Idle", icon: Clock },
  charging: { color: "bg-tesla-blue", label: "Charging", icon: Battery },
  maintenance: { color: "bg-tesla-red", label: "Maintenance", icon: Car },
};

export default function VehicleStatusCard({
  vehicleId,
  status,
  battery,
  location,
  lastTrip,
  revenue,
}: VehicleStatusCardProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card className="bg-gradient-card border-border hover:border-tesla-blue/50 transition-all duration-300 shadow-card hover:shadow-tesla group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-foreground">
          Vehicle {vehicleId}
        </CardTitle>
        <StatusIcon className="h-4 w-4 text-tesla-blue group-hover:text-tesla-blue transition-colors" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge className={`${config.color} text-primary-foreground border-none`}>
              {config.label}
            </Badge>
            <div className="flex items-center text-sm text-muted-foreground">
              <Battery className="mr-1 h-3 w-3" />
              {battery}%
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="mr-1 h-3 w-3" />
              {location}
            </div>
            <div className="text-xs text-muted-foreground">
              Last trip: {lastTrip}
            </div>
          </div>
          
          <div className="pt-2 border-t border-border">
            <div className="text-lg font-semibold text-tesla-green">
              {Math.random() < 0.25 ? Math.floor(Math.random() * 13) + 2 : 0}
            </div>
            <div className="text-xs text-muted-foreground">
              Rides Completed
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}