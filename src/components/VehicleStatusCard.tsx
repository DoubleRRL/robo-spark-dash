import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Battery, MapPin, Clock } from "lucide-react";

// Get static, deterministic rides completed based on vehicle ID
function getStaticRidesCompleted(vehicleId: string): number {
  const vehicleNumber = parseInt(vehicleId.replace('vehicle-', ''));
  // Assign static, deterministic values based on vehicle number
  if (vehicleNumber <= 5) return 8 + (vehicleNumber % 5); // Cybertrucks: 8-12 rides
  if (vehicleNumber <= 10) return 5 + (vehicleNumber % 5); // Model Ys: 5-9 rides
  return 2 + (vehicleNumber % 5); // Model Xs: 2-6 rides
}

interface VehicleStatusCardProps {
  vehicleId: string;
  status: "idle" | "charging" | "maintenance" | "pickup" | "dropoff" | "en-route" | "available";
  battery: number;
  location: string;
  lastTrip: string;
  revenue: number;
  isSelected?: boolean;
  onSelect?: (vehicleId: string) => void;
}

const statusConfig = {
  idle: { color: "bg-muted", label: "Idle", icon: Clock },
  charging: { color: "bg-tesla-blue", label: "Charging", icon: Battery },
  maintenance: { color: "bg-tesla-red", label: "Maintenance", icon: Car },
  pickup: { color: "bg-orange-500", label: "Pickup", icon: Car },
  dropoff: { color: "bg-purple-500", label: "Dropoff", icon: Car },
  "en-route": { color: "bg-blue-500", label: "En Route", icon: Car },
  available: { color: "bg-green-500", label: "Available", icon: Car },
};

export default function VehicleStatusCard({
  vehicleId,
  status,
  battery,
  location,
  lastTrip,
  revenue,
  isSelected = false,
  onSelect,
}: VehicleStatusCardProps) {
  const config = statusConfig[status] || statusConfig.available; // fallback to available
  const StatusIcon = config.icon;

  return (
    <Card 
      className={`bg-gradient-card border-border hover:border-tesla-blue/50 transition-all duration-300 shadow-card hover:shadow-tesla group cursor-pointer ${
        isSelected ? 'border-tesla-blue ring-2 ring-tesla-blue/20' : ''
      }`}
      onClick={() => onSelect?.(vehicleId)}
    >
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
              {getStaticRidesCompleted(vehicleId)}
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