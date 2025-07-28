import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import VehicleStatusCard from "@/components/VehicleStatusCard";
import ActiveTripsCard from "@/components/ActiveTripsCard";
import RideRequestsCard from "@/components/RideRequestsCard";
import LeafletMapComponent from "@/components/LeafletMapComponent";
import { useSocket } from "@/hooks/useSocket";
import { generateActiveTrips } from "@/utils/riderData";
import { comptonAddresses } from "@/utils/comptonAddresses";
import VehicleDiagnosticsCard from "@/components/VehicleDiagnosticsCard";
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
  Filter,
} from "lucide-react";

// Generate random active trips
const allTrips = generateActiveTrips(8);
const activeTrips = allTrips.filter(trip => trip.status === "en-route" || trip.status === "dropping off");
const rideRequests = allTrips.filter(trip => trip.status === "ride requested").map(request => ({
  ...request,
  requestTime: `${Math.floor(Math.random() * 10) + 1} min ago`
}));

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { isConnected, vehicles, lastUpdate } = useSocket();
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [batteryFilter, setBatteryFilter] = useState<string>("all");
  
  // Debug: log vehicle count
  console.log('Total vehicles received:', vehicles.length);
  console.log('Vehicle IDs:', vehicles.map(v => v.id));
  const [avgWaitTime] = useState((Math.random() * 5 + 2).toFixed(1)); // Static on launch

  // Vehicle type mapping function
  const getVehicleDisplayName = (vehicleId: string) => {
    if (vehicleId.includes('modelx')) return 'Model X';
    if (vehicleId.includes('cybertruck')) return 'Cybertruck';
    if (vehicleId.includes('modely')) return 'Model Y';
    return 'Unknown';
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Transform socket data to match existing component expectations
  const realVehicles = vehicles.map(vehicle => {
    // Map socket status to component status with more specific definitions
    let status: "pickup" | "dropoff" | "en-route" | "charging" | "available";
    switch (vehicle.status) {
      case 'en-route':
        status = 'en-route';
        break;
      case 'charging':
        status = 'charging';
        break;
      case 'available':
        status = 'available';
        break;
      case 'picking-up':
        status = 'pickup';
        break;
      case 'dropping-off':
        status = 'dropoff';
        break;
      default:
        status = 'available';
    }

    return {
      vehicleId: vehicle.id,
      status,
      battery: vehicle.battery,
      location: `${vehicle.lat.toFixed(4)}, ${vehicle.lng.toFixed(4)}`,
      lastTrip: vehicle.eta || "Unknown",
      type: getVehicleDisplayName(vehicle.id),
    };
  });

  // Apply filters
  const filteredVehicles = realVehicles.filter(vehicle => {
    const statusMatch = statusFilter === "all" || vehicle.status === statusFilter;
    const typeMatch = typeFilter === "all" || vehicle.type === typeFilter;
    const batteryMatch = batteryFilter === "all" || 
      (batteryFilter === "low" && vehicle.battery < 30) ||
      (batteryFilter === "medium" && vehicle.battery >= 30 && vehicle.battery < 70) ||
      (batteryFilter === "high" && vehicle.battery >= 70);
    
    return statusMatch && typeMatch && batteryMatch;
  });

  const totalRevenue = 0; // Removed random revenue generation
  const activeVehicles = realVehicles.filter(v => v.status === "en-route" || v.status === "pickup" || v.status === "dropoff").length;

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
                <div className="text-lg font-semibold text-foreground">{activeTrips.length}</div>
              </div>
            </div>
          </div>

          {/* Vehicle List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-foreground">Fleet Vehicles ({filteredVehicles.length})</h3>
                <Filter className="h-4 w-4 text-muted-foreground" />
              </div>
              
              {/* Filter Controls */}
              <div className="space-y-2 mb-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="en-route">En Route</SelectItem>
                    <SelectItem value="pickup">Pickup</SelectItem>
                    <SelectItem value="dropoff">Dropoff</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="charging">Charging</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Model X">Model X</SelectItem>
                    <SelectItem value="Model Y">Model Y</SelectItem>
                    <SelectItem value="Cybertruck">Cybertruck</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={batteryFilter} onValueChange={setBatteryFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Filter by battery" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Battery Levels</SelectItem>
                    <SelectItem value="low">Low (&lt;30%)</SelectItem>
                    <SelectItem value="medium">Medium (30-70%)</SelectItem>
                    <SelectItem value="high">High (&gt;70%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredVehicles.map((vehicle) => (
                  <div
                    key={vehicle.vehicleId}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedVehicle === vehicle.vehicleId
                        ? 'border-tesla-blue bg-tesla-blue/10'
                        : 'border-border hover:border-tesla-blue/50'
                    }`}
                    onClick={() => {
                      setSelectedVehicle(vehicle.vehicleId);
                      // Center map on selected vehicle
                      const selectedVehicleData = vehicles.find(v => v.id === vehicle.vehicleId);
                      if (selectedVehicleData) {
                        // This will trigger the map to center on the vehicle
                        console.log('Selected vehicle:', selectedVehicleData);
                      }
                    }}
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
                        <div>
                          <span className="text-sm font-medium text-foreground">{vehicle.vehicleId}</span>
                          <div className="text-xs text-muted-foreground">{vehicle.type}</div>
                        </div>
                      </div>
                      <Badge 
                        className={`text-xs ${
                          vehicle.status === 'en-route' ? 'bg-tesla-green' :
                          vehicle.status === 'pickup' ? 'bg-yellow-500' :
                          vehicle.status === 'dropoff' ? 'bg-orange-500' :
                          vehicle.status === 'charging' ? 'bg-tesla-blue' :
                          'bg-muted'
                        } text-primary-foreground border-none`}
                      >
                        {vehicle.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      <strong>Status:</strong> {vehicle.status.toUpperCase()}
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      <strong>Location:</strong> {vehicle.location}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">Battery: {vehicle.battery}%</span>
                      <span className="text-xs text-muted-foreground">ETA: {vehicle.lastTrip}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center Map Area */}
        <div className="flex-1 bg-tesla-gray relative">
          <LeafletMapComponent 
            vehicles={vehicles} 
            selectedVehicle={selectedVehicle} 
            onVehicleSelect={setSelectedVehicle}
            rideRequests={rideRequests}
          />
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
                  Pull Over
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

          {/* Vehicle Diagnostics */}
          {selectedVehicle && (
            <div className="p-4 border-b border-border">
              <VehicleDiagnosticsCard 
                diagnostics={vehicles.find(v => v.id === selectedVehicle)?.diagnostics || null}
              />
            </div>
          )}

          {/* Ride Requests */}
          <div className="flex-1 overflow-y-auto">
            <RideRequestsCard 
              requests={rideRequests} 
              availableVehicles={vehicles.filter(v => v.status === 'available').map(v => ({
                id: v.id,
                type: v.type,
                battery: v.battery,
                lat: v.lat,
                lng: v.lng
              }))}
            />
          </div>
          
          {/* Active Trips */}
          <div className="flex-1 overflow-y-auto">
            <ActiveTripsCard trips={activeTrips} />
          </div>
        </div>
      </div>
    </div>
  );
}