import { io } from 'socket.io-client';
import { 
  initializeVehicleRoutes, 
  updateVehiclePosition, 
  assignTripToVehicle, 
  sendVehicleToCharging,
  VehicleRoute 
} from './vehicleRouting';
import { getRandomAddress } from './comptonAddresses';

class RealisticVehicleSimulator {
  private vehicles: VehicleRoute[] = [];
  private socket: any;
  private interval: NodeJS.Timeout | null = null;
  private tripQueue: Array<{
    id: string;
    pickup: { lat: number; lng: number; name: string };
    destination: { lat: number; lng: number; name: string };
    passenger: string;
  }> = [];

  constructor() {
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

  private startSimulation() {
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

  private updateVehicles() {
    this.vehicles = this.vehicles.map(vehicle => {
      const updatedVehicle = updateVehiclePosition(vehicle);
      
      // Handle trip completion
      if (updatedVehicle.status === 'busy' && 
          updatedVehicle.currentIndex >= updatedVehicle.route.length - 1) {
        updatedVehicle.status = 'idle'; // Change to idle instead of available
        updatedVehicle.route = [];
        updatedVehicle.currentIndex = 0;
        updatedVehicle.speed = 0;
        console.log(`✅ Vehicle ${updatedVehicle.id} completed trip, now idle`);
        
        // Set a timer to make vehicle available again after idle time
        setTimeout(() => {
          const vehicleIndex = this.vehicles.findIndex(v => v.id === updatedVehicle.id);
          if (vehicleIndex !== -1) {
            this.vehicles[vehicleIndex].status = 'available';
            console.log(`🚗 Vehicle ${updatedVehicle.id} became available after idle time`);
          }
        }, Math.random() * 10000 + 5000); // 5-15 seconds of idle time
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
      
      // Log vehicle movement for debugging
      if (updatedVehicle.status === 'busy' && updatedVehicle.route.length > 0) {
        const currentPoint = updatedVehicle.route[updatedVehicle.currentIndex];
        const isAtPickup = updatedVehicle.pickup && 
          Math.abs(updatedVehicle.lat - updatedVehicle.pickup.lat) < 0.001 &&
          Math.abs(updatedVehicle.lng - updatedVehicle.pickup.lng) < 0.001;
        
        if (isAtPickup && updatedVehicle.currentIndex < updatedVehicle.route.length / 2) {
          console.log(`🚗 Vehicle ${updatedVehicle.id} arrived at pickup: ${updatedVehicle.pickup?.name}`);
        }
        
        console.log(`📍 Vehicle ${updatedVehicle.id} at ${updatedVehicle.lat.toFixed(4)}, ${updatedVehicle.lng.toFixed(4)} - Status: ${updatedVehicle.status} - Speed: ${updatedVehicle.speed.toFixed(1)} mph`);
      }
      
      // Send low battery vehicles to charging
      if (updatedVehicle.status === 'available' && updatedVehicle.battery < 20) {
        this.sendVehicleToCharging(updatedVehicle.id);
      }
      
      return updatedVehicle;
    });
  }

  private async generateNewTrips() {
    // Generate new trip requests occasionally
    if (Math.random() < 0.3 && this.tripQueue.length < 5) { // 30% chance, max 5 queued
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
    this.assignTripsToVehicles();
  }

  private async assignTripsToVehicles() {
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
      }, null as { vehicle: VehicleRoute; distance: number } | null);
      
      if (nearestVehicle) {
        try {
          console.log(`🚕 Assigning trip ${trip.id} to vehicle ${nearestVehicle.vehicle.id}`);
          console.log(`📍 Pickup: ${trip.pickup.name} (${trip.pickup.lat.toFixed(4)}, ${trip.pickup.lng.toFixed(4)})`);
          console.log(`🎯 Destination: ${trip.destination.name} (${trip.destination.lat.toFixed(4)}, ${trip.destination.lng.toFixed(4)})`);
          
          const updatedVehicle = await assignTripToVehicle(
            nearestVehicle.vehicle,
            trip.pickup,
            trip.destination
          );
          
          // Update vehicle in array
          const index = this.vehicles.findIndex(v => v.id === updatedVehicle.id);
          if (index !== -1) {
            this.vehicles[index] = updatedVehicle;
            console.log(`✅ Vehicle ${updatedVehicle.id} now has route with ${updatedVehicle.route.length} points`);
            console.log(`🚗 Vehicle ${updatedVehicle.id} starting from (${updatedVehicle.lat.toFixed(4)}, ${updatedVehicle.lng.toFixed(4)})`);
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

  private async sendVehicleToCharging(vehicleId: string) {
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

  private sendUpdates() {
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

  private generateDiagnostics(vehicle: VehicleRoute) {
    const vehicleType = this.getVehicleType(vehicle.id);
    
    // Camera occlusion - 2% chance of being bad, only set once on app load
    const cameraOcclusion = Math.random() < 0.02 ? 'bad' : 'good';
    
    // Tire pressure based on vehicle type
    const targetPSI = vehicleType === 'cybertruck' ? 50 : 42;
    const tirePressure = [
      targetPSI + (Math.random() - 0.5) * 4, // Front left
      targetPSI + (Math.random() - 0.5) * 4, // Front right  
      targetPSI + (Math.random() - 0.5) * 4, // Rear left
      targetPSI + (Math.random() - 0.5) * 4  // Rear right
    ];
    
    // FSD errors - random count, higher chance when battery is low
    const fsdErrors = vehicle.battery < 30 ? 
      Math.floor(Math.random() * 5) + 1 : 
      Math.floor(Math.random() * 3);
    
    // Motor temperature based on status and speed
    const baseTemp = 45;
    const speedFactor = vehicle.speed / 60; // Higher speed = higher temp
    const statusFactor = vehicle.status === 'busy' ? 1.2 : 1.0;
    const motorTemperature = baseTemp + (speedFactor * 20 * statusFactor) + (Math.random() - 0.5) * 10;
    
    return {
      cameraOcclusion,
      tirePressure,
      fsdErrors,
      motorTemperature: Math.round(motorTemperature * 10) / 10,
      alerts: this.generateAlerts(vehicle, cameraOcclusion, tirePressure, fsdErrors)
    };
  }

  private generateAlerts(vehicle: VehicleRoute, cameraOcclusion: string, tirePressure: number[], fsdErrors: number) {
    const alerts = [];
    
    if (cameraOcclusion === 'bad') {
      alerts.push({
        id: 'camera-occlusion',
        message: 'Camera system occluded',
        recommendedAction: 'Remove vehicle from fleet immediately',
        severity: 'critical',
        category: 'safety'
      });
    }
    
    if (vehicle.battery <= 20) {
      alerts.push({
        id: 'low-battery',
        message: 'Battery level critical',
        recommendedAction: 'Vehicle will proceed to charging station',
        severity: 'warning',
        category: 'battery'
      });
    }
    
    const lowTirePressure = tirePressure.some(p => p < 38);
    if (lowTirePressure) {
      alerts.push({
        id: 'low-tire-pressure',
        message: 'Low tire pressure detected',
        recommendedAction: 'Check tire pressure at next service',
        severity: 'warning',
        category: 'mechanical'
      });
    }
    
    if (fsdErrors > 3) {
      alerts.push({
        id: 'fsd-errors',
        message: 'Multiple FSD errors detected',
        recommendedAction: 'Review vehicle logs and consider maintenance',
        severity: 'warning',
        category: 'autonomy'
      });
    }
    
    return alerts;
  }

  private getVehicleType(vehicleId: string): string {
    const num = parseInt(vehicleId.split('-')[1]);
    if (num <= 5) return 'cybertruck';
    if (num <= 10) return 'modely';
    return 'modelx';
  }

  private calculateETA(vehicle: VehicleRoute): string {
    if (vehicle.status === 'available') return '0 min';
    
    const remainingPoints = vehicle.route.length - vehicle.currentIndex;
    const estimatedMinutes = Math.ceil(remainingPoints * 0.5); // Rough estimate
    
    return `${estimatedMinutes} min`;
  }

  private calculateHeading(vehicle: VehicleRoute): number {
    if (vehicle.route.length === 0 || vehicle.currentIndex >= vehicle.route.length - 1) {
      return 0;
    }
    
    const current = vehicle.route[vehicle.currentIndex];
    const next = vehicle.route[vehicle.currentIndex + 1];
    
    const deltaLng = next.lng - current.lng;
    const deltaLat = next.lat - current.lat;
    
    return Math.atan2(deltaLng, deltaLat) * 180 / Math.PI;
  }

  public stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.socket.disconnect();
    console.log('🛑 Realistic Vehicle Simulator Stopped');
  }
}

// Start simulator
const simulator = new RealisticVehicleSimulator();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping realistic simulator...');
  simulator.stop();
  process.exit(0);
}); 