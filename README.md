# Robo-Spark Dashboard 🚗⚡

A real-time robotaxi fleet management dashboard with integrated backend services including OSRM routing, vehicle analytics, and positioning.

## 🚀 Features

- **Real-time Vehicle Tracking**: Live updates via WebSocket connections
- **Vehicle Analytics**: Battery status, speed, location, and trip progress
- **Fleet Management**: Monitor multiple vehicle types (Cybertruck, Model Y, Model X)
- **Database Integration**: PostgreSQL for persistent vehicle and route data
- **Socket.io Backend**: Real-time communication between vehicles and dashboard
- **Modern UI**: Built with React, TypeScript, Tailwind CSS, and shadcn/ui

## 🏗️ Architecture

```
robo-spark-dash/
├── src/                    # Frontend React app
│   ├── components/         # UI components
│   ├── hooks/             # Custom hooks (useSocket)
│   ├── pages/             # Dashboard pages
│   └── lib/               # Utilities
├── backend/               # Express.js backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── controllers/   # Business logic
│   │   ├── models/        # Data models
│   │   └── utils/         # Database & OSRM utilities
│   └── package.json
└── package.json           # Root package.json
```

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- Socket.io Client
- React Router DOM
- Recharts (for future analytics)

### Backend
- Node.js + Express
- TypeScript
- Socket.io
- PostgreSQL
- Redis (for caching)
- OSRM (Open Source Routing Machine)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL
- Redis (optional)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo>
   cd robo-spark-dash
   npm run install:all
   ```

2. **Set up environment variables:**
   ```bash
   # Create .env file with your database credentials
   cp .env.example .env
   ```

3. **Start the development servers:**
   ```bash
   npm run dev
   ```
   
   This starts both:
   - Frontend: http://localhost:8080
   - Backend: http://localhost:8000

4. **Test with vehicle simulator:**
   ```bash
   # In a new terminal
   npm run test:simulator
   ```

## 📊 Dashboard Features

### Real-time Vehicle Monitoring
- Live vehicle status updates
- Battery level tracking
- Speed and location monitoring
- Trip progress visualization
- Connection status indicators

### Fleet Analytics
- Total revenue tracking
- Active vehicle count
- Trip statistics
- Vehicle performance metrics

### Vehicle Management
- Individual vehicle selection
- Status filtering
- Real-time location tracking
- Battery management

## 🔌 API Endpoints

### Vehicle Routes
- `GET /api/v1/vehicles` - Get all vehicles
- `GET /api/v1/vehicles/:id` - Get specific vehicle
- `POST /api/v1/vehicles` - Create new vehicle
- `POST /api/v1/vehicles/:id/route` - Create route for vehicle
- `POST /api/v1/vehicles/snap-route` - Snap route to roads (OSRM)

### WebSocket Events
- `vehicle-update` - Real-time vehicle data
- `pull-over-alert` - Emergency alerts
- `help-request-alert` - Assistance requests
- `control` - Vehicle control commands

## 🗄️ Database Schema

### Vehicles Table
```sql
CREATE TABLE vehicles (
  id VARCHAR PRIMARY KEY,
  type VARCHAR,
  status VARCHAR,
  lat DECIMAL,
  lng DECIMAL,
  progress INTEGER,
  battery INTEGER,
  speed INTEGER,
  eta VARCHAR,
  heading INTEGER
);
```

### Routes Table
```sql
CREATE TABLE routes (
  id VARCHAR PRIMARY KEY,
  vehicle_id VARCHAR REFERENCES vehicles(id),
  waypoints JSONB,
  pickup_location JSONB,
  destination JSONB,
  status VARCHAR
);
```

## 🧪 Testing

### Vehicle Simulator
The included test simulator sends realistic vehicle updates:

```bash
npm run test:simulator
```

This simulates:
- Vehicle movement
- Battery drain/charging
- Status changes
- Trip progress

### Manual Testing
1. Start the servers: `npm run dev`
2. Open http://localhost:8080/dashboard
3. Run the simulator: `npm run test:simulator`
4. Watch real-time updates in the dashboard

## 🔧 Development

### Project Structure
- **Monorepo setup**: Frontend and backend in single repository
- **Concurrent development**: Both servers run simultaneously
- **Type safety**: Full TypeScript coverage
- **Hot reloading**: Both frontend and backend support hot reload

### Adding New Features
1. **Backend**: Add routes in `backend/src/routes/`
2. **Frontend**: Add components in `src/components/`
3. **Database**: Update models in `backend/src/models/`
4. **Real-time**: Use Socket.io events for live updates

## 🚀 Deployment

### Production Build
```bash
npm run build:backend
npm run build
```

### Environment Variables
```bash
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://localhost:6379
PORT=8000
JWT_SECRET=your-secret-key
```

## 🤝 Contributing

1. Follow the Baby Steps™ methodology
2. One meaningful change at a time
3. Validate each step before proceeding
4. Document all changes

## 📝 License

MIT License - see LICENSE file for details

---

**Built with ❤️ following the Baby Steps™ methodology**
