import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import VehicleStatusCard from "@/components/VehicleStatusCard";
import ActiveTripsCard from "@/components/ActiveTripsCard";
import {
  Car,
  DollarSign,
  Users,
  Clock,
  Settings,
  Bell,
  RefreshCw,
  AlertTriangle,
  MapPin,
  Phone,
  Shield,
  Activity,
} from "lucide-react";

// Mock data
const mockVehicles = [
  {
    vehicleId: "TSL-001",
    status: "active" as const,
    battery: 87,
    location: "Downtown Seattle",
    lastTrip: "15 min ago",
    revenue: 142.50,
  },
  {
    vehicleId: "TSL-002",
    status: "charging" as const,
    battery: 45,
    location: "Supercharger Station",
    lastTrip: "1 hour ago",
    revenue: 98.75,
  },
  {
    vehicleId: "TSL-003",
    status: "idle" as const,
    battery: 92,
    location: "Capitol Hill",
    lastTrip: "8 min ago",
    revenue: 203.25,
  },
  {
    vehicleId: "TSL-004",
    status: "maintenance" as const,
    battery: 0,
    location: "Service Center",
    lastTrip: "3 hours ago",
    revenue: 0,
  },
];

const mockTrips = [
  {
    id: "trip-001",
    passenger: "John Smith",
    pickup: "Seattle Airport",
    destination: "Microsoft Campus",
    duration: "12 min",
    fare: 24.50,
    status: "in-transit" as const,
  },
  {
    id: "trip-002",
    passenger: "Sarah Johnson",
    pickup: "Pike Place Market",
    destination: "University of Washington",
    duration: "18 min",
    fare: 18.75,
    status: "pickup" as const,
  },
  {
    id: "trip-003",
    passenger: "Mike Wilson",
    pickup: "Bellevue Square",
    destination: "Seattle Center",
    duration: "3 min",
    fare: 32.00,
    status: "arriving" as const,
  },
];

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const totalRevenue = mockVehicles.reduce((sum, vehicle) => sum + vehicle.revenue, 0);
  const activeVehicles = mockVehicles.filter(v => v.status === "active").length;

  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top Header */}
      <div className="h-14 bg-gradient-card border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-foreground">
            Tesla Robotaxi Control Center
          </h1>
          <Badge variant="secondary" className="bg-tesla-green/20 text-tesla-green">
            {activeVehicles} Active
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground">
            {currentTime.toLocaleTimeString()}
          </span>
          <Button variant="teslaGhost" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="teslaGhost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Dashboard Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Fleet Management */}
        <div className="w-80 bg-gradient-card border-r border-border flex flex-col">
          {/* Fleet Analytics */}
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-medium text-foreground mb-3">Fleet Analytics</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Revenue</div>
                <div className="text-lg font-semibold text-tesla-green">${totalRevenue.toFixed(0)}</div>
              </div>
              <div className="bg-background/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Trips</div>
                <div className="text-lg font-semibold text-foreground">47</div>
              </div>
            </div>
          </div>

          {/* Vehicle List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Fleet Vehicles</h3>
              <div className="space-y-2">
                {mockVehicles.map((vehicle) => (
                  <div
                    key={vehicle.vehicleId}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedVehicle === vehicle.vehicleId
                        ? 'border-tesla-blue bg-tesla-blue/10'
                        : 'border-border hover:border-tesla-blue/50'
                    }`}
                    onClick={() => setSelectedVehicle(vehicle.vehicleId)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Car className="h-4 w-4 text-tesla-blue" />
                        <span className="text-sm font-medium text-foreground">{vehicle.vehicleId}</span>
                      </div>
                      <Badge 
                        className={`text-xs ${
                          vehicle.status === 'active' ? 'bg-tesla-green' :
                          vehicle.status === 'charging' ? 'bg-tesla-blue' :
                          vehicle.status === 'idle' ? 'bg-muted' : 'bg-tesla-red'
                        } text-primary-foreground border-none`}
                      >
                        {vehicle.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{vehicle.location}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">Battery: {vehicle.battery}%</span>
                      <span className="text-xs text-tesla-green">${vehicle.revenue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center Map Area */}
        <div className="flex-1 bg-tesla-gray relative">
          <div className="absolute inset-4 bg-gradient-to-br from-tesla-gray to-tesla-gray-light rounded-lg border border-border">
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <MapPin className="h-12 w-12 mx-auto mb-2" />
                <p className="text-sm">Map will be integrated here</p>
                <p className="text-xs">Ready for OSRM plugin</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Operations */}
        <div className="w-80 bg-gradient-card border-l border-border flex flex-col">
          {/* Emergency Procedures */}
          {selectedVehicle && (
            <div className="p-4 border-b border-border">
              <div className="flex items-center space-x-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-tesla-red" />
                <h3 className="text-sm font-medium text-foreground">Emergency Controls</h3>
              </div>
              <div className="space-y-2">
                <Button variant="destructive" size="sm" className="w-full justify-start">
                  <Shield className="h-3 w-3 mr-2" />
                  Emergency Stop
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Phone className="h-3 w-3 mr-2" />
                  Contact Vehicle
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Activity className="h-3 w-3 mr-2" />
                  Remote Diagnostics
                </Button>
              </div>
            </div>
          )}

          {/* Active Trips */}
          <div className="flex-1 overflow-y-auto">
            <ActiveTripsCard trips={mockTrips} />
          </div>
        </div>
      </div>
    </div>
  );
}