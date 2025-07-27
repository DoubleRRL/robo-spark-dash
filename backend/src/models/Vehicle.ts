import { Pool } from 'pg';
const pool = new Pool();

export async function createVehicle(vehicle: any) {
  const { id, status, lat, lng } = vehicle;
  await pool.query(
    'INSERT INTO vehicles (id, status, lat, lng) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET status = $2, lat = $3, lng = $4',
    [id, status, lat, lng]
  );
}

export async function getVehicle(id: string) {
  const { rows } = await pool.query('SELECT * FROM vehicles WHERE id = $1', [id]);
  return rows[0];
}

export async function getAllVehicles() {
  const { rows } = await pool.query('SELECT * FROM vehicles');
  return rows;
} 