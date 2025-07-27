import { io } from 'socket.io-client';

// connect to the backend
const socket = io('http://localhost:8000/vehicles');

console.log('🚗 Vehicle Simulator Starting...');

// simulate vehicle data in Compton, CA - 15 vehicles
const vehicles = [
  // Cybertrucks
  { id: 'cybertruck-001', type: 'cybertruck', status: 'available', lat: 33.8958, lng: -118.2201, progress: 0, battery: 85, speed: 0, eta: '0 min', heading: 0 },
  { id: 'cybertruck-002', type: 'cybertruck', status: 'busy', lat: 33.8897, lng: -118.2189, progress: 45, battery: 72, speed: 25, eta: '8 min', heading: 45 },
  { id: 'cybertruck-003', type: 'cybertruck', status: 'charging', lat: 33.8889, lng: -118.2350, progress: 0, battery: 35, speed: 0, eta: '0 min', heading: 0 },
  { id: 'cybertruck-004', type: 'cybertruck', status: 'available', lat: 33.8765, lng: -118.2100, progress: 0, battery: 92, speed: 0, eta: '0 min', heading: 0 },
  { id: 'cybertruck-005', type: 'cybertruck', status: 'busy', lat: 33.8820, lng: -118.2250, progress: 30, battery: 68, speed: 20, eta: '12 min', heading: 90 },
  
  // Model Y vehicles
  { id: 'modely-001', type: 'modely', status: 'available', lat: 33.8700, lng: -118.2150, progress: 0, battery: 78, speed: 0, eta: '0 min', heading: 0 },
  { id: 'modely-002', type: 'modely', status: 'busy', lat: 33.8850, lng: -118.2000, progress: 60, battery: 55, speed: 18, eta: '5 min', heading: 135 },
  { id: 'modely-003', type: 'modely', status: 'charging', lat: 33.8600, lng: -118.2300, progress: 0, battery: 42, speed: 0, eta: '0 min', heading: 0 },
  { id: 'modely-004', type: 'modely', status: 'available', lat: 33.8900, lng: -118.1900, progress: 0, battery: 88, speed: 0, eta: '0 min', heading: 0 },
  { id: 'modely-005', type: 'modely', status: 'busy', lat: 33.8750, lng: -118.2050, progress: 75, battery: 48, speed: 22, eta: '3 min', heading: 270 },
  
  // Model X vehicles
  { id: 'modelx-001', type: 'modelx', status: 'available', lat: 33.8650, lng: -118.2200, progress: 0, battery: 95, speed: 0, eta: '0 min', heading: 0 },
  { id: 'modelx-002', type: 'modelx', status: 'charging', lat: 33.8800, lng: -118.2400, progress: 0, battery: 28, speed: 0, eta: '0 min', heading: 0 },
  { id: 'modelx-003', type: 'modelx', status: 'busy', lat: 33.8920, lng: -118.1950, progress: 15, battery: 82, speed: 16, eta: '15 min', heading: 180 },
  { id: 'modelx-004', type: 'modelx', status: 'available', lat: 33.8680, lng: -118.2250, progress: 0, battery: 76, speed: 0, eta: '0 min', heading: 0 },
  { id: 'modelx-005', type: 'modelx', status: 'busy', lat: 33.8830, lng: -118.2100, progress: 90, battery: 38, speed: 12, eta: '2 min', heading: 45 }
];

let currentVehicleIndex = 0;

// send vehicle updates every 3 seconds
const interval = setInterval(() => {
  const vehicle = vehicles[currentVehicleIndex];
  
  // simulate some movement within Compton boundaries
  vehicle.lat += (Math.random() - 0.5) * 0.002;
  vehicle.lng += (Math.random() - 0.5) * 0.002;
  
  // keep vehicles within Compton boundaries
  vehicle.lat = Math.max(33.856, Math.min(33.896, vehicle.lat));
  vehicle.lng = Math.max(-118.235, Math.min(-118.185, vehicle.lng));
  
  // simulate battery drain for busy vehicles
  if (vehicle.status === 'busy') {
    vehicle.battery = Math.max(0, vehicle.battery - 0.5);
    vehicle.progress = Math.min(100, vehicle.progress + 5);
    
    if (vehicle.progress >= 100) {
      vehicle.status = 'available';
      vehicle.progress = 0;
      vehicle.speed = 0;
    }
  }
  
  // simulate charging
  if (vehicle.status === 'charging') {
    vehicle.battery = Math.min(100, vehicle.battery + 2);
    if (vehicle.battery >= 80) {
      vehicle.status = 'available';
    }
  }
  
  // simulate speed changes
  if (vehicle.status === 'busy') {
    vehicle.speed = Math.floor(Math.random() * 30) + 15;
  } else {
    vehicle.speed = 0;
  }
  
  console.log(`📡 Sending update for ${vehicle.id}: ${vehicle.status}, ${vehicle.battery}% battery, ${vehicle.speed} mph`);
  
  socket.emit('vehicle-update', vehicle);
  
  // cycle through vehicles
  currentVehicleIndex = (currentVehicleIndex + 1) % vehicles.length;
}, 3000);

// handle connection
socket.on('connect', () => {
  console.log('✅ Connected to backend');
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from backend');
});

// cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping simulator...');
  clearInterval(interval);
  socket.disconnect();
  process.exit(0);
});

console.log('🚀 Simulator running. Press Ctrl+C to stop.'); 