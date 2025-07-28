import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { VehicleDiagnostics, RemoteDiagnostics } from '@/utils/vehicleDiagnostics';

interface VehicleDiagnosticsCardProps {
  diagnostics: VehicleDiagnostics | null;
}

export default function VehicleDiagnosticsCard({ diagnostics }: VehicleDiagnosticsCardProps) {
  if (!diagnostics) {
    return (
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle>Vehicle Diagnostics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No diagnostic data available for this vehicle
          </div>
        </CardContent>
      </Card>
    );
  }

  const healthAnalysis = diagnostics ? RemoteDiagnostics.analyzeVehicleHealth(diagnostics) : { overallHealth: 0 };
  const maintenanceSchedule = diagnostics ? RemoteDiagnostics.generateMaintenanceSchedule(diagnostics) : [];
  const troubleshooting = diagnostics ? RemoteDiagnostics.remoteTroubleshoot(diagnostics) : [];

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 80) return 'text-green-500';
    if (health >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card className="bg-gradient-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Vehicle Diagnostics</span>
          <Badge 
            variant={healthAnalysis.overallHealth >= 80 ? 'default' : 
                    healthAnalysis.overallHealth >= 60 ? 'secondary' : 'destructive'}
          >
            Health: {healthAnalysis.overallHealth}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Health */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Health</span>
            <span className={`text-sm font-bold ${getHealthColor(healthAnalysis.overallHealth)}`}>
              {healthAnalysis.overallHealth}%
            </span>
          </div>
          <Progress value={healthAnalysis.overallHealth} className="h-2" />
        </div>

        {/* Battery Status */}
        {diagnostics && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Battery</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Level:</span>
                  <span>{diagnostics.battery?.level || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Health:</span>
                  <Badge variant="outline" className="text-xs">
                    {diagnostics.battery?.health || 'Unknown'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Temperature:</span>
                  <span>{(diagnostics.battery?.temperature || 0).toFixed(1)}°C</span>
                </div>
                <div className="flex justify-between">
                  <span>Range:</span>
                  <span>{(diagnostics.battery?.estimatedRange || 0).toFixed(0)} mi</span>
                </div>
              </div>
            </div>

            {/* Autonomous Systems */}
            <div>
              <h4 className="text-sm font-medium mb-2">Autonomous Systems</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>LiDAR:</span>
                  <Badge 
                    variant={diagnostics.autonomy?.lidarStatus === 'operational' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {diagnostics.autonomy?.lidarStatus || 'Unknown'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Camera:</span>
                  <Badge 
                    variant={diagnostics.autonomy?.cameraStatus === 'operational' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {diagnostics.autonomy?.cameraStatus || 'Unknown'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Radar:</span>
                  <Badge 
                    variant={diagnostics.autonomy?.radarStatus === 'operational' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {diagnostics.autonomy?.radarStatus || 'Unknown'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>GPS Accuracy:</span>
                  <span>{(diagnostics.autonomy?.gpsAccuracy || 0).toFixed(1)}m</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mechanical Systems */}
        <div>
          <h4 className="text-sm font-medium mb-2">Mechanical Systems</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span>Tire Pressure:</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {(diagnostics.mechanical?.tirePressure || [32, 32, 32, 32]).map((pressure, index) => (
                  <div key={index} className="text-center">
                    <div className={`text-xs ${pressure < 30 ? 'text-red-500' : 'text-green-500'}`}>
                      {pressure.toFixed(0)} PSI
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between">
                <span>Motor Temp:</span>
                <span>{(diagnostics.mechanical?.motorTemperature || 0).toFixed(1)}°C</span>
              </div>
              <div className="flex justify-between">
                <span>Transmission:</span>
                <Badge 
                  variant={diagnostics.mechanical?.transmissionStatus === 'normal' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {diagnostics.mechanical?.transmissionStatus || 'Unknown'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div>
          <h4 className="text-sm font-medium mb-2">Performance</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="flex justify-between">
                <span>Efficiency Score:</span>
                <span>{(diagnostics.performance?.efficiencyScore || 0).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Speed:</span>
                <span>{(diagnostics.performance?.averageSpeed || 0).toFixed(0)} mph</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between">
                <span>Harsh Events:</span>
                <span>{(diagnostics.performance?.accelerationEvents || 0) + (diagnostics.performance?.brakingEvents || 0) + (diagnostics.performance?.corneringEvents || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(diagnostics.alerts?.length || 0) > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Active Alerts</h4>
            <div className="space-y-2">
              {(diagnostics.alerts || []).map((alert) => (
                <div key={alert.id} className="flex items-start space-x-2 p-2 bg-background/50 rounded border">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="text-xs font-medium">{alert.message}</div>
                    <div className="text-xs text-muted-foreground">{alert.recommendedAction}</div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {alert.category}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Maintenance Recommendations */}
        {healthAnalysis.recommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Recommendations</h4>
            <div className="space-y-1">
              {healthAnalysis.recommendations.map((rec, index) => (
                <div key={index} className="text-xs text-muted-foreground flex items-center space-x-2">
                  <Info className="h-3 w-3" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Remote Troubleshooting */}
        <div>
          <h4 className="text-sm font-medium mb-2">Remote Actions</h4>
          <div className="space-y-1">
            {troubleshooting.actions.map((action, index) => (
              <div key={index} className="text-xs text-muted-foreground flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>{action}</span>
              </div>
            ))}
          </div>
          {troubleshooting.requiresTechnician && (
            <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
              <div className="text-xs text-yellow-600 font-medium">
                ⚠️ Technician required for some issues
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 