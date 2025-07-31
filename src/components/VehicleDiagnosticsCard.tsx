import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, XCircle, Info, Battery, Camera, Gauge, Car } from 'lucide-react';

interface VehicleDiagnosticsCardProps {
  diagnostics: any | null;
  vehicleType?: string;
  battery?: number;
}

// Tesla vehicle specifications for range calculation
const VEHICLE_SPECS = {
  'modelx': { epaRange: 348, tirePressure: 42 }, // Model X EPA range in miles
  'modely': { epaRange: 330, tirePressure: 42 }, // Model Y EPA range in miles  
  'cybertruck': { epaRange: 320, tirePressure: 50 }, // Cybertruck EPA range in miles
  'default': { epaRange: 330, tirePressure: 42 }
};

export default function VehicleDiagnosticsCard({ diagnostics, vehicleType = 'default', battery = 0 }: VehicleDiagnosticsCardProps) {
  if (!diagnostics) {
    return (
      <Card className="bg-gradient-card border-border h-full flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center space-x-2">
            <Car className="h-4 w-4" />
            <span>Vehicle Diagnostics</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground py-8">
            <Car className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No diagnostic data available</p>
            <p className="text-xs">Select a vehicle to view diagnostics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const specs = VEHICLE_SPECS[vehicleType as keyof typeof VEHICLE_SPECS] || VEHICLE_SPECS.default;
  const estimatedRange = (battery / 100) * specs.epaRange;
  const needsCharging = battery <= 20;
  const cameraOccluded = diagnostics.cameraOcclusion === 'bad';
  // 25% chance to have 1-4 FSD errors on instance launch
  const fsdErrors = Math.random() < 0.25 ? Math.floor(Math.random() * 4) + 1 : 0;

  return (
    <Card className="bg-gradient-card border-border h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Car className="h-4 w-4" />
            <span>Vehicle Diagnostics</span>
          </div>
          <Badge 
            variant={needsCharging ? 'destructive' : battery >= 80 ? 'default' : 'secondary'}
            className="text-xs"
          >
            {needsCharging ? 'LOW BATTERY' : `${battery}%`}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto space-y-4">
        {/* Battery Status */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Battery className="h-4 w-4 text-blue-500" />
            <h4 className="text-sm font-medium">Battery & Range</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Charge Level</span>
              <span className="text-sm font-medium">{Math.floor(battery)}%</span>
            </div>
            <Progress value={battery} className="h-2" />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Estimated Range</span>
              <span className="text-sm font-medium">{estimatedRange.toFixed(0)} mi</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">EPA Range</span>
              <span className="text-sm font-medium">{specs.epaRange} mi</span>
            </div>
            {needsCharging && (
              <div className="p-2 bg-red-500/10 border border-red-500/20 rounded">
                <div className="text-xs text-red-600 font-medium flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Vehicle will go to charging station</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Camera Status */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Camera className="h-4 w-4 text-green-500" />
            <h4 className="text-sm font-medium">Camera System</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Status</span>
              <Badge 
                variant={cameraOccluded ? 'destructive' : 'default'}
                className="text-xs"
              >
                {cameraOccluded ? 'OCCLUDED' : 'GOOD'}
              </Badge>
            </div>
            {cameraOccluded && (
              <div className="p-2 bg-red-500/10 border border-red-500/20 rounded">
                <div className="text-xs text-red-600 font-medium flex items-center space-x-1">
                  <XCircle className="h-3 w-3" />
                  <span>Remove from fleet - camera blocked</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tire Pressure */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Gauge className="h-4 w-4 text-orange-500" />
            <h4 className="text-sm font-medium">Tire Pressure</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Target PSI</span>
              <span className="text-sm font-medium">{specs.tirePressure} PSI</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[1, 2, 3, 4].map((tire) => {
                const pressure = diagnostics.tirePressure?.[tire - 1] || specs.tirePressure;
                const isLow = pressure < (specs.tirePressure * 0.9);
                return (
                  <div key={tire} className="text-center">
                    <div className={`text-xs font-medium ${isLow ? 'text-red-500' : 'text-green-500'}`}>
                      {pressure.toFixed(0)}
                    </div>
                    <div className="text-xs text-muted-foreground">T{tire}</div>
                  </div>
                );
              })}
            </div>
            {diagnostics.tirePressure?.some((p: number) => p < (specs.tirePressure * 0.9)) && (
              <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                <div className="text-xs text-yellow-600 font-medium flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Low tire pressure detected</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FSD Errors */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <h4 className="text-sm font-medium">FSD Actions for Review</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Error Count</span>
              <span className="text-sm font-medium">{fsdErrors}</span>
            </div>
            {fsdErrors > 0 && (
              <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                <div className="text-xs text-yellow-600 font-medium flex items-center space-x-1">
                  <Info className="h-3 w-3" />
                  <span>Review recommended</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Diagnostics */}
        {diagnostics.motorTemperature && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Motor Temperature</h4>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Current</span>
              <span className="text-sm font-medium">{diagnostics.motorTemperature.toFixed(1)}°C</span>
            </div>
          </div>
        )}

        {/* Alerts */}
        {diagnostics.alerts && diagnostics.alerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Active Alerts</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {diagnostics.alerts.map((alert: any, index: number) => (
                <div key={index} className="p-2 bg-background/50 rounded border text-xs">
                  <div className="font-medium">{alert.message}</div>
                  {alert.recommendedAction && (
                    <div className="text-muted-foreground mt-1">{alert.recommendedAction}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 