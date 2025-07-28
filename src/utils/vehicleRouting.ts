import { comptonAddresses } from './comptonAddresses';

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
  status: 'available' | 'busy' | 'charging' | 'en-route-to-charging';
  battery: number;
  speed: number; // mph
}

// Calculate fare based on distance (2.69 to 14.20 range)
export function calculateFare(distanceMiles: number): number {
  const baseFare = 2.69;
  const perMileRate = 1.50;
  const fare = baseFare + (distanceMiles * perMileRate);
  return Math.min(fare, 14.20); // Cap at 14.20
}

// Get OSRM route between two points
export async function getOSRMRoute(
  startLat: number, 
  startLng: number, 
  endLat: number, 
  endLng: number
): Promise<RoutePoint[]> {
  try {
    const response = await fetch(
      `http://localhost:5000/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`
    );
    
    if (!response.ok) {
      throw new Error('OSRM route request failed');
    }
    
    const data = await response.json();
    
    if (data.routes && data.routes[0]) {
      const route = data.routes[0];
      const coordinates = route.geometry.coordinates;
      const duration = route.duration; // seconds
      
      // Convert coordinates to RoutePoint array with timestamps
      const routePoints: RoutePoint[] = [];
      const timePerPoint = duration / (coordinates.length - 1);
      
      coordinates.forEach((coord: number[], index: number) => {
        routePoints.push({
          lng: coord[0],
          lat: coord[1],
          timestamp: Date.now() + (index * timePerPoint * 1000)
        });
      });
      
      return routePoints;
    }
    
    throw new Error('No route found');
  } catch (error) {
    console.error('OSRM routing error:', error);
    // Fallback: create simple straight-line route
    return createStraightLineRoute(startLat, startLng, endLat, endLng);
  }
}

// Fallback: create straight-line route when OSRM is unavailable
function createStraightLineRoute(
  startLat: number, 
  startLng: number, 
  endLat: number, 
  endLng: number
): RoutePoint[] {
  const points = 20;
  const routePoints: RoutePoint[] = [];
  const duration = 15 * 60 * 1000; // 15 minutes in milliseconds
  
  for (let i = 0; i <= points; i++) {
    const progress = i / points;
    const lat = startLat + (endLat - startLat) * progress;
    const lng = startLng + (endLng - startLng) * progress;
    
    routePoints.push({
      lat,
      lng,
      timestamp: Date.now() + (progress * duration)
    });
  }
  
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