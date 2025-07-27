const { io } = require('socket.io-client');
const { getRandomAddress } = require('./src/utils/comptonAddresses.js');
const { generateVehicleDiagnostics } = require('./src/utils/vehicleDiagnostics.js');

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

// Function to constrain coordinates within Compton boundary
function constrainToComptonBoundary(lat, lng) {
  return {
    lat: Math.max(COMPTON_BOUNDARY.minLat, Math.min(COMPTON_BOUNDARY.maxLat, lat)),
    lng: Math.max(COMPTON_BOUNDARY.minLng, Math.min(COMPTON_BOUNDARY.maxLng, lng))
  };
}

// Charging station locations
const CHARGING_STATIONS = [
  { lat: 33.8958, lng: -118.2201, name: "City Hall Charging Station" },
  { lat: 33.8897, lng: -118.2189, name: "College Charging Station" },
  { lat: 33.8850, lng: -118.2000, name: "Shopping Center Charging Station" },
  { lat: 33.8800, lng: -118.2100, name: "Plaza Charging Station" },
  { lat: 33.8750, lng: -118.2050, name: "Medical Center Charging Station" }
];

// Calculate fare based on distance (2.69 to 14.20 range)
function calculateFare(distanceMiles) {
  const baseFare = 2.69;
  const perMileRate = 1.50;
  const fare = baseFare + (distanceMiles * perMileRate);
  return Math.min(fare, 14.20); // Cap at 14.20
}

// Get OSRM route between two points
async function getOSRMRoute(startLat, startLng, endLat, endLng) {
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
      
      // Convert coordinates to route points with timestamps
      const routePoints = [];
      const timePerPoint = duration / (coordinates.length - 1);
      
      coordinates.forEach((coord, index) => {
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
function createStraightLineRoute(startLat, startLng, endLat, endLng) {
  const points = 20;
  const routePoints = [];
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

// Assign new trip to vehicle
async function assignTripToVehicle(vehicle, pickup, destination) {
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
      status: 'en-route',
      speed: 25 // Default speed
    };
}

// Send vehicle to charging station
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
      // Generate diagnostic data
      const diagnostics = generateVehicleDiagnostics(vehicle.id, vehicle);
      
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
        diagnostics: diagnostics // Include diagnostic data
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