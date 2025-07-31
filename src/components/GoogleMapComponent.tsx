import { useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polygon, DirectionsRenderer, Polyline } from '@react-google-maps/api';
import { mapsConfig } from '../config/maps';
import { COMPTON_POLYGON } from '../utils/vehicleRouting';

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
  pickup?: { lat: number; lng: number; name: string };
  destination?: { lat: number; lng: number; name: string };
  eta?: string; // Added for ETA
  diagnostics?: any; // Add diagnostics field
}

interface GoogleMapComponentProps {
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

// Convert the COMPTON_POLYGON format to Google Maps format
const COMPTON_BOUNDARY_COORDS = COMPTON_POLYGON.map(([lat, lng]) => ({ lat, lng }));

// Calculate Compton bounds from the polygon
const getComptonBounds = () => {
  const lats = COMPTON_POLYGON.map(([lat]) => lat);
  const lngs = COMPTON_POLYGON.map(([, lng]) => lng);
  
  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs)
  };
};

const COMPTON_BOUNDS = getComptonBounds();

// Define center of Compton area - using actual city center coordinates
const COMPTON_CENTER = { lat: 33.8958, lng: -118.2201 };

// Define landmarks to show on the map
const COMPTON_LANDMARKS = [
  { name: "Compton City Hall", lat: 33.8958, lng: -118.2201 },
  { name: "Compton College", lat: 33.8897, lng: -118.2189 },
  { name: "Compton Airport", lat: 33.8889, lng: -118.2350 },
  { name: "Compton Creek", lat: 33.8700, lng: -118.2100 },
];

