import { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

interface Vehicle {
  id: string;
  lat: number;
  lng: number;
  status: string;
  battery: number;
  route?: Array<{lat: number; lng: number; timestamp: number}>;
  pickup?: {lat: number; lng: number; name: string};
  destination?: {lat: number; lng: number; name: string};
}

interface MapComponentProps {
  vehicles: Vehicle[];
  selectedVehicle?: string | null;
}

// Compton, CA boundary coordinates (approximate)
const COMPTON_BOUNDARY = [
  { lat: 33.896, lng: -118.235 }, // Northwest
  { lat: 33.896, lng: -118.185 }, // Northeast  
  { lat: 33.856, lng: -118.185 }, // Southeast
  { lat: 33.856, lng: -118.235 }, // Southwest
];

// Compton landmarks
const COMPTON_LANDMARKS = [
  { name: "Compton City Hall", lat: 33.8958, lng: -118.2201 },
  { name: "Compton College", lat: 33.8897, lng: -118.2189 },
  { name: "Compton Airport", lat: 33.8889, lng: -118.2350 },
  { name: "Compton Creek", lat: 33.8700, lng: -118.2100 },
];

export default function MapComponent({ vehicles, selectedVehicle }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Create SVG map
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 800 600');
    
    // Clear previous content
    mapRef.current.innerHTML = '';
    mapRef.current.appendChild(svg);

    // Draw Compton boundary
    const boundaryPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const boundaryCoords = COMPTON_BOUNDARY.map((coord, index) => {
      const x = ((coord.lng + 118.235) / 0.05) * 800;
      const y = ((33.896 - coord.lat) / 0.04) * 600;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ') + ' Z';
    
    boundaryPath.setAttribute('d', boundaryCoords);
    boundaryPath.setAttribute('fill', 'rgba(59, 130, 246, 0.1)');
    boundaryPath.setAttribute('stroke', 'rgb(59, 130, 246)');
    boundaryPath.setAttribute('stroke-width', '2');
    svg.appendChild(boundaryPath);

    // Draw landmarks
    COMPTON_LANDMARKS.forEach(landmark => {
      const x = ((landmark.lng + 118.235) / 0.05) * 800;
      const y = ((33.896 - landmark.lat) / 0.04) * 600;
      
      const landmarkGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x.toString());
      circle.setAttribute('cy', y.toString());
      circle.setAttribute('r', '4');
      circle.setAttribute('fill', 'rgb(34, 197, 94)');
      circle.setAttribute('stroke', 'white');
      circle.setAttribute('stroke-width', '1');
      
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', (x + 8).toString());
      text.setAttribute('y', (y - 8).toString());
      text.setAttribute('font-size', '10');
      text.setAttribute('fill', 'rgb(34, 197, 94)');
      text.setAttribute('font-weight', 'bold');
      text.textContent = landmark.name;
      
      landmarkGroup.appendChild(circle);
      landmarkGroup.appendChild(text);
      svg.appendChild(landmarkGroup);
    });

    // Draw vehicles and their routes
    vehicles.forEach(vehicle => {
      // Draw route line if vehicle has a route
      if (vehicle.route && vehicle.route.length > 0) {
        const routePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const routeCoords = vehicle.route.map((point, index) => {
          const x = ((point.lng + 118.235) / 0.05) * 800;
          const y = ((33.896 - point.lat) / 0.04) * 600;
          return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
        
        routePath.setAttribute('d', routeCoords);
        routePath.setAttribute('fill', 'none');
        routePath.setAttribute('stroke', 'rgba(59, 130, 246, 0.6)');
        routePath.setAttribute('stroke-width', '2');
        routePath.setAttribute('stroke-dasharray', '5,5');
        svg.appendChild(routePath);
      }
      
      const x = ((vehicle.lng + 118.235) / 0.05) * 800;
      const y = ((33.896 - vehicle.lat) / 0.04) * 600;
      
      const vehicleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x.toString());
      circle.setAttribute('cy', y.toString());
      circle.setAttribute('r', selectedVehicle === vehicle.id ? '8' : '6');
      circle.setAttribute('fill', 
        vehicle.status === 'busy' ? 'rgb(59, 130, 246)' : // Blue for driving
        vehicle.status === 'charging' ? 'rgb(34, 197, 94)' : // Green for charging
        'rgb(156, 163, 175)' // Gray for available/idle
      );
      circle.setAttribute('stroke', selectedVehicle === vehicle.id ? 'rgb(59, 130, 246)' : 'white');
      circle.setAttribute('stroke-width', selectedVehicle === vehicle.id ? '3' : '2');
      
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x.toString());
      text.setAttribute('y', (y - 12).toString());
      text.setAttribute('font-size', '8');
      text.setAttribute('fill', 'white');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-weight', 'bold');
      text.textContent = vehicle.id.split('-')[1]; // Show just the number
      
      vehicleGroup.appendChild(circle);
      vehicleGroup.appendChild(text);
      svg.appendChild(vehicleGroup);
    });

  }, [vehicles, selectedVehicle]);

  return (
    <div className="absolute inset-4 bg-gradient-to-br from-tesla-gray to-tesla-gray-light rounded-lg border border-border overflow-hidden">
      <div className="absolute top-4 left-4 z-10 bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-border">
        <h3 className="text-sm font-medium text-foreground mb-2">Compton, CA Fleet</h3>
        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Driving</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Charging</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span>Available</span>
          </div>
        </div>
      </div>
      
      <div ref={mapRef} className="w-full h-full" />
      
      <div className="absolute bottom-4 right-4 z-10 bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-border">
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center space-x-2">
            <MapPin className="h-3 w-3" />
            <span>Routing Ready</span>
          </div>
          <div className="mt-1 text-xs">
            {vehicles.length} vehicles
          </div>
        </div>
      </div>
    </div>
  );
} 