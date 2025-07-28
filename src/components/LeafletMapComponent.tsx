import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Vehicle {
  id: string;
  lat: number;
  lng: number;
  status: string;
  battery: number;
  type: string;
  speed?: number;
  route?: Array<{ lat: number; lng: number; timestamp: number }>;
  currentIndex?: number;
}

interface LeafletMapComponentProps {
  vehicles: Vehicle[];
  selectedVehicle?: string | null;
  onVehicleSelect?: (vehicleId: string) => void;
  rideRequests?: Array<{
    id: string;
    pickupLocation: {
      name: string;
      address: string;
      lat: number;
      lng: number;
      type: string;
    };
    destinationLocation: {
      name: string;
      address: string;
      lat: number;
      lng: number;
      type: string;
    };
    passenger: string;
    status: string;
  }>;
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

export default function LeafletMapComponent({ vehicles, selectedVehicle, onVehicleSelect, rideRequests }: LeafletMapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routeLinesRef = useRef<L.Polyline[]>([]);
  const [vehicleRoutes, setVehicleRoutes] = useState<{[key: string]: Array<{ lat: number; lng: number; timestamp: number }>}>({});
  const [loadingRoutes, setLoadingRoutes] = useState<{[key: string]: boolean}>({});

  // Function to fetch route data for a vehicle
  const fetchVehicleRoute = async (vehicleId: string) => {
    setLoadingRoutes(prev => ({ ...prev, [vehicleId]: true }));
    try {
      const response = await fetch(`http://localhost:8000/api/v1/vehicles/${vehicleId}/route`);
      if (response.ok) {
        const routeData = await response.json();
        if (routeData && routeData.waypoints) {
          const waypoints = JSON.parse(routeData.waypoints);
          setVehicleRoutes(prev => ({
            ...prev,
            [vehicleId]: waypoints
          }));
          console.log(`✅ Fetched route for ${vehicleId}:`, waypoints.length, 'points');
        }
      } else {
        // If database is down, generate a mock route
        console.log(`🔄 Database unavailable, generating mock route for ${vehicleId}`);
        const selectedVehicle = vehicles.find(v => v.id === vehicleId);
        if (selectedVehicle) {
          // Generate a simple route from current position to a nearby point
          const mockRoute = [
            { lat: selectedVehicle.lat, lng: selectedVehicle.lng, timestamp: Date.now() },
            { lat: selectedVehicle.lat + 0.01, lng: selectedVehicle.lng + 0.01, timestamp: Date.now() + 60000 },
            { lat: selectedVehicle.lat + 0.02, lng: selectedVehicle.lng + 0.02, timestamp: Date.now() + 120000 },
            { lat: selectedVehicle.lat + 0.03, lng: selectedVehicle.lng + 0.01, timestamp: Date.now() + 180000 },
          ];
          setVehicleRoutes(prev => ({
            ...prev,
            [vehicleId]: mockRoute
          }));
          console.log(`✅ Generated mock route for ${vehicleId}:`, mockRoute.length, 'points');
        }
      }
    } catch (error) {
      console.error(`❌ Error fetching route for ${vehicleId}:`, error);
      // Generate mock route on error too
      const selectedVehicle = vehicles.find(v => v.id === vehicleId);
      if (selectedVehicle) {
        const mockRoute = [
          { lat: selectedVehicle.lat, lng: selectedVehicle.lng, timestamp: Date.now() },
          { lat: selectedVehicle.lat + 0.01, lng: selectedVehicle.lng + 0.01, timestamp: Date.now() + 60000 },
          { lat: selectedVehicle.lat + 0.02, lng: selectedVehicle.lng + 0.02, timestamp: Date.now() + 120000 },
          { lat: selectedVehicle.lat + 0.03, lng: selectedVehicle.lng + 0.01, timestamp: Date.now() + 180000 },
        ];
        setVehicleRoutes(prev => ({
          ...prev,
          [vehicleId]: mockRoute
        }));
        console.log(`✅ Generated mock route for ${vehicleId} (fallback):`, mockRoute.length, 'points');
      }
    } finally {
      setLoadingRoutes(prev => ({ ...prev, [vehicleId]: false }));
    }
  };

  // Fetch route when vehicle is selected
  useEffect(() => {
    if (selectedVehicle && !vehicleRoutes[selectedVehicle]) {
      console.log(`🔄 Fetching route for selected vehicle: ${selectedVehicle}`);
      fetchVehicleRoute(selectedVehicle);
    }
  }, [selectedVehicle, vehicleRoutes]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map centered on Compton, CA
    const map = L.map(mapRef.current).setView([33.8958, -118.2201], 13);
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add Compton boundary (real coordinates from CSV)
    const comptonBoundary = L.polygon([
      [33.90311, -118.26315], [33.90554, -118.26314], [33.90557, -118.26091], [33.9128, -118.26093],
      [33.91283, -118.25446], [33.91732, -118.25434], [33.9173, -118.24504], [33.91782, -118.24504],
      [33.91783, -118.23898], [33.91622, -118.23906], [33.91619, -118.23827], [33.91441, -118.23828],
      [33.91441, -118.23781], [33.91375, -118.23779], [33.91375, -118.2361], [33.90595, -118.2361],
      [33.90742, -118.23062], [33.90773, -118.23078], [33.90781, -118.23037], [33.90752, -118.23028],
      [33.90754, -118.23017], [33.90793, -118.22865], [33.90815, -118.22876], [33.90828, -118.22817],
      [33.90811, -118.22808], [33.90826, -118.22754], [33.9084, -118.22762], [33.90898, -118.22504],
      [33.90872, -118.22271], [33.90883, -118.22237], [33.9198, -118.22409], [33.91983, -118.22803],
      [33.92269, -118.22881], [33.92313, -118.22458], [33.9223, -118.22444], [33.9223, -118.21994],
      [33.92303, -118.21994], [33.92136, -118.21836], [33.91231, -118.21694], [33.91265, -118.21391],
      [33.91306, -118.21384], [33.91062, -118.20641], [33.91262, -118.20583], [33.91059, -118.19849],
      [33.90668, -118.19998], [33.90638, -118.19702], [33.91124, -118.19502], [33.91093, -118.19389],
      [33.90633, -118.19579], [33.90582, -118.19019], [33.9061, -118.1902], [33.90606, -118.18952],
      [33.90734, -118.18932], [33.90707, -118.18674], [33.90537, -118.18705], [33.90564, -118.18964],
      [33.90367, -118.18953], [33.90367, -118.18893], [33.90346, -118.18893], [33.90343, -118.18777],
      [33.90317, -118.18745], [33.90317, -118.1881], [33.90279, -118.1881], [33.90277, -118.18947],
      [33.90222, -118.18943], [33.90223, -118.18893], [33.90196, -118.18893], [33.90196, -118.18842],
      [33.90154, -118.18842], [33.90164, -118.18938], [33.90057, -118.1893], [33.90056, -118.18989],
      [33.8947, -118.18944], [33.89474, -118.18572], [33.89624, -118.18529], [33.89621, -118.18231],
      [33.89425, -118.18225], [33.89427, -118.18169], [33.89262, -118.18159], [33.89273, -118.17995],
      [33.88911, -118.1824], [33.88914, -118.18417], [33.89255, -118.18433], [33.89253, -118.1869],
      [33.88544, -118.18817], [33.8854, -118.18718], [33.88146, -118.18786], [33.88129, -118.20887],
      [33.88083, -118.20887], [33.88082, -118.20852], [33.8748, -118.20857], [33.8748, -118.20814],
      [33.87442, -118.20813], [33.87443, -118.20802], [33.87493, -118.20803], [33.87494, -118.20716],
      [33.87427, -118.20716], [33.87429, -118.2055], [33.8704, -118.20549], [33.87035, -118.20617],
      [33.8729, -118.20691], [33.87372, -118.20697], [33.87357, -118.21611], [33.86951, -118.21546],
      [33.8694, -118.21966], [33.86832, -118.21921], [33.86816, -118.22567], [33.86315, -118.22653],
      [33.86303, -118.23053], [33.86461, -118.23053], [33.86461, -118.23118], [33.86525, -118.2321],
      [33.86655, -118.23216], [33.8665, -118.2342], [33.86734, -118.23424], [33.8673, -118.2356],
      [33.8679, -118.23563], [33.86773, -118.2425], [33.86967, -118.24257], [33.8695, -118.24867],
      [33.87907, -118.24864], [33.87907, -118.24774], [33.88044, -118.24777], [33.88042, -118.24873],
      [33.88202, -118.24874], [33.88187, -118.25381], [33.88026, -118.25343], [33.88003, -118.26125],
      [33.88094, -118.26147], [33.88398, -118.25781], [33.88401, -118.25694], [33.88619, -118.25746],
      [33.88612, -118.25968], [33.88569, -118.25949], [33.88562, -118.25991], [33.88529, -118.25983],
      [33.88525, -118.26116], [33.88609, -118.26136], [33.8861, -118.26087], [33.88667, -118.26101],
      [33.88679, -118.26018], [33.89024, -118.26097], [33.89029, -118.25891], [33.89536, -118.26009],
      [33.89541, -118.25895], [33.89585, -118.25905], [33.8958, -118.25827], [33.89616, -118.25682],
      [33.89626, -118.25247], [33.89768, -118.25278], [33.89768, -118.25243], [33.9028, -118.25376],
      [33.90238, -118.26315], [33.90311, -118.26315]
    ], {
      color: '#e82127',
      weight: 3,
      fillColor: '#e82127',
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

    // Add pickup location markers for ride requests
    if (rideRequests) {
      rideRequests.forEach(request => {
        // Pickup location marker (orange)
        L.marker([request.pickupLocation.lat, request.pickupLocation.lng], {
          icon: L.divIcon({
            className: 'pickup-icon',
            html: `
              <div style="
                width: 16px; 
                height: 16px; 
                background: #f97316; 
                border: 2px solid white; 
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              ">
                <div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
              </div>
            `,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          })
        }).addTo(map).bindPopup(`
          <div style="min-width: 200px;">
            <strong>Pickup Request</strong><br/>
            Passenger: ${request.passenger}<br/>
            Location: ${request.pickupLocation.name}<br/>
            Address: ${request.pickupLocation.address}<br/>
            Type: ${request.pickupLocation.type}
          </div>
        `);

        // Destination marker (purple)
        L.marker([request.destinationLocation.lat, request.destinationLocation.lng], {
          icon: L.divIcon({
            className: 'destination-icon',
            html: `
              <div style="
                width: 16px; 
                height: 16px; 
                background: #a855f7; 
                border: 2px solid white; 
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              ">
                <div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
              </div>
            `,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          })
        }).addTo(map).bindPopup(`
          <div style="min-width: 200px;">
            <strong>Destination</strong><br/>
            Passenger: ${request.passenger}<br/>
            Location: ${request.destinationLocation.name}<br/>
            Address: ${request.destinationLocation.address}<br/>
            Type: ${request.destinationLocation.type}
          </div>
        `);
      });
    }

  }, []);

  // Update vehicle markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Clear existing markers and routes
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    routeLinesRef.current.forEach(line => line.remove());
    routeLinesRef.current = [];

    // Add vehicle markers
    vehicles.forEach(vehicle => {
      const icon = createVehicleIcon(vehicle.type, vehicle.status);
      const marker = L.marker([vehicle.lat, vehicle.lng], { icon })
        .addTo(map);

      // Add click handler to select vehicle
      marker.on('click', () => {
        if (onVehicleSelect) {
          onVehicleSelect(vehicle.id);
        }
      });

      // Add popup with vehicle info
      const popupContent = `
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold;">${vehicle.id}</h3>
          <p style="margin: 4px 0;"><strong>Status:</strong> ${vehicle.status}</p>
          <p style="margin: 4px 0;"><strong>Battery:</strong> ${vehicle.battery}%</p>
          <p style="margin: 4px 0;"><strong>Speed:</strong> ${vehicle.speed || 0} mph</p>
          <p style="margin: 4px 0;"><strong>Location:</strong> ${vehicle.lat.toFixed(4)}, ${vehicle.lng.toFixed(4)}</p>
          <p style="margin: 4px 0;"><strong>Click to view route</strong></p>
        </div>
      `;
      marker.bindPopup(popupContent);

      // Center map on selected vehicle
      if (selectedVehicle === vehicle.id) {
        map.setView([vehicle.lat, vehicle.lng], 15);
      }

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
      
      // Draw route for selected vehicle
      if (selectedVehicle === vehicle.id) {
        const routeData = vehicleRoutes[vehicle.id] || vehicle.route;
        if (routeData && routeData.length > 0) {
          console.log(`Drawing route for ${vehicle.id}:`, routeData.length, 'points');
          
          const routeCoordinates = routeData.map(point => [point.lat, point.lng] as [number, number]);
          console.log('Route coordinates:', routeCoordinates.slice(0, 5), '...');
          
                  const routeLine = L.polyline(routeCoordinates, {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.8,
          dashArray: '10, 5'
        }).addTo(map);

        // Add pulsing animation to the route line
        const routeElement = routeLine.getElement();
        if (routeElement && routeElement instanceof HTMLElement) {
          routeElement.style.animation = 'routePulse 2s ease-in-out infinite';
        }
          
          // Add route info popup
          routeLine.bindPopup(`
            <div style="min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold;">${vehicle.id} Route</h3>
              <p style="margin: 4px 0;"><strong>Status:</strong> ${vehicle.status}</p>
              <p style="margin: 4px 0;"><strong>Route Points:</strong> ${routeData.length}</p>
              <p style="margin: 4px 0;"><strong>Current Position:</strong> ${vehicle.currentIndex || 0}/${routeData.length}</p>
              <p style="margin: 4px 0;"><strong>Start:</strong> ${routeCoordinates[0]?.join(', ')}</p>
              <p style="margin: 4px 0;"><strong>End:</strong> ${routeCoordinates[routeCoordinates.length - 1]?.join(', ')}</p>
            </div>
          `);
          
          routeLinesRef.current.push(routeLine);
        }
      }
    });

  }, [vehicles, selectedVehicle]);

  return (
    <div className="absolute inset-4 bg-gradient-to-br from-tesla-gray to-tesla-gray-light rounded-lg border border-border overflow-hidden">
      <style>
        {`
          @keyframes routePulse {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 0.4; }
          }
        `}
      </style>
      <div className="absolute top-4 left-4 z-10 bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-foreground">Compton, CA Fleet</h3>
          {selectedVehicle && (
            <button 
              onClick={() => onVehicleSelect && onVehicleSelect('')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear Route
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
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
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span>Pickup</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>Destination</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span>Landmarks</span>
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
          {selectedVehicle && loadingRoutes[selectedVehicle] && (
            <div className="mt-1 text-xs text-blue-500">
              Loading route...
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 