import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import vehicleRoute from './routes/vehicle';
import { initDb, pool } from './utils/dbInit';

envSetup();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(cors());
app.use(express.json());
app.use('/api/v1/vehicles', vehicleRoute);



// socket.io namespace for vehicle updates
io.of('/vehicles').on('connection', socket => {
  console.log('vehicle dashboard connected');
  
  // listen for sim updates
  socket.on('vehicle-update', async (data) => {
    console.log('Received vehicle update:', data.id, 'Status:', data.status, 'Speed:', data.speed, 'Battery:', data.battery);
    
    // Store vehicle update in database with full data
    try {
      await pool.query(`
        INSERT INTO vehicles (id, type, status, lat, lng, progress, battery, speed, eta, heading)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          status = $3,
          lat = $4,
          lng = $5,
          progress = $6,
          battery = $7,
          speed = $8,
          eta = $9,
          heading = $10
      `, [
        data.id,
        data.type || (data.id.includes('cybertruck') ? 'cybertruck' : data.id.includes('modely') ? 'modely' : 'modelx'),
        data.status || 'available',
        data.lat,
        data.lng,
        data.progress || 0,
        // Make sure battery is an integer
        Math.round(data.battery || 100),
        // Make sure speed is an integer
        Math.round(data.speed) || 0,
        data.eta || '0 min',
        data.heading || 0
      ]);

      // Store route data if provided
      if (data.route && data.route.length > 0) {
        await pool.query(`
          INSERT INTO routes (id, vehicle_id, waypoints, pickup_location, destination, status)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO UPDATE SET
            waypoints = $3,
            pickup_location = $4,
            destination = $5,
            status = $6
        `, [
          `route-${data.id}`,
          data.id,
          JSON.stringify(data.route),
          data.pickupLocation ? JSON.stringify(data.pickupLocation) : null,
          data.destination ? JSON.stringify(data.destination) : null,
          data.status || 'active'
        ]);
      }
    } catch (error) {
      console.error('Error storing vehicle update:', error);
    }
    
    // broadcast to all dashboard clients
    const clients = io.of('/vehicles').sockets;
    console.log(`Broadcasting to ${clients.size} connected clients`);
    io.of('/vehicles').emit('vehicle-update', data);
  });

  // relay ride requests from simulator to dashboard clients
  socket.on('ride-requests', (data) => {
    try {
      console.log('Received ride requests:', Array.isArray(data) ? data.length : 0);
      // Emit both the canonical event and a compatibility alias
      io.of('/vehicles').emit('ride-requests', data);
      io.of('/vehicles').emit('trip-updates', data);
    } catch (error) {
      console.error('Failed to relay ride requests:', error);
    }
  });
  
  socket.on('pull-over', rideData => {
    // log rideData (could write to db/file)
    console.log('PULL OVER:', rideData);
    io.of('/vehicles').emit('pull-over-alert', rideData);
  });
  
  socket.on('help-request-alert', helpData => {
    // log help request (could write to db/file)
    console.log('HELP REQUEST:', helpData);
    io.of('/vehicles').emit('help-request-alert', helpData);
  });
  
  socket.on('control', cmd => {
    // relay control commands to all sims
    io.of('/vehicles').emit('control', cmd);
  });
  
  socket.on('assign-rider', assignment => {
    console.log('Rider assignment:', assignment);
    // relay rider assignment to specific vehicle
    io.of('/vehicles').emit('assign-rider', assignment);
  });
  
  socket.on('disconnect', () => {
    console.log('vehicle dashboard disconnected');
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // await initDb();
    console.log('Database initialization skipped (not needed for demo)');
    
    app.get('/health', (req, res) => res.send('ok'));

    const PORT = process.env.PORT || 8000;
    server.listen(PORT, () => {
      console.log(`backend listening on ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

startServer();

function envSetup() {
  require('dotenv').config({ path: '../../.env' });
} 