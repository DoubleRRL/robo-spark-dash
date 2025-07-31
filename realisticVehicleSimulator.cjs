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

// Get vehicle type based on vehicle ID
function getVehicleType(vehicleId) {
  const vehicleNumber = parseInt(vehicleId.replace('vehicle-', ''));
  if (vehicleNumber <= 5) return 'Cybertruck';
  if (vehicleNumber <= 10) return 'Model Y';
  return 'Model X';
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

// Compton boundary polygon coordinates (accurate)
const COMPTON_POLYGON = [
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
function isPointInCompton(lat, lng) {
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

// Compton boundary coordinates
const COMPTON_BOUNDARY = {
  minLat: 33.86303,
  maxLat: 33.92313,
  minLng: -118.26315,
  maxLng: -118.17995
};

// Function to constrain coordinates within Compton boundary
function constrainToComptonBoundary(lat, lng) {
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
  
  console.log(`⚠️ Point (${lat.toFixed(4)}, ${lng.toFixed(4)}) outside Compton, constrained to (${closestPoint.lat.toFixed(4)}, ${closestPoint.lng.toFixed(4)})`);
  return { lat: closestPoint.lat, lng: closestPoint.lng };
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
      // Ensure the point is within Compton boundary
      const constrained = constrainToComptonBoundary(currentPoint.lat, currentPoint.lng);
      updatedVehicle.lat = constrained.lat;
      updatedVehicle.lng = constrained.lng;
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

// Create realistic route between two points using OSRM
async function createRealisticRoute(startLat, startLng, endLat, endLng) {
  // Make sure start and end points are within Compton
  const startPoint = constrainToComptonBoundary(startLat, startLng);
  const endPoint = constrainToComptonBoundary(endLat, endLng);
  
  try {
    // Try OSRM first for realistic routing
    const response = await fetch(
      `http://localhost:5000/route/v1/driving/${startPoint.lng},${startPoint.lat};${endPoint.lng},${endPoint.lat}?overview=full&geometries=geojson`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.routes && data.routes[0]) {
        const coordinates = data.routes[0].geometry.coordinates;
        const duration = data.routes[0].duration;
        
        // Convert to route points with timestamps and ensure all points are within Compton
        const route = coordinates.map((coord, index) => {
          const point = {
            lat: coord[1],
            lng: coord[0],
            timestamp: Date.now() + (index * (duration * 1000 / coordinates.length))
          };
          
          // Ensure point is within Compton
          return constrainToComptonBoundary(point.lat, point.lng);
        });
        
        console.log(`✅ Created realistic OSRM route with ${route.length} points, all within Compton boundary`);
        return route;
      }
    }
  } catch (error) {
    console.log(`⚠️ OSRM failed, using fallback route:`, error);
  }
  
  // Fallback: create curved route (not straight line)
  const points = 15;
  const route = [];
  
  for (let i = 0; i <= points; i++) {
    const progress = i / points;
    
    // Add some curve to make it more realistic
    const curve = Math.sin(progress * Math.PI) * 0.001;
    const lat = startPoint.lat + (endPoint.lat - startPoint.lat) * progress + curve;
    const lng = startPoint.lng + (endPoint.lng - startPoint.lng) * progress + curve;
    
    // Ensure within Compton bounds
    const constrained = constrainToComptonBoundary(lat, lng);
    
    route.push({
      lat: constrained.lat,
      lng: constrained.lng,
      timestamp: Date.now() + (i * 3000) // 3 seconds per point
    });
  }
  
  console.log(`✅ Created fallback curved route with ${route.length} points, all within Compton boundary`);
  return route;
}

// Update the assignment function to use realistic routes
async function assignTripToVehicle(vehicle, pickup, destination) {
  // Ensure pickup and destination are within Compton
  const safePickup = constrainToComptonBoundary(pickup.lat, pickup.lng);
  const safeDestination = constrainToComptonBoundary(destination.lat, destination.lng);
  
  pickup = { ...pickup, lat: safePickup.lat, lng: safePickup.lng };
  destination = { ...destination, lat: safeDestination.lat, lng: safeDestination.lng };
  
  // Create route from current position to pickup, then to destination
  const pickupRoute = await createRealisticRoute(vehicle.lat, vehicle.lng, pickup.lat, pickup.lng);
  const destinationRoute = await createRealisticRoute(pickup.lat, pickup.lng, destination.lat, destination.lng);
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
async function sendVehicleToCharging(vehicle) {
  const nearestCharging = CHARGING_STATIONS[0]; // Use first charging station
  const chargingRoute = await createRealisticRoute(vehicle.lat, vehicle.lng, nearestCharging.lat, nearestCharging.lng);
  
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

      // Always ensure vehicle is within Compton boundary
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
      
      // Ensure pickup and destination are within Compton
      const safePickup = constrainToComptonBoundary(pickupLocation.lat, pickupLocation.lng);
      const safeDestination = constrainToComptonBoundary(destinationLocation.lat, destinationLocation.lng);
      
      const trip = {
        id: `trip-${Date.now()}`,
        pickup: { 
          lat: safePickup.lat, 
          lng: safePickup.lng, 
          name: pickupLocation.name 
        },
        destination: { 
          lat: safeDestination.lat, 
          lng: safeDestination.lng, 
          name: destinationLocation.name 
        },
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
      const updatedVehicle = await assignTripToVehicle(nearestVehicle.vehicle, trip.pickup, trip.destination);
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
      
      // Ensure pickup and destination are within Compton
      const safePickup = constrainToComptonBoundary(pickupLocation.lat, pickupLocation.lng);
      const safeDestination = constrainToComptonBoundary(destinationLocation.lat, destinationLocation.lng);
      
      console.log(`🚕 Vehicle ${vehicle.id} getting new trip: ${pickupLocation.name} → ${destinationLocation.name}`);
      const updatedVehicle = await assignTripToVehicle(
        vehicle,
        { 
          lat: safePickup.lat, 
          lng: safePickup.lng, 
          name: pickupLocation.name 
        },
        { 
          lat: safeDestination.lat, 
          lng: safeDestination.lng, 
          name: destinationLocation.name 
        }
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
    const updatedVehicle = await sendVehicleToCharging(vehicle);
    const index = this.vehicles.findIndex(v => v.id === updatedVehicle.id);
    if (index !== -1) {
      this.vehicles[index] = updatedVehicle;
    }
  }

  sendUpdates() {
    if (!this.socket) return;
    console.log(`📡 Sending updates for ${this.vehicles.length} vehicles...`);
    
    // Send vehicle updates
    this.vehicles.forEach(vehicle => {
      // Ensure vehicle is within Compton before sending update
      const constrained = constrainToComptonBoundary(vehicle.lat, vehicle.lng);
      
      const diagnostics = generateVehicleDiagnostics(vehicle.id, vehicle);
      const updatePayload = {
        id: vehicle.id,
        type: getVehicleType(vehicle.id),
        status: vehicle.status,
        lat: constrained.lat,
        lng: constrained.lng,
        battery: vehicle.battery,
        speed: vehicle.speed,
        route: vehicle.route,
        currentIndex: vehicle.currentIndex,
        diagnostics,
      };
      console.log(`🚗 Sending update for ${vehicle.id}: status=${vehicle.status}, lat=${constrained.lat.toFixed(4)}`);
      this.socket.emit('vehicle-update', updatePayload);
    });
    
    // Send trip data for pickup icons
    const activeTrips = this.vehicles
      .filter(v => v.status === 'picking-up' || v.status === 'en-route')
      .map(vehicle => {
        const pickup = vehicle.pickup || getRandomAddress();
        const destination = vehicle.destination || getRandomAddress();
        return {
          id: vehicle.id,
          pickupLocation: {
            name: pickup.name || pickup.address,
            address: pickup.address,
            lat: pickup.lat,
            lng: pickup.lng,
            type: pickup.type || 'pickup'
          },
          destinationLocation: {
            name: destination.name || destination.address,
            address: destination.address,
            lat: destination.lat,
            lng: destination.lng,
            type: destination.type || 'destination'
          },
          passenger: `Passenger-${Math.floor(Math.random() * 1000)}`,
          status: vehicle.status === 'picking-up' ? 'ride requested' : 'en-route'
        };
      });
    
    if (activeTrips.length > 0) {
      console.log(`📍 Sending ${activeTrips.length} active trips for pickup icons`);
      this.socket.emit('trip-updates', activeTrips);
    }
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