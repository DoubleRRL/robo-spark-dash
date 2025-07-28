import { Request, Response } from 'express';
import * as Vehicle from '../models/Vehicle';
import * as Route from '../models/Route';
import { getGoogleMapsRoute, geocodeAddress } from '../utils/googleMaps';

export async function createVehicle(req: Request, res: Response) {
  await Vehicle.createVehicle(req.body);
  res.json({ ok: true });
}

export async function getVehicle(req: Request, res: Response) {
  const v = await Vehicle.getVehicle(req.params.id);
  res.json(v);
}

export async function createRoute(req: Request, res: Response) {
  await Route.createRoute(req.body);
  res.json({ ok: true });
}

export async function getRoute(req: Request, res: Response) {
  const r = await Route.getRoute(req.params.id);
  res.json(r);
}

export async function lockVehicle(req: Request, res: Response) {
  // TODO: actually lock in sim
  res.json({ ok: true, message: `Vehicle ${req.params.id} locked.` });
}

export async function unlockVehicle(req: Request, res: Response) {
  res.json({ ok: true, message: `Vehicle ${req.params.id} unlocked.` });
}

export async function stopVehicle(req: Request, res: Response) {
  res.json({ ok: true, message: `Vehicle ${req.params.id} emergency stopped.` });
}

export async function rerouteVehicle(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { destination, address } = req.body;
    
    // Get the vehicle's current location
    const vehicle = await Vehicle.getVehicle(id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    let destLat: number, destLng: number, destName: string;
    
    // If address is provided, geocode it
    if (address && typeof address === 'string') {
      const geoResult = await geocodeAddress(address);
      
      if (!geoResult) {
        return res.status(400).json({ error: 'Failed to geocode address' });
      }
      
      destLat = geoResult.lat;
      destLng = geoResult.lng;
      destName = address;
    } 
    // If coordinates are provided directly
    else if (destination && typeof destination.lat === 'number' && typeof destination.lng === 'number') {
      destLat = destination.lat;
      destLng = destination.lng;
      destName = destination.name || `Location (${destLat.toFixed(4)}, ${destLng.toFixed(4)})`;
    } else {
      return res.status(400).json({ error: 'Invalid destination format' });
    }
    
    // Get route from Google Maps
    const route = await getGoogleMapsRoute(
      vehicle.lat, 
      vehicle.lng, 
      destLat, 
      destLng
    );
    
    // Format waypoints for storage
    const waypoints = route.map((point, index) => ({
      lat: point[0],
      lng: point[1],
      timestamp: Date.now() + (index * 30000) // 30 seconds between points
    }));
    
    // Create a new route in the database
    await Route.createRoute({
      vehicle_id: id,
      waypoints: JSON.stringify(waypoints),
      destination: JSON.stringify({
        lat: destLat,
        lng: destLng,
        name: destName
      }),
      status: 'active'
    });
    
    res.json({ 
      ok: true, 
      message: `Vehicle ${id} rerouted to ${destName}.`,
      route: waypoints
    });
  } catch (error) {
    console.error('Error rerouting vehicle:', error);
    res.status(500).json({ error: 'Failed to reroute vehicle', details: error instanceof Error ? error.message : 'Unknown error' });
  }
} 