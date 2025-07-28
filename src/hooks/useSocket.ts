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
  diagnostics?: any; // Add diagnostics field
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  vehicles: VehicleUpdate[];
  lastUpdate: VehicleUpdate | null;
}

export const useSocket = (): UseSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleUpdate[]>([]);
  const [lastUpdate, setLastUpdate] = useState<VehicleUpdate | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const vehiclesRef = useRef<VehicleUpdate[]>([]);

  useEffect(() => {
    // create socket connection
    const socket = io('http://localhost:8000/vehicles', {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // connection events
    socket.on('connect', () => {
      console.log('connected to vehicle socket');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('disconnected from vehicle socket');
      setIsConnected(false);
    });

    // vehicle update events
    socket.on('vehicle-update', (data: VehicleUpdate) => {
      console.log('received vehicle update:', data);
      setLastUpdate(data);
      
      setVehicles(prev => {
        const existingIndex = prev.findIndex(v => v.id === data.id);
        
        if (existingIndex !== -1) {
          // Update existing vehicle by creating a new array but preserving object references
          const newVehicles = [...prev];
          // Only update the specific vehicle that changed
          newVehicles[existingIndex] = {
            ...newVehicles[existingIndex], // Preserve existing properties
            ...data // Override with new data
          };
          return newVehicles;
        } else {
          // Add new vehicle
          return [...prev, data];
        }
      });
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
  };
}; 