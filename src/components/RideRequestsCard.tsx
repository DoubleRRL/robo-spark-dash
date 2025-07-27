import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User, AlertCircle } from "lucide-react";

interface RideRequest {
  id: string;
  passenger: string;
  pickup: string;
  destination: string;
  pickupLocation: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    type: string;
  };
  destinationLocation: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    type: string;
  };
  status: "ride requested";
  mileage: number;
  duration: string;
  fare: number;
  requestTime: string;
}

interface RideRequestsCardProps {
  requests: RideRequest[];
  onAssignVehicle?: (requestId: string, vehicleId: string) => void;
  availableVehicles: Array<{ id: string; type: string; battery: number; lat: number; lng: number }>;
}

export default function RideRequestsCard({ requests, onAssignVehicle, availableVehicles }: RideRequestsCardProps) {
  const getNearestVehicle = (requestLat: number, requestLng: number) => {
    if (availableVehicles.length === 0) return null;
    
    let nearest = availableVehicles[0];
    let minDistance = Infinity;
    
    availableVehicles.forEach(vehicle => {
      const distance = Math.sqrt(
        Math.pow(requestLat - vehicle.lat, 2) + Math.pow(requestLng - vehicle.lng, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = vehicle;
      }
    });
    
    return { vehicle: nearest, distance: minDistance };
  };

  return (
    <Card className="bg-gradient-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center">
          <AlertCircle className="mr-2 h-5 w-5 text-orange-500" />
          Ride Requests ({requests.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending ride requests
            </div>
          ) : (
            requests.map((request) => {
              const nearest = getNearestVehicle(request.pickupLocation.lat, request.pickupLocation.lng);
              const distanceMiles = nearest ? (nearest.distance * 69).toFixed(1) : 'N/A';
              
              return (
                <div
                  key={request.id}
                  className="bg-background/50 rounded-lg p-4 border border-border hover:border-tesla-blue/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-foreground" />
                      <span className="font-medium text-foreground">
                        {request.passenger}
                      </span>
                    </div>
                    <Badge className="bg-orange-500 text-white border-none">
                      Pending
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-foreground">
                      <MapPin className="mr-2 h-3 w-3 text-foreground" />
                      <span className="truncate">{request.pickup}</span>
                    </div>
                    <div className="flex items-center text-foreground">
                      <MapPin className="mr-2 h-3 w-3 text-foreground" />
                      <span className="truncate">{request.destination}</span>
                    </div>
                    
                    {nearest && (
                      <div className="bg-tesla-blue/10 p-2 rounded border border-tesla-blue/20">
                        <div className="text-xs text-foreground">
                          <strong>Nearest Vehicle:</strong> {nearest.vehicle.id} ({distanceMiles} mi away)
                        </div>
                        <div className="text-xs text-foreground">
                          Battery: {nearest.vehicle.battery}% • Type: {nearest.vehicle.type}
                        </div>
                        {onAssignVehicle && (
                          <button
                            onClick={() => onAssignVehicle(request.id, nearest.vehicle.id)}
                            className="mt-1 text-xs bg-tesla-blue text-white px-2 py-1 rounded hover:bg-tesla-blue/80 transition-colors"
                          >
                            Assign Vehicle
                          </button>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center text-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        {request.requestTime}
                      </div>
                      <div className="flex items-center text-tesla-green font-medium">
                        ${request.fare.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
} 