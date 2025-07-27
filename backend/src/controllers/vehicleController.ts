import { Request, Response } from 'express';
import * as Vehicle from '../models/Vehicle';
import * as Route from '../models/Route';

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
  res.json({ ok: true, message: `Vehicle ${req.params.id} rerouted.` });
} 