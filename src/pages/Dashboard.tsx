import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Bell, Settings } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import VehicleStatusCard from '../components/VehicleStatusCard';
import ActiveTripsCard from '../components/ActiveTripsCard';
import RideRequestsCard from '../components/RideRequestsCard';
import GoogleMapComponent from '../components/GoogleMapComponent';

import { comptonAddresses } from '../utils/comptonAddresses';
import VehicleDiagnosticsCard from '../components/VehicleDiagnosticsCard';



export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { isConnected, vehicles, lastUpdate, trips } = useSocket();
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [batteryFilter, setBatteryFilter] = useState<string>("all");
  
  // Debug: log vehicle count
  console.log('Total vehicles received:', vehicles.length);
  console.log('Vehicle IDs:', vehicles.map(v => v.id));
  console.log('🔍 Raw vehicle data:', vehicles.slice(0, 3)); // Log first 3 vehicles for debugging
  
  // Debug: log vehicle types
  if (vehicles.length > 0) {
    console.log('🔍 Vehicle types from socket:', vehicles.map(v => ({ id: v.id, type: v.type })));
  }
  const [avgWaitTime] = useState((Math.random() * 5 + 2).toFixed(1)); // Static on launch



  // Vehicle type mapping function - FIX: use type field from socket data
  const getVehicleDisplayName = (vehicle: { id?: string; vehicleId?: string; type?: string }) => {
    // First try the type field from socket data
    if (vehicle.type) return vehicle.type;
    
    // Fallback to ID parsing for compatibility
    const vehicleId = vehicle.id || vehicle.vehicleId || '';
    if (vehicleId.includes('modelx')) return 'Model X';
    if (vehicleId.includes('cybertruck')) return 'Cybertruck';
    if (vehicleId.includes('modely')) return 'Model Y';
    return 'Model X'; // Default fallback
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Transform socket data to match existing component expectations
  const realVehicles = vehicles.map(vehicle => {
    console.log(`🔄 Mapping vehicle ${vehicle.id}: socket status "${vehicle.status}"`);
    
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
        console.log(`⚠️ Unknown status "${vehicle.status}" for vehicle ${vehicle.id}, defaulting to available`);
        status = 'available';
    }
    
    console.log(`✅ Mapped vehicle ${vehicle.id}: "${vehicle.status}" -> "${status}"`);

    return {
      vehicleId: vehicle.id,
      status,
      // Ensure battery is a whole number
      battery: Math.round(vehicle.battery || 0),
      location: `${vehicle.lat.toFixed(4)}, ${vehicle.lng.toFixed(4)}`,
      lastTrip: vehicle.eta || "Unknown",
      type: getVehicleDisplayName(vehicle),
    };
  });

  // Calculate status counts for filter dropdowns
  const statusCounts = {
    available: realVehicles.filter(v => v.status === "available").length,
    "en-route": realVehicles.filter(v => v.status === "en-route").length,
    pickup: realVehicles.filter(v => v.status === "pickup").length,
    dropoff: realVehicles.filter(v => v.status === "dropoff").length,
    charging: realVehicles.filter(v => v.status === "charging").length,
  };

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

  // Transform vehicles for GoogleMapComponent with proper route format
  const mapVehicles = vehicles.map(vehicle => ({
    id: vehicle.id,
    lat: vehicle.lat,
    lng: vehicle.lng,
    status: vehicle.status,
    battery: vehicle.battery,
    type: vehicle.type,
    speed: vehicle.speed,
    route: vehicle.route?.map((point, index) => ({
      lat: point.lat,
      lng: point.lng,
      timestamp: Date.now() + (index * 30000) // Add timestamp for compatibility
    })),
    currentIndex: vehicle.currentIndex,
    pickup: vehicle.pickupLocation ? {
      lat: vehicle.pickupLocation.lat,
      lng: vehicle.pickupLocation.lng,
      name: vehicle.pickupLocation.address || 'Pickup Location'
    } : undefined,
    destination: vehicle.destination ? {
      lat: vehicle.destination.lat,
      lng: vehicle.destination.lng,
      name: vehicle.destination.address || 'Destination'
    } : undefined,
    eta: vehicle.eta
  }));

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top Header */}
      <div className="h-14 bg-gradient-card border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-foreground">
            Tesla Robotaxi Control Center
          </h1>
          <Badge variant="secondary" className="bg-tesla-green/20 text-tesla-green">
            {trips.filter(t => t.status === 'en-route' || t.status === 'dropping off').length} Active
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
              <div className="bg-background/50 rounded-lg p-3 border border-border">
                <h4 className="text-xs font-medium text-muted-foreground">Total Vehicles</h4>
                <div className="text-2xl font-bold text-foreground">{vehicles.length}</div>
              </div>
              <div className="bg-background/50 rounded-lg p-3 border border-border">
                <h4 className="text-xs font-medium text-muted-foreground">Active Trips</h4>
                <div className="text-2xl font-bold text-foreground">{trips.filter(t => t.status === 'en-route' || t.status === 'dropping off').length}</div>
              </div>
              <div className="bg-background/50 rounded-lg p-3 border border-border">
                <h4 className="text-xs font-medium text-muted-foreground">Avg Wait Time</h4>
                <div className="text-2xl font-bold text-foreground">{avgWaitTime} <span className="text-sm font-normal">min</span></div>
              </div>

            </div>
          </div>

          {/* Vehicle filters */}
          <div className="p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Filters</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Status
                </label>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-full bg-background/50 border-border">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses ({realVehicles.length})</SelectItem>
                    <SelectItem value="available">Available ({statusCounts.available})</SelectItem>
                    <SelectItem value="en-route">En Route ({statusCounts["en-route"]})</SelectItem>
                    <SelectItem value="pickup">Pickup ({statusCounts.pickup})</SelectItem>
                    <SelectItem value="dropoff">Dropoff ({statusCounts.dropoff})</SelectItem>
                    <SelectItem value="charging">Charging ({statusCounts.charging})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Vehicle Type
                </label>
                <Select
                  value={typeFilter}
                  onValueChange={setTypeFilter}
                >
                  <SelectTrigger className="w-full bg-background/50 border-border">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="cybertruck">Cybertruck</SelectItem>
                    <SelectItem value="modely">Model Y</SelectItem>
                    <SelectItem value="modelx">Model X</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Battery Level
                </label>
                <Select
                  value={batteryFilter}
                  onValueChange={setBatteryFilter}
                >
                  <SelectTrigger className="w-full bg-background/50 border-border">
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="low">Low (&lt; 30%)</SelectItem>
                    <SelectItem value="medium">Medium (30% - 70%)</SelectItem>
                    <SelectItem value="high">High (&gt; 70%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Vehicle List */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Fleet Status</h3>
            <div className="space-y-3">
              {filteredVehicles.map((vehicle) => (
                <VehicleStatusCard
                  key={vehicle.vehicleId}
                  vehicleId={vehicle.vehicleId}
                  status={vehicle.status}
                  battery={vehicle.battery}
                  location={vehicle.location}
                  lastTrip={vehicle.lastTrip}
                  revenue={0}
                  isSelected={selectedVehicle === vehicle.vehicleId}
                  onSelect={setSelectedVehicle}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Main Content - Map and Stats */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Map */}
          <div className="flex-1 relative">
                    <GoogleMapComponent
          vehicles={mapVehicles}
          selectedVehicle={selectedVehicle}
          onVehicleSelect={setSelectedVehicle}
          rideRequests={trips}
        />
          </div>
        </div>
        
        {/* Right Sidebar - Trips and Requests */}
        <div className="w-96 bg-gradient-card border-l border-border flex flex-col">
          {/* Vehicle Details (when selected) */}
          {selectedVehicle && (
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-medium text-foreground mb-3">Vehicle Diagnostics</h3>
              <VehicleDiagnosticsCard
                diagnostics={vehicles.find(v => v.id === selectedVehicle)?.diagnostics || {}}
                vehicleType={vehicles.find(v => v.id === selectedVehicle)?.type || 'default'}
                battery={vehicles.find(v => v.id === selectedVehicle)?.battery || 0}
              />
            </div>
          )}
          
          {/* Active Trips */}
          <div className="p-4 border-b border-border">
            <ActiveTripsCard trips={trips} />
          </div>
          
          {/* Ride Requests */}
          <div className="flex-1 p-4 overflow-y-auto">
                        <RideRequestsCard 
              requests={trips.filter(t => t.status === 'ride requested')}
              availableVehicles={vehicles.filter(v => v.status === 'available').map(v => ({
                id: v.id,
                type: v.type || 'default',
                battery: v.battery,
                lat: v.lat,
                lng: v.lng
              }))}
              onAssignVehicle={(requestId, vehicleId) => {
                console.log(`Assigning request ${requestId} to vehicle ${vehicleId}`);
                alert(`Assigned vehicle ${vehicleId} to trip ${requestId}`);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}