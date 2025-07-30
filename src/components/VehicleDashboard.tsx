import React from 'react';
import { useSocket } from '../hooks/useSocket';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Car, 
  Battery, 
  Gauge, 
  MapPin, 
  Clock, 
  Wifi, 
  WifiOff,
  Navigation
} from 'lucide-react';

export const VehicleDashboard: React.FC = () => {
  const { isConnected, vehicles, lastUpdate } = useSocket();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'charging':
        return 'bg-blue-500';
      case 'maintenance':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getVehicleIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cybertruck':
        return '🚗';
      case 'modely':
        return '🚙';
      case 'modelx':
        return '🚐';
      default:
        return '🚗';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="h-5 w-5 text-green-500" />
                Connected to Vehicle Network
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-red-500" />
                Disconnected
              </>
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getVehicleIcon(vehicle.type)}</span>
                  <span className="text-sm font-mono">{vehicle.id}</span>
                </div>
                <Badge 
                  variant="secondary" 
                  className={`${getStatusColor(vehicle.status)} text-white`}
                >
                  {vehicle.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Battery */}
              <div className="flex items-center gap-2">
                <Battery className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Battery</span>
                <Progress value={vehicle.battery} className="flex-1" />
                <span className="text-sm font-mono">{Math.round(vehicle.battery)}%</span>
              </div>

              {/* Speed */}
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-green-500" />
                <span className="text-sm">Speed</span>
                <span className="text-sm font-mono ml-auto">{vehicle.speed} mph</span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-500" />
                <span className="text-sm">Location</span>
                <span className="text-sm font-mono ml-auto">
                  {vehicle.lat.toFixed(4)}, {vehicle.lng.toFixed(4)}
                </span>
              </div>

              {/* ETA */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-500" />
                <span className="text-sm">ETA</span>
                <span className="text-sm font-mono ml-auto">{vehicle.eta}</span>
              </div>

              {/* Progress */}
              {vehicle.progress > 0 && (
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Progress</span>
                  <Progress value={vehicle.progress} className="flex-1" />
                  <span className="text-sm font-mono">{vehicle.progress}%</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Vehicles Message */}
      {vehicles.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <Car className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="text-gray-500">No vehicles connected</p>
              <p className="text-sm text-gray-400">
                {isConnected ? 'Waiting for vehicle updates...' : 'Check your connection'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Update Info */}
      {lastUpdate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Last Update</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Vehicle {lastUpdate.id} updated at {new Date().toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 