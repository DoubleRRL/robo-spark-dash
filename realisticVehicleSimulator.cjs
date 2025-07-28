const { io } = require('socket.io-client');

// Compton addresses data
const comptonAddresses = [
  { name: "Compton City Hall", address: "205 S Willowbrook Ave, Compton, CA 90220", lat: 33.8958, lng: -118.2201, type: "government" },
  { name: "Compton College", address: "1111 E Artesia Blvd, Compton, CA 90221", lat: 33.8897, lng: -118.2189, type: "education" },
  { name: "Compton Airport", address: "18000 Crenshaw Blvd, Torrance, CA 90504", lat: 33.8889, lng: -118.2350, type: "transportation" },
  { name: "Compton Library", address: "240 W Compton Blvd, Compton, CA 90220", lat: 33.8950, lng: -118.2200, type: "education" },
  { name: "Compton High School", address: "601 S Alameda St, Compton, CA 90220", lat: 33.8900, lng: -118.2150, type: "education" },
  { name: "Compton Shopping Center", address: "1405 S Long Beach Blvd, Compton, CA 90221", lat: 33.8850, lng: -118.2000, type: "commercial" },
  { name: "Compton Plaza", address: "2100 N Long Beach Blvd, Compton, CA 90221", lat: 33.8800, lng: -118.2100, type: "commercial" },
  { name: "Compton Station", address: "100 W Artesia Blvd, Compton, CA 90220", lat: 33.8820, lng: -118.2050, type: "transportation" },
  { name: "Compton Medical Center", address: "1550 E Rosecrans Ave, Compton, CA 90221", lat: 33.8750, lng: -118.2050, type: "healthcare" },
  { name: "Compton Community Hospital", address: "1800 E Compton Blvd, Compton, CA 90221", lat: 33.8780, lng: -118.2080, type: "healthcare" },
  { name: "Compton Creek Park", address: "1500 S Central Ave, Compton, CA 90220", lat: 33.8700, lng: -118.2100, type: "recreation" },
  { name: "Compton Park", address: "1506 S Bullis Rd, Compton, CA 90221", lat: 33.8650, lng: -118.2200, type: "recreation" },
  { name: "Compton Residential Area 1", address: "123 E Elm St, Compton, CA 90220", lat: 33.8900, lng: -118.1900, type: "residential" },
  { name: "Compton Residential Area 2", address: "456 W Pine St, Compton, CA 90220", lat: 33.8850, lng: -118.2300, type: "residential" },
  { name: "Compton Residential Area 3", address: "789 S Oak Ave, Compton, CA 90221", lat: 33.8800, lng: -118.1950, type: "residential" }
];

function getRandomAddress() {
  return comptonAddresses[Math.floor(Math.random() * comptonAddresses.length)];
}

// Generate basic diagnostics
function generateVehicleDiagnostics(vehicleId, vehicle) {
  return {
    vehicleId,
    battery: { level: vehicle.battery, health: 95, temperature: 25 },
    engine: { status: 'normal', temperature: 85 },
    alerts: []
  };
}

// Compton boundary coordinates
const COMPTON_BOUNDARY = {
  minLat: 33.87442,
  maxLat: 33.92313,
  minLng: -118.26315,
  maxLng: -118.17995
};

// Function to constrain coordinates within Compton boundary
function constrainToComptonBoundary(lat, lng) {
  return {
    lat: Math.max(COMPTON_BOUNDARY.minLat, Math.min(COMPTON_BOUNDARY.maxLat, lat)),
    lng: Math.max(COMPTON_BOUNDARY.minLng, Math.min(COMPTON_BOUNDARY.maxLng, lng))
  };
}

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

// Charging station locations
const CHARGING_STATIONS = [
  { lat: 33.8958, lng: -118.2201, name: "City Hall Charging Station" },
  { lat: 33.8897, lng: -118.2189, name: "College Charging Station" },
  { lat: 33.8850, lng: -118.2000, name: "Shopping Center Charging Station" },
  { lat: 33.8800, lng: -118.2100, name: "Plaza Charging Station" },
  { lat: 33.8750, lng: -118.2050, name: "Medical Center Charging Station" }
];

// Initialize 15 vehicles at fixed starting locations
function initializeVehicleRoutes() {
  const vehicles = [];
  for (let i = 0; i < 15; i++) {
    const startLocation = VEHICLE_START_LOCATIONS[i % VEHICLE_START_LOCATIONS.length];
    vehicles.push({
      id: `vehicle-${String(i + 1).padStart(3, '0')}`,
      lat: startLocation.lat,
      lng: startLocation.lng,
      status: 'available',
      battery: Math.floor(Math.random() * 40) + 60, // 60-100%
      speed: 0,
      route: [],
      currentIndex: 0
    });
  }
  return vehicles;
}

