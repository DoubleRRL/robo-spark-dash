import io from 'socket.io-client';
import fetch from 'node-fetch';
import { 
  isWithinComptonBounds, 
  COMPTON_BOUNDS, 
  VEHICLE_START_LOCATIONS,
  CHARGING_STATIONS
} from './src/utils/vehicleRouting';
import { getRandomAddress } from './src/utils/comptonAddresses';

// Import Google Maps API key
import { apiKeys } from './src/config/api-keys';
const GOOGLE_MAPS_API_KEY = apiKeys.googleMaps;

// Compton boundary coordinates
const COMPTON_BOUNDARY = {
  minLat: 33.87442,
  maxLat: 33.92313,
  minLng: -118.26315,
  maxLng: -118.17995
};

// Vehicle starting locations (fixed within Compton boundary)
const VEHICLE_START_LOCATIONS = [
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

// Function to constrain position to Compton boundary
function constrainToComptonBoundary(lat, lng) {
  if (isWithinComptonBounds(lat, lng)) {
    return { lat, lng };
  }
  
  // If outside bounds, move to nearest point on boundary
  const north = COMPTON_BOUNDS.north;
  const south = COMPTON_BOUNDS.south;
  const east = COMPTON_BOUNDS.east;
  const west = COMPTON_BOUNDS.west;
  
  const constrainedLat = Math.max(south, Math.min(north, lat));
  const constrainedLng = Math.max(west, Math.min(east, lng));
  
  return { lat: constrainedLat, lng: constrainedLng };
}

// Calculate fare based on distance (2.69 to 14.20 range)
function calculateFare(distanceMiles) {
  const baseFare = 2.69;
  const perMileRate = 1.50;
  const fare = baseFare + (distanceMiles * perMileRate);
  return Math.min(fare, 14.20); // Cap at 14.20
}

// Get Google Maps route between two points
async function getGoogleMapsRoute(startLat, startLng, endLat, endLng) {
  try {
    console.log(`🔄 Fetching Google Maps route from (${startLat.toFixed(4)}, ${startLng.toFixed(4)}) to (${endLat.toFixed(4)}, ${endLng.toFixed(4)})`);
    
    // If API key is not available, use fallback
    if (!GOOGLE_MAPS_API_KEY) {
      console.log('No Google Maps API key, using fallback route');
      return createStraightLineRoute(startLat, startLng, endLat, endLng);
    }
    
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${startLat},${startLng}&destination=${endLat},${endLng}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Maps route request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.routes && data.routes[0]) {
      const route = data.routes[0];
      const encodedPolyline = route.overview_polyline.points;
      const duration = route.legs[0].duration.value; // seconds
      
      // Decode polyline
      const coordinates = decodePolyline(encodedPolyline);
      
      console.log(`✅ Google Maps route found with ${coordinates.length} points, duration: ${duration}s`);
      
      // Convert coordinates to RoutePoint array with timestamps
      const routePoints = [];
      const timePerPoint = duration / (coordinates.length - 1);
      
      coordinates.forEach((coord, index) => {
        routePoints.push({
          lat: coord[0],
          lng: coord[1],
          timestamp: Date.now() + (index * timePerPoint * 1000)
        });
      });
      
      return routePoints;
    }
    
    console.warn(`No route found in Google Maps response: ${data.status}`);
    return createStraightLineRoute(startLat, startLng, endLat, endLng);
  } catch (error) {
    console.error('Google Maps routing error:', error);
    console.log(`⚠️ Google Maps failed, using fallback route:`, error);
    
    // Fallback to straight line route with intermediate points
    return createStraightLineRoute(startLat, startLng, endLat, endLng);
  }
}

