import { Router } from 'express';
import { spawn } from 'child_process';
import axios from 'axios';
import * as vehicleController from '../controllers/vehicleController';
import { snapToRoad } from '../utils/osrm';
import { pool } from '../utils/dbInit';

const router = Router();

// GET /api/v1/vehicles - Get all vehicles
router.get('/', async (req, res) => {
  try {
    console.log('Attempting to fetch vehicles from database...');
    const { rows } = await pool.query(`
      SELECT 
        v.*,
        r.waypoints as route,
        r.pickup_location,
        r.destination,
        r.status as route_status
      FROM vehicles v
      LEFT JOIN routes r ON v.id = r.vehicle_id
      ORDER BY v.id
    `);
    
    console.log(`Found ${rows.length} vehicles in database`);
    
    // Transform the data to match frontend expectations
    const vehicles = rows.map(row => {
      let route = [];
      let pickupLocation = null;
      let destination = null;
      
      try {
        if (row.route) {
          route = typeof row.route === 'string' ? JSON.parse(row.route) : row.route;
        }
        if (row.pickup_location) {
          pickupLocation = typeof row.pickup_location === 'string' ? JSON.parse(row.pickup_location) : row.pickup_location;
        }
        if (row.destination) {
          destination = typeof row.destination === 'string' ? JSON.parse(row.destination) : row.destination;
        }
      } catch (parseError) {
        console.warn(`JSON parse error for vehicle ${row.id}:`, parseError);
      }
      
      return {
        id: row.id,
        type: row.type,
        status: row.status,
        lat: row.lat,
        lng: row.lng,
        progress: row.progress,
        battery: row.battery,
        speed: row.speed,
        eta: row.eta,
        heading: row.heading,
        route,
        pickupLocation,
        destination
      };
    });
    
    console.log('Sending vehicles response:', vehicles.length, 'vehicles');
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// POST /api/v1/vehicles/:id/route
router.post('/', vehicleController.createVehicle);
router.get('/:id', vehicleController.getVehicle);
router.post('/:id/route', vehicleController.createRoute);
router.get('/:id/route', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT waypoints, pickup_location, destination, status
      FROM routes 
      WHERE vehicle_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [req.params.id]);
    
    if (rows.length > 0) {
      const route = rows[0];
      res.json({
        waypoints: route.waypoints,
        pickupLocation: route.pickup_location,
        destination: route.destination,
        status: route.status
      });
    } else {
      res.status(404).json({ error: 'No route found for vehicle' });
    }
  } catch (error) {
    console.error('Error fetching vehicle route:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle route' });
  }
});
router.get('/route/:id', vehicleController.getRoute);
router.post('/:id/lock', vehicleController.lockVehicle);
router.post('/:id/unlock', vehicleController.unlockVehicle);
router.post('/:id/stop', vehicleController.stopVehicle);
router.post('/:id/reroute', vehicleController.rerouteVehicle);

// POST /api/v1/vehicles/snap-route
router.post('/snap-route', async (req, res) => {
  const { waypoints } = req.body;
  if (!waypoints || waypoints.length < 2) return res.status(400).json({ error: 'need at least 2 waypoints' });
  
  try {
    const snapped = await snapToRoad(waypoints);
    res.json({ snapped });
  } catch (e: any) {
    console.error('OSRM snap error:', e);
    res.status(500).json({ error: 'osrm error', details: e.message });
  }
});

export default router; 