// Update vehicle position along route
function updateVehiclePosition(vehicle) {
  if (vehicle.route.length === 0 || vehicle.status === 'available' || vehicle.status === 'charging') {
    return vehicle;
  }

  const updatedVehicle = { ...vehicle };
  
  if (updatedVehicle.currentIndex < updatedVehicle.route.length - 1) {
    updatedVehicle.currentIndex++;
    const currentPoint = updatedVehicle.route[updatedVehicle.currentIndex];
    if (currentPoint) {
      updatedVehicle.lat = currentPoint.lat;
      updatedVehicle.lng = currentPoint.lng;
      updatedVehicle.speed = Math.floor(Math.random() * 20) + 15; // 15-35 mph
    }
  }

  // Drain battery while driving
  if (updatedVehicle.status === 'picking-up' || updatedVehicle.status === 'en-route') {
    updatedVehicle.battery = Math.max(0, updatedVehicle.battery - 0.1);
  }
  
  // Charge battery while charging
  if (updatedVehicle.status === 'charging') {
    updatedVehicle.battery = Math.min(100, updatedVehicle.battery + 2);
  }

  return updatedVehicle;
}

// Create simple route between two points
function createSimpleRoute(startLat, startLng, endLat, endLng) {
  const points = 20;
  const route = [];
  
  for (let i = 0; i <= points; i++) {
    const progress = i / points;
    const lat = startLat + (endLat - startLat) * progress;
    const lng = startLng + (endLng - startLng) * progress;
    route.push({
      lat,
      lng,
      timestamp: Date.now() + (i * 2000) // 2 seconds per point
    });
  }
  
  return route;
}

// Assign trip to vehicle
function assignTripToVehicle(vehicle, pickup, destination) {
  // Create route from current position to pickup, then to destination
  const pickupRoute = createSimpleRoute(vehicle.lat, vehicle.lng, pickup.lat, pickup.lng);
  const destinationRoute = createSimpleRoute(pickup.lat, pickup.lng, destination.lat, destination.lng);
  const fullRoute = [...pickupRoute, ...destinationRoute];
  
  return {
    ...vehicle,
    pickup,
    destination,
    route: fullRoute,
    currentIndex: 0,
    startTime: Date.now(),
    status: 'picking-up',
    speed: 25
  };
}

