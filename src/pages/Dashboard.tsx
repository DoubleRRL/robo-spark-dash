import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import VehicleStatusCard from "@/components/VehicleStatusCard";
import ActiveTripsCard from "@/components/ActiveTripsCard";
import LeafletMapComponent from "@/components/LeafletMapComponent";
import { useSocket } from "@/hooks/useSocket";
import { generateActiveTrips } from "@/utils/riderData";
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
  Wifi,
  WifiOff,
} from "lucide-react";

// Generate random active trips
const mockTrips = generateActiveTrips(5);

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { isConnected, vehicles, lastUpdate } = useSocket();
  const [avgWaitTime] = useState((Math.random() * 5 + 2).toFixed(1)); // Static on launch

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Transform socket data to match existing component expectations
  const realVehicles = vehicles.map(vehicle => ({
    vehicleId: vehicle.id,
    status: vehicle.status as "active" | "charging" | "idle" | "maintenance",
    battery: vehicle.battery,
    location: `${vehicle.lat.toFixed(4)}, ${vehicle.lng.toFixed(4)}`,
    lastTrip: vehicle.eta || "Unknown",
    revenue: Math.floor(Math.random() * 200) + 50, // Mock revenue for now
  }));

  const totalRevenue = realVehicles.reduce((sum, vehicle) => sum + vehicle.revenue, 0);
  const activeVehicles = realVehicles.filter(v => v.status === "active").length;

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
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
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
                <div className="text-xs text-muted-foreground">Avg Wait Time</div>
                <div className="text-lg font-semibold text-tesla-green">{avgWaitTime} min</div>
              </div>
              <div className="bg-background/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Active Trips</div>
                <div className="text-lg font-semibold text-foreground">{mockTrips.length}</div>
              </div>
            </div>
          </div>

          {/* Vehicle List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Fleet Vehicles ({realVehicles.length})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {realVehicles.map((vehicle) => (
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
                        <img 
                          src={`/${vehicle.vehicleId.includes('cybertruck') ? 'cybertruck.png' : 
                               vehicle.vehicleId.includes('modely') ? 'model y.png' : 
                               vehicle.vehicleId.includes('modelx') ? 'model x.png' : 'cybertruck.png'}`}
                          alt={vehicle.vehicleId}
                          className="h-6 w-6 object-contain"
                        />
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
          <LeafletMapComponent vehicles={vehicles} selectedVehicle={selectedVehicle} />
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