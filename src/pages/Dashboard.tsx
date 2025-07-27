import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import MetricsCard from "@/components/MetricsCard";
import VehicleStatusCard from "@/components/VehicleStatusCard";
import ActiveTripsCard from "@/components/ActiveTripsCard";
import FleetMapCard from "@/components/FleetMapCard";
import {
  Car,
  DollarSign,
  Users,
  Clock,
  Settings,
  Bell,
  RefreshCw,
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

  return (
    <div className="min-h-screen bg-gradient-hero p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Tesla Robotaxi Dashboard
            </h1>
            <p className="text-muted-foreground">
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })} • {currentTime.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="teslaGhost" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="teslaGhost" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="tesla">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard
            title="Total Revenue"
            value={`$${totalRevenue.toFixed(2)}`}
            description="Today's earnings"
            icon={DollarSign}
            trend={{ value: 12.5, isPositive: true }}
          />
          <MetricsCard
            title="Active Vehicles"
            value={activeVehicles}
            description={`of ${mockVehicles.length} total`}
            icon={Car}
            trend={{ value: 8.3, isPositive: true }}
          />
          <MetricsCard
            title="Completed Trips"
            value="47"
            description="Today"
            icon={Users}
            trend={{ value: 15.2, isPositive: true }}
          />
          <MetricsCard
            title="Avg Trip Time"
            value="16 min"
            description="Last 24 hours"
            icon={Clock}
            trend={{ value: -2.1, isPositive: false }}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fleet Map */}
          <div className="lg:col-span-2">
            <FleetMapCard />
          </div>

          {/* Active Trips */}
          <div>
            <ActiveTripsCard trips={mockTrips} />
          </div>
        </div>

        {/* Vehicle Status Grid */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Fleet Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockVehicles.map((vehicle) => (
              <VehicleStatusCard
                key={vehicle.vehicleId}
                {...vehicle}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}