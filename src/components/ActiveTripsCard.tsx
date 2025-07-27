import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User, DollarSign } from "lucide-react";

interface Trip {
  id: string;
  passenger: string;
  pickup: string;
  destination: string;
  duration: string;
  fare: number;
  status: "en-route" | "dropping off";
  mileage: number;
  pickupLocation?: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    type: string;
  };
  destinationLocation?: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    type: string;
  };
}

interface ActiveTripsCardProps {
  trips: Trip[];
}

const statusConfig = {
  "en-route": { color: "bg-tesla-green", label: "En Route" },
  "dropping off": { color: "bg-tesla-blue", label: "Dropping Off" },
};

export default function ActiveTripsCard({ trips }: ActiveTripsCardProps) {
  return (
    <Card className="bg-gradient-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center">
          <Clock className="mr-2 h-5 w-5 text-tesla-blue" />
          Active Trips ({trips.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {trips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active trips
            </div>
          ) : (
            trips.map((trip) => (
              <div
                key={trip.id}
                className="border border-border rounded-lg p-4 hover:border-tesla-blue/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-tesla-blue" />
                    <span className="font-medium text-foreground">
                      {trip.passenger}
                    </span>
                  </div>
                  <Badge className={`${statusConfig[trip.status].color} text-primary-foreground border-none`}>
                    {statusConfig[trip.status].label}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="mr-2 h-3 w-3" />
                    <span className="truncate">{trip.pickup}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="mr-2 h-3 w-3" />
                    <span className="truncate">{trip.destination}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      {trip.duration}
                    </div>
                    <div className="flex items-center text-tesla-green font-medium">
                      <DollarSign className="mr-1 h-3 w-3" />
                      {trip.fare.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Customer status: {trip.status} • {trip.mileage} miles remaining
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}