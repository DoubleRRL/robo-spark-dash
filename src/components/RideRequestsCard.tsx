import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User, AlertCircle, Car, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { generateActiveTrips } from "../utils/riderData";

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
  status: "ride requested" | "en-route" | "dropping off";
  mileage: number;
  duration: string;
  fare: number;
  requestTime?: string;
}

interface RideRequestsCardProps {
  requests?: RideRequest[];
  onAssignVehicle?: (requestId: string, vehicleId: string) => void;
  availableVehicles: Array<{ id: string; type: string; battery: number; lat: number; lng: number }>;
}

export default function RideRequestsCard({ requests: externalRequests, onAssignVehicle, availableVehicles }: RideRequestsCardProps) {
  // Generate 18-25 riders if no external requests are provided
  const [generatedRequests] = useState<RideRequest[]>(
    () => externalRequests || generateActiveTrips(Math.floor(Math.random() * 8) + 18) // 18-25 riders
  );

  // Use either the external requests or our generated ones
  const requests = externalRequests || generatedRequests;
  
  // Filter requests by status for display
  const pendingRequests = requests.filter(r => r.status === "ride requested");
  const enRouteRequests = requests.filter(r => r.status === "en-route");
  const droppingOffRequests = requests.filter(r => r.status === "dropping off");
  
  // Filter type
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const filteredRequests = statusFilter === "all" 
    ? requests 
    : requests.filter(r => r.status === statusFilter);
    
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
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-orange-500" />
            Ride Requests ({requests.length})
          </CardTitle>
          <div className="flex space-x-1">
            <Button 
              variant={statusFilter === "all" ? "default" : "outline"} 
              size="sm"
              onClick={() => setStatusFilter("all")}
              className="text-xs px-2 h-7"
            >
              All ({requests.length})
            </Button>
            <Button 
              variant={statusFilter === "ride requested" ? "default" : "outline"} 
              size="sm"
              onClick={() => setStatusFilter("ride requested")}
              className="text-xs px-2 h-7"
            >
              <Search className="h-3 w-3 mr-1" />
              Pending ({pendingRequests.length})
            </Button>
            <Button 
              variant={statusFilter === "en-route" ? "default" : "outline"} 
              size="sm"
              onClick={() => setStatusFilter("en-route")}
              className="text-xs px-2 h-7"
            >
              <Car className="h-3 w-3 mr-1" />
              En Route ({enRouteRequests.length})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No {statusFilter === "all" ? "" : statusFilter} ride requests
            </div>
          ) : (
            filteredRequests.map((request) => {
              const nearest = getNearestVehicle(request.pickupLocation.lat, request.pickupLocation.lng);
              const distanceMiles = nearest ? (nearest.distance * 69).toFixed(1) : 'N/A';
              
              let badgeClass = "bg-orange-500"; // Default for pending
              let badgeText = "Pending";
              
              if (request.status === "en-route") {
                badgeClass = "bg-blue-500";
                badgeText = "En Route";
              } else if (request.status === "dropping off") {
                badgeClass = "bg-green-500";
                badgeText = "Dropping Off";
              }
              
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
                    <Badge className={`${badgeClass} text-white border-none`}>
                      {badgeText}
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
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="mr-2 h-3 w-3" />
                      <span>{request.duration} • {request.mileage.toFixed(1)} mi • ${request.fare.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {request.status === "ride requested" && nearest && onAssignVehicle && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <div>
                          Nearest: {nearest.vehicle.id} ({distanceMiles} mi)
                          <br />
                          Battery: {Math.round(nearest.vehicle.battery)}% • Type: {nearest.vehicle.type}
                        </div>
                        <Button
                          size="sm"
                          variant="tesla"
                          className="text-xs"
                          onClick={() => onAssignVehicle(request.id, nearest.vehicle.id)}
                        >
                          Assign
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
} 