// Decode Google polyline format
function decodePolyline(encoded) {
  const poly = [];
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

// Fallback: create straight-line route with curve
function createStraightLineRoute(startLat, startLng, endLat, endLng) {
  console.log(`🔄 Creating fallback curved route from (${startLat.toFixed(4)}, ${startLng.toFixed(4)}) to (${endLat.toFixed(4)}, ${endLng.toFixed(4)})`);
  
  const routePoints = [];
  const numPoints = 15; // More points for smoother movement
  const curveFactor = 0.002; // Controls how much the path curves
  
  // Make sure start and end points are within Compton
  const startPoint = constrainToComptonBoundary(startLat, startLng);
  const endPoint = constrainToComptonBoundary(endLat, endLng);
  
  // Create a control point for quadratic curve
  const midLat = (startPoint.lat + endPoint.lat) / 2;
  const midLng = (startPoint.lng + endPoint.lng) / 2;
  // Add some randomness to control point
  const controlLat = midLat + (Math.random() - 0.5) * curveFactor * 10;
  const controlLng = midLng + (Math.random() - 0.5) * curveFactor * 10;
  
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    
    // Quadratic Bezier curve formula
    const lat = (1 - t) * (1 - t) * startPoint.lat + 2 * (1 - t) * t * controlLat + t * t * endPoint.lat;
    const lng = (1 - t) * (1 - t) * startPoint.lng + 2 * (1 - t) * t * controlLng + t * t * endPoint.lng;
    
    // Add small random jitter
    const jitterLat = lat + (Math.random() - 0.5) * curveFactor;
    const jitterLng = lng + (Math.random() - 0.5) * curveFactor;
    
    // Ensure point is within Compton boundary
    const constrainedPoint = constrainToComptonBoundary(jitterLat, jitterLng);
    
    routePoints.push({
      lat: constrainedPoint.lat,
      lng: constrainedPoint.lng,
      timestamp: Date.now() + (i * 30000) // 30 seconds between points
    });
  }
  
  console.log(`✅ Created fallback curved route with ${routePoints.length} points, all within Compton boundary`);
  return routePoints;
}

// Initialize vehicle routes
function initializeVehicleRoutes() {
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
      battery: 85 + Math.random() * 15, // 85-100%
      speed: 0
    };
  });
}

// Update vehicle position based on route
function updateVehiclePosition(vehicle) {
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
    vehicle.battery = Math.max(0, vehicle.battery - 0.1); // Drain battery while driving
  } else if (vehicle.status === 'charging') {
    vehicle.battery = Math.min(100, vehicle.battery + 0.5); // Charge battery
  }
  
  return vehicle;
}

// Update the assignTripToVehicle function to use Google Maps
async function assignTripToVehicle(vehicle, pickup, destination) {
  // First route to pickup
  const pickupRoute = await getGoogleMapsRoute(
    vehicle.lat, vehicle.lng, pickup.lat, pickup.lng
  );
  
  // Then route from pickup to destination
  const destinationRoute = await getGoogleMapsRoute(
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
    status: 'picking-up', // Start with picking-up status
    speed: 25 // Default speed
  };
}

