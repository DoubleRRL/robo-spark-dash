import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Vehicle {
  id: string;
  lat: number;
  lng: number;
  status: string;
  battery: number;
  type: string;
}

interface LeafletMapComponentProps {
  vehicles: Vehicle[];
  selectedVehicle?: string | null;
}

// Fix for default markers in leaflet
delete (L.Icon.Default.prototype as { _getIconUrl?: string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom vehicle icons
const createVehicleIcon = (type: string, status: string) => {
  const iconUrl = type === 'cybertruck' ? '/cybertruck.png' :
                  type === 'modely' ? '/model y.png' :
                  type === 'modelx' ? '/model x.png' : '/cybertruck.png';
  
  const color = status === 'busy' ? '#3b82f6' : // Blue for driving
                status === 'charging' ? '#22c55e' : // Green for charging
                '#9ca3af'; // Gray for available
  
  return L.divIcon({
    className: 'custom-vehicle-icon',
    html: `
      <div style="
        width: 32px; 
        height: 32px; 
        background: ${color}; 
        border: 2px solid white; 
        border-radius: 50%; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        <img src="${iconUrl}" style="width: 20px; height: 20px; object-fit: contain;" />
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export default function LeafletMapComponent({ vehicles, selectedVehicle }: LeafletMapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map centered on Compton, CA
    const map = L.map(mapRef.current).setView([33.8958, -118.2201], 13);
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add Compton boundary
    const comptonBoundary = L.polygon([
      [33.896, -118.235], // Northwest
      [33.896, -118.185], // Northeast
      [33.856, -118.185], // Southeast
      [33.856, -118.235], // Southwest
    ], {
      color: '#3b82f6',
      weight: 2,
      fillColor: '#3b82f6',
      fillOpacity: 0.1
    }).addTo(map);

    // Add Compton landmarks
    const landmarks = [
      { name: "Compton City Hall", lat: 33.8958, lng: -118.2201 },
      { name: "Compton College", lat: 33.8897, lng: -118.2189 },
      { name: "Compton Airport", lat: 33.8889, lng: -118.2350 },
      { name: "Compton Creek", lat: 33.8700, lng: -118.2100 },
    ];

    landmarks.forEach(landmark => {
      const marker = L.marker([landmark.lat, landmark.lng])
        .bindPopup(landmark.name)
        .addTo(map);
      
      // Custom landmark icon
      const landmarkIcon = L.divIcon({
        className: 'landmark-icon',
        html: `
          <div style="
            width: 16px; 
            height: 16px; 
            background: #22c55e; 
            border: 2px solid white; 
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          "></div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      marker.setIcon(landmarkIcon);
    });

  }, []);

  // Update vehicle markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add vehicle markers
    vehicles.forEach(vehicle => {
      const icon = createVehicleIcon(vehicle.type, vehicle.status);
      const marker = L.marker([vehicle.lat, vehicle.lng], { icon })
        .addTo(map);

      // Add popup with vehicle info
      const popupContent = `
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold;">${vehicle.id}</h3>
          <p style="margin: 4px 0;"><strong>Status:</strong> ${vehicle.status}</p>
          <p style="margin: 4px 0;"><strong>Battery:</strong> ${vehicle.battery}%</p>
          <p style="margin: 4px 0;"><strong>Location:</strong> ${vehicle.lat.toFixed(4)}, ${vehicle.lng.toFixed(4)}</p>
        </div>
      `;
      marker.bindPopup(popupContent);

      // Highlight selected vehicle
      if (selectedVehicle === vehicle.id) {
        marker.setZIndexOffset(1000);
        const highlightIcon = L.divIcon({
          className: 'selected-vehicle-icon',
          html: `
            <div style="
              width: 40px; 
              height: 40px; 
              background: #3b82f6; 
              border: 3px solid #1d4ed8; 
              border-radius: 50%; 
              display: flex; 
              align-items: center; 
              justify-content: center;
              box-shadow: 0 4px 8px rgba(0,0,0,0.4);
            ">
              <img src="/${vehicle.type === 'cybertruck' ? 'cybertruck.png' : 
                           vehicle.type === 'modely' ? 'model y.png' : 
                           vehicle.type === 'modelx' ? 'model x.png' : 'cybertruck.png'}" 
                   style="width: 24px; height: 24px; object-fit: contain;" />
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });
        marker.setIcon(highlightIcon);
      }

      markersRef.current.push(marker);
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
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>OSRM Ready</span>
          </div>
          <div className="mt-1 text-xs">
            {vehicles.length} vehicles active
          </div>
        </div>
      </div>
    </div>
  );
} 