export default function GoogleMapComponent({ vehicles, selectedVehicle, onVehicleSelect, rideRequests }: GoogleMapComponentProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: mapsConfig.googleMaps.apiKey,
    libraries: ['places']
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [infoWindow, setInfoWindow] = useState<{
    position: { lat: number; lng: number };
    content: string;
    vehicleId?: string;
    isOpen: boolean;
  } | null>(null);

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [selectedVehicleData, setSelectedVehicleData] = useState<Vehicle | null>(null);
  const [cameraTracking, setCameraTracking] = useState(false);
  
  // Add directions state
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);

  // Load vehicle data for selected vehicle
  useEffect(() => {
    if (selectedVehicle) {
      const vehicle = vehicles.find(v => v.id === selectedVehicle);
      setSelectedVehicleData(vehicle || null);
    } else {
      setSelectedVehicleData(null);
    }
  }, [selectedVehicle, vehicles]);

  // Map initialization callback
  const onLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    setMap(map);
    setMapInitialized(true);

    // Set map options
    map.setOptions({
      mapTypeControl: mapsConfig.googleMaps.mapOptions.mapTypeControl,
      streetViewControl: mapsConfig.googleMaps.mapOptions.streetViewControl,
      fullscreenControl: mapsConfig.googleMaps.mapOptions.fullscreenControl,
      // Restrict map to Compton area
      restriction: {
        latLngBounds: COMPTON_BOUNDS,
        strictBounds: false,
      },
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    // Fit map to Compton bounds
    const bounds = new google.maps.LatLngBounds(
      { lat: COMPTON_BOUNDS.south, lng: COMPTON_BOUNDS.west },
      { lat: COMPTON_BOUNDS.north, lng: COMPTON_BOUNDS.east }
    );
    map.fitBounds(bounds);
  };

  // Unload handler
  const onUnmount = () => {
    mapRef.current = null;
    setMap(null);
  };

  // Smooth camera tracking for selected vehicle
  useEffect(() => {
    if (map && selectedVehicleData && cameraTracking && !infoWindow?.isOpen) {
      // Use smooth panning with easing for better tracking
      const currentCenter = map.getCenter();
      const targetPosition = { lat: selectedVehicleData.lat, lng: selectedVehicleData.lng };
      
      // Only pan if the vehicle has moved significantly
      if (currentCenter) {
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
          currentCenter,
          targetPosition
        );
        
        if (distance > 50) { // Only pan if vehicle moved more than 50 meters
          map.panTo(targetPosition);
        }
      }
    }
  }, [map, selectedVehicleData, cameraTracking, infoWindow?.isOpen]);

  // New effect to calculate directions for selected vehicle
  useEffect(() => {
    if (!map || !selectedVehicleData) {
      setDirectionsResponse(null);
      return;
    }

    console.log('Selected vehicle data:', selectedVehicleData);
    
    // Check if vehicle has a route
    const hasRoute = selectedVehicleData.route && selectedVehicleData.route.length > 1;
    
    // Check if vehicle has pickup and destination locations
    const hasPickupAndDestination = selectedVehicleData.pickup && selectedVehicleData.destination;
    
    // If no route information is available
    if (!hasRoute && !hasPickupAndDestination) {
      console.log('No route or pickup/destination info available');
      setDirectionsResponse(null);
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    
    // Determine origin and destination
    let origin, destination;
    
    if (hasRoute) {
      // Use route points
      origin = { 
        lat: selectedVehicleData.route![0].lat, 
        lng: selectedVehicleData.route![0].lng 
      };
      destination = { 
        lat: selectedVehicleData.route![selectedVehicleData.route!.length - 1].lat, 
        lng: selectedVehicleData.route![selectedVehicleData.route!.length - 1].lng 
      };
    } else {
      // Use vehicle position as origin and destination from properties
      origin = { lat: selectedVehicleData.lat, lng: selectedVehicleData.lng };
      destination = { 
        lat: selectedVehicleData.destination!.lat, 
        lng: selectedVehicleData.destination!.lng 
      };
    }
    
    console.log('Calculating directions from', origin, 'to', destination);
    
    // Use DirectionsService to get a route
    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
        avoidHighways: false,
        avoidTolls: false,
        optimizeWaypoints: true
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          console.log('Directions calculated successfully', result);
          setDirectionsResponse(result);
        } else {
          console.error('Error calculating directions:', status);
          
          // If directions service fails, create a simple polyline from route points as fallback
          if (hasRoute) {
            console.log('Using route points as fallback');
            // We'll rely on the fallback polyline display
          } else {
            console.error('Cannot display route - directions failed and no route points available');
          }
          setDirectionsResponse(null);
        }
      }
    );
  }, [map, selectedVehicleData]);

  // Create icon for vehicle based on type and status
  const getVehicleIcon = (vehicle: Vehicle): google.maps.Icon => {
    // Determine the correct image file based on vehicle type
    let iconUrl = '/cybertruck.png'; // default
    
    if (vehicle.type === 'Cybertruck') {
      iconUrl = '/cybertruck.png';
    } else if (vehicle.type === 'Model Y') {
      iconUrl = '/model y.png';
    } else if (vehicle.type === 'Model X') {
      iconUrl = '/model x.png';
    }

    // Size based on selection status - made much larger with proper aspect ratio
    const size = selectedVehicle === vehicle.id ? 80 : 64;

    return {
      url: iconUrl,
      scaledSize: new google.maps.Size(size, size), // Keep 1:1 aspect ratio
      anchor: new google.maps.Point(size / 2, size / 2), // Center the icon
    };
  };

  // Handle vehicle click
  const handleVehicleClick = (vehicle: Vehicle) => {
    if (onVehicleSelect) {
      onVehicleSelect(vehicle.id);
    }

    // Debug log to see vehicle data
    console.log('Vehicle clicked:', vehicle);
    console.log('Vehicle type:', vehicle.type);

    // Create more descriptive and visually appealing infowindow
    const vehicleTypeDisplay = 
      vehicle.type === 'cybertruck' ? 'Cybertruck' :
      vehicle.type === 'modely' ? 'Model Y' :
      vehicle.type === 'modelx' ? 'Model X' : 
      'Unknown';
    
    const statusDisplay = 
      vehicle.status === 'busy' ? 'En Route' :
      vehicle.status === 'available' ? 'Available' :
      vehicle.status === 'charging' ? 'Charging' :
      vehicle.status === 'picking-up' ? 'Picking Up' :
      vehicle.status === 'en-route-to-charging' ? 'Going to Charge' :
      vehicle.status || 'Unknown';

    // Enhanced info window with diagnostics data
    const diagnostics = vehicle.diagnostics || {};
    const specs = {
      'modelx': { epaRange: 348, tirePressure: 42 },
      'modely': { epaRange: 330, tirePressure: 42 },
      'cybertruck': { epaRange: 320, tirePressure: 50 },
      'default': { epaRange: 330, tirePressure: 42 }
    };
    const vehicleSpecs = specs[vehicle.type as keyof typeof specs] || specs.default;
    const estimatedRange = (vehicle.battery / 100) * vehicleSpecs.epaRange;
    const needsCharging = vehicle.battery <= 20;
    const cameraOccluded = diagnostics.cameraOcclusion === 'bad';
    const fsdErrors = diagnostics.fsdErrors || 0;
    const motorTemp = diagnostics.motorTemperature || 0;
    
    setInfoWindow({
      position: { lat: vehicle.lat, lng: vehicle.lng },
      content: `
        <div style="min-width: 280px; padding: 8px; font-family: system-ui, -apple-system, sans-serif;">
          <h3 style="margin: 0 0 12px 0; font-weight: bold; color: #3b82f6; font-size: 16px;">${vehicle.id}</h3>
          
          <!-- Basic Info -->
          <div style="margin-bottom: 12px; padding: 8px; background: #f8fafc; border-radius: 6px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-weight: 600; color: #374151;">Type:</span>
              <span style="color: #6b7280;">${vehicleTypeDisplay}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-weight: 600; color: #374151;">Status:</span>
              <span style="color: #6b7280;">${statusDisplay}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-weight: 600; color: #374151;">Speed:</span>
              <span style="color: #6b7280;">${Math.round(vehicle.speed || 0)} mph</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="font-weight: 600; color: #374151;">ETA:</span>
              <span style="color: #6b7280;">${vehicle.eta || 'N/A'}</span>
            </div>
          </div>
          
          <!-- Battery & Range -->
          <div style="margin-bottom: 12px; padding: 8px; background: #f8fafc; border-radius: 6px;">
            <div style="font-weight: 600; color: #374151; margin-bottom: 6px;">🔋 Battery & Range</div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #6b7280; font-size: 12px;">Charge:</span>
              <span style="font-weight: 600; color: ${needsCharging ? '#ef4444' : '#10b981'};">${Math.round(vehicle.battery)}%</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #6b7280; font-size: 12px;">Range:</span>
              <span style="font-weight: 600; color: #374151;">${estimatedRange.toFixed(0)} mi</span>
            </div>
            ${needsCharging ? '<div style="color: #ef4444; font-size: 12px; font-weight: 600;">⚠️ Low battery - will charge</div>' : ''}
          </div>
          
          <!-- Diagnostics -->
          <div style="margin-bottom: 12px; padding: 8px; background: #f8fafc; border-radius: 6px;">
            <div style="font-weight: 600; color: #374151; margin-bottom: 6px;">🔧 Diagnostics</div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #6b7280; font-size: 12px;">Camera:</span>
              <span style="font-weight: 600; color: ${cameraOccluded ? '#ef4444' : '#10b981'};">${cameraOccluded ? 'OCCLUDED' : 'GOOD'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #6b7280; font-size: 12px;">FSD Errors:</span>
              <span style="font-weight: 600; color: ${fsdErrors > 0 ? '#f59e0b' : '#10b981'};">${fsdErrors}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #6b7280; font-size: 12px;">Motor Temp:</span>
              <span style="font-weight: 600; color: #374151;">${motorTemp.toFixed(1)}°C</span>
            </div>
          </div>
          
          <!-- Location -->
          <div style="font-size: 11px; color: #9ca3af; text-align: center; padding-top: 8px; border-top: 1px solid #e5e7eb;">
            ${vehicle.lat.toFixed(4)}, ${vehicle.lng.toFixed(4)}
          </div>
        </div>
      `,
      vehicleId: vehicle.id,
      isOpen: true
    });
  };

  // Handle address submission for vehicle routing
  const handleAddressSubmit = async () => {
    if (!selectedVehicleData || !addressInput || !map) return;
    
    try {
      // Geocode the address with Compton, CA context
      const geocoder = new google.maps.Geocoder();
      
      // Try multiple address formats for better results
      const addressFormats = [
        addressInput, // Original input
        `${addressInput}, Compton, CA`, // Add Compton context
        `${addressInput}, Compton, California`, // Full state name
        `${addressInput}, Los Angeles County, CA` // County context
      ];
      
      let result: google.maps.GeocoderResult | null = null;
      
      for (const addressFormat of addressFormats) {
        console.log(`Trying to geocode: ${addressFormat}`);
        
        try {
          const geocodeResult = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
            geocoder.geocode({ 
              address: addressFormat,
              bounds: new google.maps.LatLngBounds(
                { lat: COMPTON_BOUNDS.south, lng: COMPTON_BOUNDS.west },
                { lat: COMPTON_BOUNDS.north, lng: COMPTON_BOUNDS.east }
              ),
              region: 'US'
            }, (results, status) => {
              if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
                resolve(results);
              } else {
                reject(status);
              }
            });
          });
          
          if (geocodeResult && geocodeResult[0]) {
            const location = geocodeResult[0].geometry.location;
            const lat = location.lat();
            const lng = location.lng();
            
            // Check if the geocoded location is within reasonable distance of Compton
            if (lat >= COMPTON_BOUNDS.south - 0.1 && lat <= COMPTON_BOUNDS.north + 0.1 &&
                lng >= COMPTON_BOUNDS.west - 0.1 && lng <= COMPTON_BOUNDS.east + 0.1) {
              result = geocodeResult[0];
              console.log(`Successfully geocoded with format: ${addressFormat}`);
              break;
            } else {
              console.log(`Address found but outside Compton area: ${lat}, ${lng}`);
            }
          }
        } catch (formatError) {
          console.log(`Failed to geocode with format "${addressFormat}":`, formatError);
          continue;
        }
      }
      
      if (result) {
        const location = result.geometry.location;
        const destination = { lat: location.lat(), lng: location.lng() };
        const origin = { lat: selectedVehicleData.lat, lng: selectedVehicleData.lng };
        
        // Calculate directions using DirectionsService
        const directionsService = new google.maps.DirectionsService();
        
        directionsService.route(
          {
            origin: origin,
            destination: destination,
            travelMode: google.maps.TravelMode.DRIVING,
            avoidHighways: false,
            avoidTolls: false
          },
          async (directionsResult, status) => {
            if (status === google.maps.DirectionsStatus.OK && directionsResult) {
              console.log('New route calculated successfully');
              setDirectionsResponse(directionsResult);
              
              // Send the destination to the backend with the route data
              const route = directionsResult.routes[0];
              const waypoints = route.overview_path.map((point, index) => ({
                lat: point.lat(),
                lng: point.lng(),
                timestamp: Date.now() + (index * 30000) // 30 seconds between points
              }));
              
              await fetch(`http://localhost:8000/api/v1/vehicles/${selectedVehicleData.id}/reroute`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  destination: {
                    lat: destination.lat,
                    lng: destination.lng,
                    name: result.formatted_address,
                  },
                  route: waypoints
                }),
              });
              
              alert(`Rerouting ${selectedVehicleData.id} to ${result.formatted_address}`);
              setAddressInput('');
            } else {
              console.error('Error calculating route:', status);
              alert('Could not calculate route to that destination. Please try another address.');
            }
          }
        );
      } else {
        alert(`Could not find "${addressInput}" in the Compton area. Try adding more details like street number or nearby landmarks.`);
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      alert('Failed to find address. Please try a more specific address or check your spelling.');
    }
  };

  // Loading state
  if (loadError) {
    return <div className="absolute inset-0 flex items-center justify-center bg-background">
      <div className="text-red-500">Error loading Google Maps: {loadError.message}</div>
    </div>;
  }
  
  if (!isLoaded) {
    return <div className="absolute inset-0 flex items-center justify-center bg-background">
      <div className="text-foreground">Loading Maps...</div>
    </div>;
  }

  return (
    <div className="absolute inset-4 bg-gradient-to-br from-tesla-gray to-tesla-gray-light rounded-lg border border-border overflow-hidden">
      {/* Map Legend */}
      <div className="absolute top-4 left-4 z-10 bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-foreground">Compton, CA Fleet</h3>
          {selectedVehicle && (
            <button 
              onClick={() => onVehicleSelect && onVehicleSelect('')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear Selection
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
      
      {/* Google Map */}
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={COMPTON_CENTER}
        zoom={mapsConfig.googleMaps.defaultZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: true,
        }}
      >
        {/* Compton Boundary Polygon */}
        <Polygon
          paths={COMPTON_BOUNDARY_COORDS}
          options={{
            strokeColor: "#e82127",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#e82127",
            fillOpacity: 0.1,
          }}
        />

        {/* Landmarks */}
        {COMPTON_LANDMARKS.map((landmark) => (
          <Marker
            key={`landmark-${landmark.name}`}
            position={{ lat: landmark.lat, lng: landmark.lng }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#22c55e',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 5,
            }}
            title={landmark.name}
          />
        ))}

        {/* Ride Requests - Pickup locations */}
        {rideRequests?.map((request) => (
          <Marker
            key={`pickup-${request.id}`}
            position={{ lat: request.pickupLocation.lat, lng: request.pickupLocation.lng }}
            icon={{
              url: '/ride-pin.svg',
              scaledSize: new google.maps.Size(200, 267), // Made even bigger
              anchor: new google.maps.Point(100, 267), // Anchor at bottom center
            }}
            title={`Pickup: ${request.pickupLocation.name} - ${request.passenger}`}
            onClick={() => {
              console.log('Pickup clicked:', request);
              // Could add pickup selection logic here
            }}
            zIndex={1000} // Ensure pins are on top
          />
        ))}

        {/* Ride Requests - Destination locations */}
        {rideRequests?.map((request) => (
          <Marker
            key={`dest-${request.id}`}
            position={{ lat: request.destinationLocation.lat, lng: request.destinationLocation.lng }}
            icon={{
              url: '/destination-pin.svg',
              scaledSize: new google.maps.Size(200, 267), // Made even bigger
              anchor: new google.maps.Point(100, 267), // Anchor at bottom center
            }}
            title={`Destination: ${request.destinationLocation.name} - ${request.passenger}`}
            onClick={() => {
              console.log('Destination clicked:', request);
              // Could add destination selection logic here
            }}
            zIndex={1000} // Ensure pins are on top
          />
        ))}

        {/* Vehicles */}
        {vehicles.map((vehicle) => (
          <Marker
            key={vehicle.id}
            position={{ lat: vehicle.lat, lng: vehicle.lng }}
            onClick={() => handleVehicleClick(vehicle)}
            icon={getVehicleIcon(vehicle)}
            zIndex={selectedVehicle === vehicle.id ? 1000 : undefined}
          />
        ))}

        {/* Info Window */}
        {infoWindow && infoWindow.isOpen && (
          <InfoWindow
            position={infoWindow.position}
            onCloseClick={() => setInfoWindow({...infoWindow, isOpen: false})}
          >
            <div dangerouslySetInnerHTML={{ __html: infoWindow.content }} />
          </InfoWindow>
        )}

        {/* DirectionsRenderer for selected vehicle route */}
        {directionsResponse && (
          <DirectionsRenderer
            directions={directionsResponse}
            options={{
              suppressMarkers: true, // Don't show default markers
              polylineOptions: {
                strokeColor: '#3b82f6',
                strokeOpacity: 0.8,
                strokeWeight: 4,
              }
            }}
          />
        )}
        
        {/* Fallback polyline if directions service fails but we have route points */}
        {!directionsResponse && selectedVehicleData?.route && selectedVehicleData.route.length > 1 && (
          <Polyline
            path={selectedVehicleData.route.map(point => ({ lat: point.lat, lng: point.lng }))}
            options={{
              strokeColor: '#3b82f6',
              strokeOpacity: 0.8,
              strokeWeight: 4,
            }}
          />
        )}
      </GoogleMap>

      {/* Bottom Map Controls */}
      <div className="absolute bottom-4 right-4 z-10 bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-border">
        <div className="text-xs text-muted-foreground mb-2">
          {vehicles.length} vehicles • {rideRequests?.length || 0} requests
        </div>
        {selectedVehicleData && (
          <button
            onClick={() => setCameraTracking(!cameraTracking)}
            className={`text-xs px-3 py-1 rounded-md transition-colors ${
              cameraTracking 
                ? 'bg-tesla-blue text-white' 
                : 'bg-background/50 text-muted-foreground hover:bg-background/70'
            }`}
          >
            {cameraTracking ? '🔄 Tracking ON' : '📍 Tracking OFF'}
          </button>
        )}
      </div>
      
      {/* Address Input (only when vehicle is selected) */}
      {selectedVehicleData && (
        <div className="absolute bottom-4 left-4 z-10 bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-border">
          <div className="flex flex-col space-y-2">
            <label htmlFor="address-input" className="text-xs text-foreground">
              Send {selectedVehicleData.id} to:
            </label>
            <div className="flex space-x-2">
              <input
                id="address-input"
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                placeholder="Enter destination address"
                className="text-xs px-2 py-1 border border-border rounded-md bg-background text-foreground"
              />
              <button
                onClick={handleAddressSubmit}
                disabled={!addressInput}
                className="text-xs px-3 py-1 bg-tesla-blue text-white rounded-md disabled:opacity-50"
              >
                Go
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 