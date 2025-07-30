import { comptonAddresses } from './comptonAddresses';
import { apiKeys } from '../config/api-keys';

// Compton boundary polygon coordinates (accurate)
export const COMPTON_POLYGON = [
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
];

// Function to check if a point is inside the Compton polygon
export function isPointInCompton(lat: number, lng: number): boolean {
  // Ray casting algorithm for point in polygon
  let inside = false;
  for (let i = 0, j = COMPTON_POLYGON.length - 1; i < COMPTON_POLYGON.length; j = i++) {
    const xi = COMPTON_POLYGON[i][1], yi = COMPTON_POLYGON[i][0];
    const xj = COMPTON_POLYGON[j][1], yj = COMPTON_POLYGON[j][0];
    
    const intersect = ((yi > lat) !== (yj > lat))
        && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

// Fallback bounding box for quick checks
export const COMPTON_BOUNDS = {
  north: 33.92313,
  south: 33.86303,
  east: -118.17995,
  west: -118.26315
};

// Quick check if coordinates are within Compton bounds (bounding box)
export function isWithinComptonBounds(lat: number, lng: number): boolean {
  return lat >= COMPTON_BOUNDS.south && lat <= COMPTON_BOUNDS.north &&
         lng >= COMPTON_BOUNDS.west && lng <= COMPTON_BOUNDS.east;
}

// Constrain a point to be within the Compton polygon
export function constrainToCompton(lat: number, lng: number): {lat: number, lng: number} {
  // First check if already in polygon
  if (isPointInCompton(lat, lng)) {
    return { lat, lng };
  }
  
  // If not in polygon, find closest point in polygon
  // This is a simplified approach - find the closest known safe point
  let closestPoint = VEHICLE_START_LOCATIONS[0];
  let minDistance = Number.MAX_VALUE;
  
  for (const location of VEHICLE_START_LOCATIONS) {
    if (isPointInCompton(location.lat, location.lng)) {
      const distance = Math.sqrt(
        Math.pow(location.lat - lat, 2) + 
        Math.pow(location.lng - lng, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = location;
      }
    }
  }
  
  return { lat: closestPoint.lat, lng: closestPoint.lng };
}

// Vehicle starting locations (fixed within Compton boundary)
export const VEHICLE_START_LOCATIONS = [
  { lat: 33.8958, lng: -118.2201, name: "Compton City Hall" },
  { lat: 33.8897, lng: -118.2189, name: "Compton College" },
  { lat: 33.8889, lng: -118.2350, name: "Compton Airport" },
  { lat: 33.8950, lng: -118.2200, name: "Compton Library" },
  { lat: 33.8900, lng: -118.2150, name: "Compton High School" },
  { lat: 33.8850, lng: -118.2000, name: "Compton Shopping Center" },
  { lat: 33.8800, lng: -118.2100, name: "Compton Plaza" },
  { lat: 33.8820, lng: -118.2050, name: "Compton Station" },
  { lat: 33.8750, lng: -118.2050, name: "Compton Medical Center" },
  { lat: 33.8780, lng: -118.2080, name: "Compton Community Hospital" },
  { lat: 33.8700, lng: -118.2100, name: "Compton Creek Park" },
  { lat: 33.8650, lng: -118.2200, name: "Compton Park" },
  { lat: 33.8900, lng: -118.1900, name: "Compton Residential Area 1" },
  { lat: 33.8850, lng: -118.2300, name: "Compton Residential Area 2" },
  { lat: 33.8800, lng: -118.1950, name: "Compton Residential Area 3" }
];

// Charging station locations
export const CHARGING_STATIONS = [
  { lat: 33.8958, lng: -118.2201, name: "City Hall Charging Station" },
  { lat: 33.8897, lng: -118.2189, name: "College Charging Station" },
  { lat: 33.8850, lng: -118.2000, name: "Shopping Center Charging Station" },
  { lat: 33.8800, lng: -118.2100, name: "Plaza Charging Station" },
  { lat: 33.8750, lng: -118.2050, name: "Medical Center Charging Station" }
];

export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface VehicleRoute {
  id: string;
  lat: number;
  lng: number;
  pickup: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
  route: RoutePoint[];
  currentIndex: number;
  startTime: number;
  estimatedDuration: number; // in minutes
  status: 'available' | 'busy' | 'charging' | 'en-route-to-charging' | 'idle';
  battery: number;
  speed: number; // mph
}

// Calculate fare based on distance (2.69 to 14.00 range)
export function calculateFare(distanceMiles: number): number {
  const baseFare = 2.69;
  const perMileRate = 0.20; // $0.20 per mile
  const fare = baseFare + (distanceMiles * perMileRate);
  return Math.min(fare, 14.00); // Cap at 14.00
}

// Get Google Maps route between two points
export async function getOSRMRoute(
  startLat: number, 
  startLng: number, 
  endLat: number, 
  endLng: number
): Promise<RoutePoint[]> {
  try {
    console.log(`🔄 Fetching Google Maps route from (${startLat.toFixed(4)}, ${startLng.toFixed(4)}) to (${endLat.toFixed(4)}, ${endLng.toFixed(4)})`);
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${startLat},${startLng}&destination=${endLat},${endLng}&mode=driving&avoid=highways|tolls|ferries&units=imperial&alternatives=true&key=${apiKeys.googleMaps}`
    );
    
    if (!response.ok) {
      throw new Error(`Google Maps route request failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`📊 Google Maps response:`, data);
    
    if (data.routes && data.routes[0]) {
      const route = data.routes[0];
      const duration = route.legs[0].duration.value; // seconds
      
      // Use detailed route steps instead of overview polyline
      const coordinates: [number, number][] = [];
      
      // Extract coordinates from each step in the route
      route.legs[0].steps.forEach((step: { polyline?: { points: string } }) => {
        if (step.polyline && step.polyline.points) {
          const stepCoords = decodePolyline(step.polyline.points);
          coordinates.push(...stepCoords);
        }
      });
      
      // Remove duplicates and ensure we have start and end points
      const uniqueCoords = coordinates.filter((coord, index, arr) => {
        if (index === 0) return true;
        const prev = arr[index - 1];
        const distance = Math.sqrt(
          Math.pow(coord[0] - prev[0], 2) + Math.pow(coord[1] - prev[1], 2)
        );
        return distance > 0.00005; // Keep more points for smoother street following
      });
      
      console.log(`✅ Google Maps route found with ${uniqueCoords.length} detailed points, duration: ${duration}s`);
      
      // Snap coordinates to actual roads for better street following
      let finalCoords = uniqueCoords;
      try {
        const snappedCoords = await snapToRoads(uniqueCoords);
        if (snappedCoords.length > 0) {
          finalCoords = snappedCoords;
          console.log(`🛣️ Snapped route to roads: ${snappedCoords.length} points`);
        } else {
          console.log(`⚠️ Road snapping failed, using original route`);
        }
      } catch (error) {
        console.log(`⚠️ Road snapping error, using original route:`, error);
      }
      
      // Convert coordinates to RoutePoint array with timestamps
      const routePoints: RoutePoint[] = [];
      const timePerPoint = duration / (finalCoords.length - 1);
      
      finalCoords.forEach((coord: [number, number], index: number) => {
        routePoints.push({
          lat: coord[0],
          lng: coord[1],
          timestamp: Date.now() + (index * timePerPoint * 1000)
        });
      });
      
      return routePoints;
    }
    
    throw new Error('No route found in Google Maps response');
  } catch (error) {
    console.error('Google Maps routing error:', error);
    console.log(`🔄 Falling back to straight line route`);
    
    // Fallback to straight line route with intermediate points
    return createStraightLineRoute(startLat, startLng, endLat, endLng);
  }
}

// Decode Google polyline format
function decodePolyline(encoded: string): [number, number][] {
  const poly: [number, number][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let shift = 0, result = 0;

    do {
      const b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (result >= 0x20);

    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      const b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (result >= 0x20);

    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    poly.push([lat / 1E5, lng / 1E5]);
  }

  return poly;
}

// Fallback: create straight-line route when OSRM is unavailable
function createStraightLineRoute(
  startLat: number, 
  startLng: number, 
  endLat: number, 
  endLng: number
): RoutePoint[] {
  const routePoints: RoutePoint[] = [];
  const numPoints = 10; // More points for smoother movement
  const duration = 15 * 60 * 1000; // 15 minutes in milliseconds
  
  // Make sure start and end points are within Compton
  const startPoint = constrainToCompton(startLat, startLng);
  const endPoint = constrainToCompton(endLat, endLng);
  
  console.log(`🔄 Creating route from (${startPoint.lat.toFixed(4)}, ${startPoint.lng.toFixed(4)}) to (${endPoint.lat.toFixed(4)}, ${endPoint.lng.toFixed(4)})`);
  
  for (let i = 0; i <= numPoints; i++) {
    const progress = i / numPoints;
    
    // Use cubic bezier curve for more realistic path
    const t = progress;
    const lat = startPoint.lat + (endPoint.lat - startPoint.lat) * t + Math.sin(t * Math.PI) * 0.001 * (Math.random() - 0.5);
    const lng = startPoint.lng + (endPoint.lng - startPoint.lng) * t + Math.sin(t * Math.PI) * 0.001 * (Math.random() - 0.5);
    
    // Ensure point is within Compton polygon
    const constrainedPoint = constrainToCompton(lat, lng);
    
    routePoints.push({
      lat: constrainedPoint.lat,
      lng: constrainedPoint.lng,
      timestamp: Date.now() + (progress * duration)
    });
  }
  
  console.log(`📏 Created fallback route with ${routePoints.length} points, all within Compton boundary`);
  return routePoints;
}

// Initialize vehicle routes
export function initializeVehicleRoutes(): VehicleRoute[] {
  return VEHICLE_START_LOCATIONS.map((startLocation, index) => {
    const vehicleId = `vehicle-${String(index + 1).padStart(3, '0')}`;
    
    return {
      id: vehicleId,
      lat: startLocation.lat,
      lng: startLocation.lng,
      pickup: startLocation,
      destination: startLocation,
      route: [],
      currentIndex: 0,
      startTime: Date.now(),
      estimatedDuration: 0,
      status: 'available',
      battery: Math.floor(85 + Math.random() * 15), // 85-100% (integer only)
      speed: 0
    };
  });
}

// Update vehicle position based on route
export function updateVehiclePosition(vehicle: VehicleRoute): VehicleRoute {
  if (vehicle.route.length === 0 || vehicle.currentIndex >= vehicle.route.length - 1) {
    return vehicle;
  }
  
  const currentPoint = vehicle.route[vehicle.currentIndex];
  const nextPoint = vehicle.route[vehicle.currentIndex + 1];
  const now = Date.now();
  
  // Check if it's time to move to next point
  if (now >= nextPoint.timestamp) {
    vehicle.currentIndex++;
    vehicle.lat = nextPoint.lat;
    vehicle.lng = nextPoint.lng;
    
    // Calculate speed based on distance and time
    if (vehicle.currentIndex > 0) {
      const prevPoint = vehicle.route[vehicle.currentIndex - 1];
      const distance = Math.sqrt(
        Math.pow(nextPoint.lat - prevPoint.lat, 2) + 
        Math.pow(nextPoint.lng - prevPoint.lng, 2)
      ) * 69; // Convert to miles
      const timeDiff = (nextPoint.timestamp - prevPoint.timestamp) / 1000 / 3600; // hours
      vehicle.speed = distance / timeDiff;
    }
  } else {
    // Interpolate position between points
    const progress = (now - currentPoint.timestamp) / (nextPoint.timestamp - currentPoint.timestamp);
    vehicle.lat = currentPoint.lat + (nextPoint.lat - currentPoint.lat) * progress;
    vehicle.lng = currentPoint.lng + (nextPoint.lng - currentPoint.lng) * progress;
  }
  
  // Update battery based on status
  if (vehicle.status === 'busy') {
    vehicle.battery = Math.floor(Math.max(0, vehicle.battery - 0.1)); // Drain battery while driving
  } else if (vehicle.status === 'charging') {
    vehicle.battery = Math.floor(Math.min(100, vehicle.battery + 0.5)); // Charge battery
  }
  
  return vehicle;
}

// Assign new trip to vehicle
export async function assignTripToVehicle(
  vehicle: VehicleRoute, 
  pickup: { lat: number; lng: number; name: string },
  destination: { lat: number; lng: number; name: string }
): Promise<VehicleRoute> {
  // First route to pickup
  const pickupRoute = await getOSRMRoute(
    vehicle.lat, vehicle.lng, pickup.lat, pickup.lng
  );
  
  // Then route from pickup to destination
  const destinationRoute = await getOSRMRoute(
    pickup.lat, pickup.lng, destination.lat, destination.lng
  );
  
  // Combine routes
  const fullRoute = [...pickupRoute, ...destinationRoute];
  
  return {
    ...vehicle,
    pickup,
    destination,
    route: fullRoute,
    currentIndex: 0,
    startTime: Date.now(),
    estimatedDuration: (fullRoute[fullRoute.length - 1]?.timestamp || 0) - Date.now(),
    status: 'busy',
    speed: 25 // Default speed
  };
}

// Send vehicle to charging station
export async function sendVehicleToCharging(vehicle: VehicleRoute): Promise<VehicleRoute> {
  // Find nearest charging station
  const nearestCharging = CHARGING_STATIONS.reduce((nearest, station) => {
    const distance = Math.sqrt(
      Math.pow(vehicle.lat - station.lat, 2) + Math.pow(vehicle.lng - station.lng, 2)
    );
    if (!nearest || distance < nearest.distance) {
      return { station, distance };
    }
    return nearest;
  }, null as { station: typeof CHARGING_STATIONS[0]; distance: number } | null);
  
  if (!nearestCharging) {
    return vehicle;
  }
  
  const chargingRoute = await getOSRMRoute(
    vehicle.lat, vehicle.lng, 
    nearestCharging.station.lat, nearestCharging.station.lng
  );
  
  return {
    ...vehicle,
    destination: nearestCharging.station,
    route: chargingRoute,
    currentIndex: 0,
    startTime: Date.now(),
    status: 'en-route-to-charging',
    speed: 20
  };
}

// NEW FUNCTION: Change destination while vehicle is en-route
export async function changeVehicleDestination(
  vehicle: VehicleRoute,
  newDestination: { lat: number; lng: number; name: string }
): Promise<VehicleRoute> {
  // Validate new destination is within Compton
  if (!isPointInCompton(newDestination.lat, newDestination.lng)) {
    const constrained = constrainToCompton(newDestination.lat, newDestination.lng);
    newDestination = {
      ...newDestination,
      lat: constrained.lat,
      lng: constrained.lng
    };
  }

  try {
    // Get new route from current position to new destination
    const newRoute = await getOSRMRoute(
      vehicle.lat, vehicle.lng, 
      newDestination.lat, newDestination.lng
    );

    console.log(`🔄 Vehicle ${vehicle.id} rerouted to ${newDestination.name}`);
    console.log(`📍 New route has ${newRoute.length} points`);

    return {
      ...vehicle,
      destination: newDestination,
      route: newRoute,
      currentIndex: 0, // Reset to start of new route
      startTime: Date.now(),
      estimatedDuration: (newRoute[newRoute.length - 1]?.timestamp || 0) - Date.now(),
      status: vehicle.status === 'en-route-to-charging' ? 'en-route-to-charging' : 'busy',
      speed: vehicle.status === 'en-route-to-charging' ? 20 : 25
    };
  } catch (error) {
    console.error(`❌ Failed to reroute vehicle ${vehicle.id}:`, error);
    throw new Error(`Failed to reroute vehicle: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// NEW FUNCTION: Get current vehicle position for routing
export function getCurrentVehiclePosition(vehicle: VehicleRoute): { lat: number; lng: number } {
  if (vehicle.route.length === 0) {
    return { lat: vehicle.lat, lng: vehicle.lng };
  }

  const currentPoint = vehicle.route[vehicle.currentIndex];
  const nextPoint = vehicle.route[vehicle.currentIndex + 1];
  
  if (!nextPoint) {
    return { lat: currentPoint.lat, lng: currentPoint.lng };
  }

  // Interpolate between current and next point
  const now = Date.now();
  const progress = (now - currentPoint.timestamp) / (nextPoint.timestamp - currentPoint.timestamp);
  
  return {
    lat: currentPoint.lat + (nextPoint.lat - currentPoint.lat) * progress,
    lng: currentPoint.lng + (nextPoint.lng - currentPoint.lng) * progress
  };
}

// NEW FUNCTION: Frontend API call to reroute vehicle
export async function rerouteVehicleAPI(
  vehicleId: string, 
  destination: { lat: number; lng: number; name: string } | string
): Promise<{ ok: boolean; message: string; route?: RoutePoint[] }> {
  try {
    const payload = typeof destination === 'string' 
      ? { address: destination }
      : { destination };

    const response = await fetch(`http://localhost:8000/api/v1/vehicles/${vehicleId}/reroute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Vehicle ${vehicleId} rerouted successfully:`, data.message);
    return data;
  } catch (error) {
    console.error(`❌ Failed to reroute vehicle ${vehicleId}:`, error);
    throw new Error(`Failed to reroute vehicle: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// NEW FUNCTION: Snap route coordinates to actual roads
async function snapToRoads(coordinates: [number, number][]): Promise<[number, number][]> {
  try {
    // Google Maps Roads API can only handle 100 points at a time
    const maxPoints = 100;
    const snappedCoords: [number, number][] = [];
    
    for (let i = 0; i < coordinates.length; i += maxPoints) {
      const batch = coordinates.slice(i, i + maxPoints);
      const path = batch.map(coord => `${coord[0]},${coord[1]}`).join('|');
      
      const response = await fetch(
        `https://roads.googleapis.com/v1/snapToRoads?path=${path}&interpolate=true&key=${apiKeys.googleMaps}`
      );
      
      if (!response.ok) {
        console.warn('Roads API failed, using original coordinates');
        return coordinates;
      }
      
      const data = await response.json();
      
      if (data.snappedPoints) {
        const batchSnapped = data.snappedPoints.map((point: { location: { latitude: number; longitude: number } }) => [
          point.location.latitude,
          point.location.longitude
        ] as [number, number]);
        snappedCoords.push(...batchSnapped);
      }
    }
    
    return snappedCoords.length > 0 ? snappedCoords : coordinates;
  } catch (error) {
    console.warn('Roads API error, using original coordinates:', error);
    return coordinates;
  }
} 