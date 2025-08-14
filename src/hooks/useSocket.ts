import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface RoutePoint {
  lat: number;
  lng: number;
}

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface VehicleUpdate {
  id: string;
  type: string;
  status: string;
  lat: number;
  lng: number;
  progress: number;
  battery: number;
  speed: number;
  eta: string;
  heading: number;
  route?: RoutePoint[];
  currentIndex?: number;
  pickupLocation?: Location;
  destination?: Location;
  diagnostics?: Record<string, unknown>; // Add diagnostics field
  updatedAt?: number;
}

interface TripUpdate {
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
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  vehicles: VehicleUpdate[];
  lastUpdate: VehicleUpdate | null;
  trips: TripUpdate[];
}

export const useSocket = (): UseSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleUpdate[]>([]);
  const [lastUpdate, setLastUpdate] = useState<VehicleUpdate | null>(null);
  const [trips, setTrips] = useState<TripUpdate[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const vehiclesRef = useRef<VehicleUpdate[]>([]);
  const lastTimestampsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    console.log('🔌 Initializing socket connection...');
    
    // create socket connection
    const socket = io('http://localhost:8000/vehicles', {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // connection events
    socket.on('connect', () => {
      console.log('✅ connected to vehicle socket');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ disconnected from vehicle socket');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('🚫 socket connection error:', error);
    });

    // vehicle update events
    socket.on('vehicle-update', (data: VehicleUpdate) => {
      console.log('🔄 received vehicle update:', data.id, 'status:', data.status, 'lat:', data.lat, 'lng:', data.lng);
      setLastUpdate(data);
      const nowTs = typeof data.updatedAt === 'number' ? data.updatedAt : Date.now();
      const lastTs = lastTimestampsRef.current[data.id] || 0;
      if (nowTs < lastTs) {
        console.log(`⏭️  Ignoring stale update for ${data.id}: ${nowTs} < ${lastTs}`);
        return;
      }
      lastTimestampsRef.current[data.id] = nowTs;
      
      setVehicles(prev => {
        console.log('📊 updating vehicles state, current count:', prev.length);
        const existingIndex = prev.findIndex(v => v.id === data.id);
        
        if (existingIndex !== -1) {
          // Update existing vehicle by creating a new array but preserving object references
          const newVehicles = [...prev];
          // Only update the specific vehicle that changed
          newVehicles[existingIndex] = {
            ...newVehicles[existingIndex], // Preserve existing properties
            ...data // Override with new data
          };
          console.log('✅ updated existing vehicle:', data.id, 'new status:', newVehicles[existingIndex].status);
          return newVehicles;
        } else {
          // Add new vehicle
          console.log('➕ adding new vehicle:', data.id);
          return [...prev, data];
        }
      });
    });

    // trip update events
    socket.on('trip-updates', (data: TripUpdate[]) => {
      console.log('📍 received trip updates:', data.length, 'trips');
      setTrips(data);
    });

    // cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    vehicles,
    lastUpdate,
    trips,
  };
}; 