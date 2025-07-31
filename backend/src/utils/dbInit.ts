import { Pool } from 'pg';
import axios from 'axios';

export const pool = new Pool({
  user: 'user',
  password: 'pass',
  host: 'localhost',
  port: 5432,
  database: 'robotaxi',
  ssl: false
});

// Compton city boundary constraints
const COMPTON_BOUNDS = {
  latMin: 33.87442,
  latMax: 33.92313,
  lngMin: -118.26315,
  lngMax: -118.17995
};

function randomCoord() {
  return [
    COMPTON_BOUNDS.latMin + Math.random() * (COMPTON_BOUNDS.latMax - COMPTON_BOUNDS.latMin),
    COMPTON_BOUNDS.lngMin + Math.random() * (COMPTON_BOUNDS.lngMax - COMPTON_BOUNDS.lngMin)
  ];
}

// Validate coordinates are within Compton
function isWithinCompton(lat: number, lng: number): boolean {
  return lat >= COMPTON_BOUNDS.latMin && lat <= COMPTON_BOUNDS.latMax && 
         lng >= COMPTON_BOUNDS.lngMin && lng <= COMPTON_BOUNDS.lngMax;
}

async function randomRoute() {
  const start = randomCoord();
  const end = randomCoord();

  // Ensure both start and end are within Compton
  if (!isWithinCompton(start[0], start[1]) || !isWithinCompton(end[0], end[1])) {
    console.log('Route coordinates outside Compton, regenerating...');
    return randomRoute();
  }

  // Simple fallback route - just a straight line with some intermediate points
  const waypoints = [
    start,
    [start[0] + (end[0] - start[0]) * 0.25, start[1] + (end[1] - start[1]) * 0.25],
    [start[0] + (end[0] - start[0]) * 0.5, start[1] + (end[1] - start[1]) * 0.5],
    [start[0] + (end[0] - start[0]) * 0.75, start[1] + (end[1] - start[1]) * 0.75],
    end
  ];

  // Validate all waypoints are within Compton
  for (const [lat, lng] of waypoints) {
    if (!isWithinCompton(lat, lng)) {
      console.log('Waypoint outside Compton, regenerating route...');
      return randomRoute();
    }
  }

  return { waypoints, start, end };
}

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      type TEXT,
      status TEXT,
      lat DOUBLE PRECISION,
      lng DOUBLE PRECISION,
      progress INTEGER DEFAULT 0,
      battery INTEGER DEFAULT 100,
      speed INTEGER DEFAULT 0,
      eta TEXT DEFAULT '0 min',
      heading INTEGER DEFAULT 0
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      vehicle_id TEXT,
      waypoints JSONB,
      pickup_location JSONB,
      destination JSONB,
      status TEXT
    );
  `);
  
  // Add missing columns if they don't exist
  try {
    await pool.query('ALTER TABLE routes ADD COLUMN IF NOT EXISTS pickup_location JSONB');
    await pool.query('ALTER TABLE routes ADD COLUMN IF NOT EXISTS destination JSONB');
  } catch (error) {
    console.log('Columns may already exist:', error);
  }
  // seed vehicles if table is empty
  const { rows } = await pool.query('SELECT COUNT(*) FROM vehicles');
  if (parseInt(rows[0].count) === 0) {
    const vehicles = [
      ...Array.from({ length: 4 }, (_, i) => ({ id: `cybertruck-${i+1}`, type: 'cybertruck' })),
      ...Array.from({ length: 8 }, (_, i) => ({ id: `modely-${i+1}`, type: 'modely' })),
      ...Array.from({ length: 3 }, (_, i) => ({ id: `modelx-${i+1}`, type: 'modelx' })),
    ];
    for (const v of vehicles) {
      const { waypoints, start, end } = await randomRoute();
      const progress = Math.floor(Math.random() * waypoints.length);
      const status = progress < waypoints.length - 1 ? 'occupied' : 'available';
      const [lat, lng] = waypoints[progress];
      
      // Final validation before inserting
      if (!isWithinCompton(lat, lng)) {
        console.log(`Vehicle ${v.id} position outside Compton, using center point`);
        const centerLat = (COMPTON_BOUNDS.latMin + COMPTON_BOUNDS.latMax) / 2;
        const centerLng = (COMPTON_BOUNDS.lngMin + COMPTON_BOUNDS.lngMax) / 2;
        await pool.query(
          'INSERT INTO vehicles (id, type, status, lat, lng, progress) VALUES ($1, $2, $3, $4, $5, $6)',
          [v.id, v.type, status, centerLat, centerLng, progress]
        );
      } else {
        await pool.query(
          'INSERT INTO vehicles (id, type, status, lat, lng, progress) VALUES ($1, $2, $3, $4, $5, $6)',
          [v.id, v.type, status, lat, lng, progress]
        );
      }
      
      await pool.query(
        'INSERT INTO routes (id, vehicle_id, waypoints, status) VALUES ($1, $2, $3, $4)',
        [`route-${v.id}`, v.id, JSON.stringify(waypoints), status]
      );
    }
  }
} 