// Update the sendVehicleToCharging function to use Google Maps
async function sendVehicleToCharging(vehicle) {
  // Find nearest charging station
  const nearestCharging = CHARGING_STATIONS.reduce((nearest, station) => {
    const distance = Math.sqrt(
      Math.pow(vehicle.lat - station.lat, 2) + Math.pow(vehicle.lng - station.lng, 2)
    );
    if (!nearest || distance < nearest.distance) {
      return { station, distance };
    }
    return nearest;
  }, null);
  
  if (!nearestCharging) {
    return vehicle;
  }
  
  const chargingRoute = await getGoogleMapsRoute(
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

class RealisticVehicleSimulator {
  constructor() {
    this.vehicles = [];
    this.socket = null;
    this.interval = null;
    this.tripQueue = [];
  }

  async start() {
    this.socket = io('http://localhost:8000/vehicles', {
      transports: ['websocket', 'polling']
    });
    
    this.socket.on('connect', () => {
      console.log('✅ Connected to backend');
      this.startSimulation();
    });
    
    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from backend');
    });
  }

  startSimulation() {
    // Initialize vehicles at fixed locations
    this.vehicles = initializeVehicleRoutes();
    
    // Start update loop
    this.interval = setInterval(() => {
      this.updateVehicles();
      this.generateNewTrips();
      this.sendUpdates();
    }, 2000); // Update every 2 seconds
    
    console.log('🚗 Realistic Vehicle Simulator Started');
    console.log(`📊 ${this.vehicles.length} vehicles initialized`);
  }

  updateVehicles() {
    this.vehicles = this.vehicles.map(vehicle => {
      let updatedVehicle = updateVehiclePosition(vehicle);
      
      // Constrain vehicle position to Compton boundary
      const constrained = constrainToComptonBoundary(updatedVehicle.lat, updatedVehicle.lng);
      updatedVehicle.lat = constrained.lat;
      updatedVehicle.lng = constrained.lng;
      
      // Handle trip completion
      if (updatedVehicle.status === 'en-route' && 
          updatedVehicle.currentIndex >= updatedVehicle.route.length - 1) {
        updatedVehicle.status = 'available';
        updatedVehicle.route = [];
        updatedVehicle.currentIndex = 0;
        updatedVehicle.speed = 0;
        console.log(`✅ Vehicle ${updatedVehicle.id} completed trip`);
        
        // Generate new trip for this vehicle immediately
        this.generateNewTripForVehicle(updatedVehicle);
      }
      
      // Handle pickup completion - transition to en-route
      if (updatedVehicle.status === 'picking-up' && 
          updatedVehicle.currentIndex >= updatedVehicle.route.length - 1) {
        updatedVehicle.status = 'en-route';
        console.log(`🚗 Vehicle ${updatedVehicle.id} picked up passenger, now en-route to destination`);
      }
      
      // Handle charging completion
      if (updatedVehicle.status === 'charging' && updatedVehicle.battery >= 95) {
        updatedVehicle.status = 'available';
        updatedVehicle.route = [];
        updatedVehicle.currentIndex = 0;
        updatedVehicle.speed = 0;
        console.log(`🔋 Vehicle ${updatedVehicle.id} finished charging`);
      }
      
      // Handle en-route-to-charging completion
      if (updatedVehicle.status === 'en-route-to-charging' && 
          updatedVehicle.currentIndex >= updatedVehicle.route.length - 1) {
        updatedVehicle.status = 'charging';
        updatedVehicle.route = [];
        updatedVehicle.currentIndex = 0;
        updatedVehicle.speed = 0;
        console.log(`🔌 Vehicle ${updatedVehicle.id} arrived at charging station`);
      }
      
      // Send low battery vehicles to charging
      if (updatedVehicle.status === 'available' && updatedVehicle.battery < 20) {
        this.sendVehicleToCharging(updatedVehicle.id);
      }
      
      return updatedVehicle;
    });
  }

  async generateNewTrips() {
    // Generate new trip requests occasionally
    if (Math.random() < 0.5 && this.tripQueue.length < 8) { // 50% chance, max 8 queued
      const pickupLocation = getRandomAddress();
      const destinationLocation = getRandomAddress();
      
      this.tripQueue.push({
        id: `trip-${Date.now()}`,
        pickup: {
          lat: pickupLocation.lat,
          lng: pickupLocation.lng,
          name: pickupLocation.name
        },
        destination: {
          lat: destinationLocation.lat,
          lng: destinationLocation.lng,
          name: destinationLocation.name
        },
        passenger: `Passenger-${Math.floor(Math.random() * 1000)}`
      });
      
      console.log(`🚕 New trip request: ${pickupLocation.name} → ${destinationLocation.name}`);
    }
    
    // Assign trips to available vehicles
    await this.assignTripsToVehicles();
  }

  async assignTripsToVehicles() {
    const availableVehicles = this.vehicles.filter(v => v.status === 'available');
    
    for (const trip of this.tripQueue) {
      if (availableVehicles.length === 0) break;
      
      // Find nearest available vehicle
      const nearestVehicle = availableVehicles.reduce((nearest, vehicle) => {
        const distance = Math.sqrt(
          Math.pow(trip.pickup.lat - vehicle.lat, 2) + 
          Math.pow(trip.pickup.lng - vehicle.lng, 2)
        );
        if (!nearest || distance < nearest.distance) {
          return { vehicle, distance };
        }
        return nearest;
      }, null);
      
      if (nearestVehicle) {
        try {
          const updatedVehicle = await assignTripToVehicle(
            nearestVehicle.vehicle,
            trip.pickup,
            trip.destination
          );
          
          // Update vehicle in array
          const index = this.vehicles.findIndex(v => v.id === updatedVehicle.id);
          if (index !== -1) {
            this.vehicles[index] = updatedVehicle;
          }
          
          // Remove trip from queue
          this.tripQueue = this.tripQueue.filter(t => t.id !== trip.id);
          
          console.log(`🚗 Vehicle ${updatedVehicle.id} assigned to trip ${trip.id}`);
        } catch (error) {
          console.error('Failed to assign trip:', error);
        }
      }
    }
  }

  async generateNewTripForVehicle(vehicle) {
    try {
      // Generate pickup location near the vehicle's current position
      const pickupLocation = getRandomAddress();
      
      // Generate destination within Compton boundary
      const destinationLocation = getRandomAddress();
      
      // Create new trip
      const newTrip = {
        id: `trip-${Date.now()}-${vehicle.id}`,
        pickup: {
          lat: pickupLocation.lat,
          lng: pickupLocation.lng,
          name: pickupLocation.name
        },
        destination: {
          lat: destinationLocation.lat,
          lng: destinationLocation.lng,
          name: destinationLocation.name
        },
        passenger: `Passenger-${Math.floor(Math.random() * 1000)}`
      };
      
      console.log(`🚕 Vehicle ${vehicle.id} got new trip: ${pickupLocation.name} → ${destinationLocation.name}`);
      
      // Assign trip to vehicle immediately
      const updatedVehicle = await assignTripToVehicle(
        vehicle,
        newTrip.pickup,
        newTrip.destination
      );
      
      // Update vehicle in array
      const index = this.vehicles.findIndex(v => v.id === updatedVehicle.id);
      if (index !== -1) {
        this.vehicles[index] = updatedVehicle;
      }
      
    } catch (error) {
      console.error('Failed to generate new trip for vehicle:', error);
    }
  }

  async sendVehicleToCharging(vehicleId) {
    const vehicle = this.vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    
    try {
      const updatedVehicle = await sendVehicleToCharging(vehicle);
      
      // Update vehicle in array
      const index = this.vehicles.findIndex(v => v.id === vehicleId);
      if (index !== -1) {
        this.vehicles[index] = updatedVehicle;
      }
      
      console.log(`🔌 Vehicle ${vehicleId} sent to charging station`);
    } catch (error) {
      console.error('Failed to send vehicle to charging:', error);
    }
  }

  sendUpdates() {
    this.vehicles.forEach(vehicle => {
      // Generate realistic diagnostic data
      const diagnostics = this.generateDiagnostics(vehicle);
      
      const update = {
        id: vehicle.id,
        type: this.getVehicleType(vehicle.id),
        status: vehicle.status,
        lat: vehicle.lat,
        lng: vehicle.lng,
        progress: vehicle.route.length > 0 ? 
          (vehicle.currentIndex / vehicle.route.length) * 100 : 0,
        battery: Math.round(vehicle.battery),
        speed: Math.round(vehicle.speed),
        eta: this.calculateETA(vehicle),
        heading: this.calculateHeading(vehicle),
        diagnostics: diagnostics
      };
      
      this.socket.emit('vehicle-update', update);
    });
  }

  getVehicleType(vehicleId) {
    const num = parseInt(vehicleId.split('-')[1]);
    if (num <= 5) return 'cybertruck';
    if (num <= 10) return 'modely';
    return 'modelx';
  }

  calculateETA(vehicle) {
    if (vehicle.status === 'available') return '0 min';
    
    const remainingPoints = vehicle.route.length - vehicle.currentIndex;
    const estimatedMinutes = Math.ceil(remainingPoints * 0.5); // Rough estimate
    
    return `${estimatedMinutes} min`;
  }

  calculateHeading(vehicle) {
    if (vehicle.route.length === 0 || vehicle.currentIndex >= vehicle.route.length - 1) {
      return 0;
    }
    
    const current = vehicle.route[vehicle.currentIndex];
    const next = vehicle.route[vehicle.currentIndex + 1];
    
    const deltaLng = next.lng - current.lng;
    const deltaLat = next.lat - current.lat;
    
    return Math.atan2(deltaLng, deltaLat) * 180 / Math.PI;
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    if (this.socket) {
      this.socket.disconnect();
    }
    console.log('🛑 Realistic Vehicle Simulator Stopped');
  }
}

// Start simulator
const simulator = new RealisticVehicleSimulator();
simulator.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping realistic simulator...');
  simulator.stop();
  process.exit(0);
}); 