// Send vehicle to charging
function sendVehicleToCharging(vehicle) {
  const nearestCharging = CHARGING_STATIONS[0]; // Use first charging station
  const chargingRoute = createSimpleRoute(vehicle.lat, vehicle.lng, nearestCharging.lat, nearestCharging.lng);
  
  return {
    ...vehicle,
    destination: nearestCharging,
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
      console.log('✅ Simulator connected to backend');
      this.startSimulation();
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Simulator disconnected from backend');
      if (this.interval) {
        clearInterval(this.interval);
      }
    });
  }

  startSimulation() {
    console.log('🚗 Starting Realistic Vehicle Simulator...');
    this.vehicles = initializeVehicleRoutes();
    console.log(`📊 ${this.vehicles.length} vehicles initialized`);

    this.interval = setInterval(() => {
      this.updateVehicles();
      this.generateNewTrips();
      this.sendUpdates();
    }, 2000); // Update every 2 seconds
  }

  updateVehicles() {
    this.vehicles = this.vehicles.map(vehicle => {
      let updatedVehicle = { ...updateVehiclePosition(vehicle) };

      const constrained = constrainToComptonBoundary(updatedVehicle.lat, updatedVehicle.lng);
      updatedVehicle.lat = constrained.lat;
      updatedVehicle.lng = constrained.lng;
      
      if (updatedVehicle.status === 'picking-up' && updatedVehicle.currentIndex >= updatedVehicle.route.length - 1) {
        console.log(`🚗 Vehicle ${updatedVehicle.id} arrived at pickup. Transitioning to en-route.`);
        updatedVehicle.status = 'en-route';
      } else if (updatedVehicle.status === 'en-route' && updatedVehicle.currentIndex >= updatedVehicle.route.length - 1) {
        console.log(`📍 Vehicle ${updatedVehicle.id} arrived at destination, now dropping off.`);
        updatedVehicle.status = 'dropping-off'; 
      } else if (updatedVehicle.status === 'dropping-off' && updatedVehicle.currentIndex >= updatedVehicle.route.length - 1) {
        console.log(`✅ Vehicle ${updatedVehicle.id} completed trip.`);
        updatedVehicle.status = 'available';
        updatedVehicle.route = [];
        updatedVehicle.currentIndex = 0;
        updatedVehicle.speed = 0;
        this.generateNewTripForVehicle(updatedVehicle);
      }

      if (updatedVehicle.status === 'charging' && updatedVehicle.battery >= 95) {
        updatedVehicle.status = 'available';
        console.log(`🔋 Vehicle ${updatedVehicle.id} finished charging.`);
      } else if (updatedVehicle.status === 'en-route-to-charging' && updatedVehicle.currentIndex >= updatedVehicle.route.length - 1) {
        updatedVehicle.status = 'charging';
        console.log(`🔌 Vehicle ${updatedVehicle.id} arrived at charging station.`);
      }

      if (updatedVehicle.status === 'available' && updatedVehicle.battery < 20) {
        this.sendVehicleToCharging(updatedVehicle);
      }

      return updatedVehicle;
    });
  }

  async generateNewTrips() {
    if (Math.random() < 0.5 && this.tripQueue.length < 8) {
      const pickupLocation = getRandomAddress();
      const destinationLocation = getRandomAddress();
      const trip = {
        id: `trip-${Date.now()}`,
        pickup: { lat: pickupLocation.lat, lng: pickupLocation.lng, name: pickupLocation.name },
        destination: { lat: destinationLocation.lat, lng: destinationLocation.lng, name: destinationLocation.name },
        passenger: `Passenger-${Math.floor(Math.random() * 1000)}`
      };
      this.tripQueue.push(trip);
      console.log(`🚕 New trip request: ${trip.pickup.name} → ${trip.destination.name}`);
    }
    await this.assignTripsToVehicles();
  }

  async assignTripsToVehicles() {
    if(this.tripQueue.length === 0) return;
    
    const availableVehicles = this.vehicles.filter(v => v.status === 'available');
    if (availableVehicles.length === 0) return;

    const trip = this.tripQueue.shift();
    
    const nearestVehicle = availableVehicles.reduce((nearest, vehicle) => {
      const distance = Math.sqrt(Math.pow(trip.pickup.lat - vehicle.lat, 2) + Math.pow(trip.pickup.lng - vehicle.lng, 2));
      if (!nearest || distance < nearest.distance) {
        return { vehicle, distance };
      }
      return nearest;
    }, null);

    if (nearestVehicle) {
      console.log(`Assigning trip to ${nearestVehicle.vehicle.id}`);
      const updatedVehicle = assignTripToVehicle(nearestVehicle.vehicle, trip.pickup, trip.destination);
      const index = this.vehicles.findIndex(v => v.id === updatedVehicle.id);
      if (index !== -1) {
        this.vehicles[index] = updatedVehicle;
      }
    } else {
      this.tripQueue.unshift(trip); // put it back if no vehicle found
    }
  }

  async generateNewTripForVehicle(vehicle) {
    try {
      const pickupLocation = getRandomAddress();
      const destinationLocation = getRandomAddress();
      console.log(`🚕 Vehicle ${vehicle.id} getting new trip: ${pickupLocation.name} → ${destinationLocation.name}`);
      const updatedVehicle = assignTripToVehicle(
        vehicle,
        { lat: pickupLocation.lat, lng: pickupLocation.lng, name: pickupLocation.name },
        { lat: destinationLocation.lat, lng: destinationLocation.lng, name: destinationLocation.name }
      );
      const index = this.vehicles.findIndex(v => v.id === updatedVehicle.id);
      if (index !== -1) {
        this.vehicles[index] = updatedVehicle;
      }
    } catch (error) {
      console.error('Failed to generate new trip for vehicle:', error);
    }
  }
  
  async sendVehicleToCharging(vehicle) {
    const updatedVehicle = sendVehicleToCharging(vehicle);
    const index = this.vehicles.findIndex(v => v.id === updatedVehicle.id);
    if (index !== -1) {
      this.vehicles[index] = updatedVehicle;
    }
  }

  sendUpdates() {
    if (!this.socket) return;
    this.vehicles.forEach(vehicle => {
      const diagnostics = generateVehicleDiagnostics(vehicle.id, vehicle);
      const updatePayload = {
        id: vehicle.id,
        type: vehicle.id.includes('cybertruck') ? 'Cybertruck' : vehicle.id.includes('modely') ? 'Model Y' : 'Model X',
        status: vehicle.status,
        lat: vehicle.lat,
        lng: vehicle.lng,
        battery: vehicle.battery,
        speed: vehicle.speed,
        route: vehicle.route,
        currentIndex: vehicle.currentIndex,
        diagnostics,
      };
      this.socket.emit('vehicle-update', updatePayload);
    });
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    if (this.socket) {
      this.socket.disconnect();
    }
    console.log('Simulator stopped.');
  }
}

const simulator = new RealisticVehicleSimulator();
simulator.start();

process.on('SIGINT', () => {
  simulator.stop();
  process.exit(0);
}); 