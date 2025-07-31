import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Navigation } from "lucide-react";

export default function FleetMapCard() {
  return (
    <Card className="bg-gradient-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center">
          <Navigation className="mr-2 h-5 w-5 text-tesla-blue" />
          Fleet Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-64 bg-tesla-gray rounded-lg overflow-hidden">
          {/* Mock map interface */}
          <div className="absolute inset-0 bg-gradient-to-br from-tesla-gray to-tesla-gray-light">
            <div className="absolute inset-0 opacity-20">
              <svg
                viewBox="0 0 400 256"
                className="w-full h-full"
                style={{ filter: "invert(1) opacity(0.1)" }}
              >
                {/* Mock street lines */}
                <line x1="0" y1="80" x2="400" y2="80" stroke="currentColor" strokeWidth="1" />
                <line x1="0" y1="160" x2="400" y2="160" stroke="currentColor" strokeWidth="1" />
                <line x1="100" y1="0" x2="100" y2="256" stroke="currentColor" strokeWidth="1" />
                <line x1="200" y1="0" x2="200" y2="256" stroke="currentColor" strokeWidth="1" />
                <line x1="300" y1="0" x2="300" y2="256" stroke="currentColor" strokeWidth="1" />
              </svg>
            </div>
            
            {/* Mock vehicle markers */}
            <div className="absolute top-8 left-12">
              <div className="w-3 h-3 bg-tesla-green rounded-full animate-pulse shadow-lg"></div>
            </div>
            <div className="absolute top-20 left-32">
              <div className="w-3 h-3 bg-tesla-blue rounded-full animate-pulse shadow-lg"></div>
            </div>
            <div className="absolute top-32 left-48">
              <div className="w-3 h-3 bg-tesla-green rounded-full animate-pulse shadow-lg"></div>
            </div>
            <div className="absolute bottom-16 right-20">
              <div className="w-3 h-3 bg-tesla-blue rounded-full animate-pulse shadow-lg"></div>
            </div>
            <div className="absolute bottom-8 right-40">
              <div className="w-3 h-3 bg-muted rounded-full shadow-lg"></div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 space-y-1">
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-2 h-2 bg-tesla-green rounded-full"></div>
              <span className="text-foreground">Active</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-2 h-2 bg-tesla-blue rounded-full"></div>
              <span className="text-foreground">En Route</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-2 h-2 bg-muted rounded-full"></div>
              <span className="text-foreground">Idle</span>
            </div>
          </div>
          
          {/* Stats overlay */}
          <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Fleet Status</div>
            <div className="text-sm font-medium text-foreground">12 vehicles online</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}