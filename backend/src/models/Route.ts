import { Pool } from 'pg';
const pool = new Pool();

export async function createRoute(route: any) {
  const { id, vehicleId, waypoints, status } = route;
  await pool.query(
    'INSERT INTO routes (id, vehicle_id, waypoints, status) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET vehicle_id = $2, waypoints = $3, status = $4',
    [id, vehicleId, JSON.stringify(waypoints), status]
  );
}

export async function getRoute(id: string) {
  const { rows } = await pool.query('SELECT * FROM routes WHERE id = $1', [id]);
  return rows[0];
}

export async function getAllRoutes() {
  const { rows } = await pool.query('SELECT * FROM routes');
  return rows;
} 