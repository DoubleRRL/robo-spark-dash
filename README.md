# Robo-Spark Dashboard

A comprehensive autonomous vehicle fleet management dashboard for Tesla robotaxis operating in Compton, CA. Features realistic routing, diagnostics, and fleet management capabilities.

## 🚗 Features

### Realistic Vehicle Routing
- **OSRM Integration**: Uses Open Source Routing Machine for real street-based navigation
- **Compton Boundary**: Vehicles constrained to Compton, CA service area
- **Realistic Movement**: Vehicles follow actual streets, not random paths
- **Route Visualization**: Click on vehicles to see their planned routes on the map

### Vehicle Status Management
- **Status Types**: 
  - `available` - Ready for new trips
  - `en-route` - Currently driving to pickup/destination
  - `charging` - At charging station
  - `en-route-to-charging` - Heading to charging station
- **Intelligent Trip Assignment**: Automatically assigns nearest available vehicle to ride requests
- **Charging Management**: Low battery vehicles automatically routed to nearest charging station

### Comprehensive Diagnostics
- **Real-time Monitoring**: Battery health, sensor status, mechanical systems
- **Predictive Maintenance**: Identifies issues before they become critical
- **Remote Troubleshooting**: Determines what can be fixed remotely vs. requiring technician
- **Health Scoring**: Overall vehicle health percentage (0-100%)

### Fleet Analytics
- **Real-time Metrics**: Active vehicles, average wait time, trip completion rates
- **Performance Tracking**: Efficiency scores, harsh driving events, average speeds
- **Revenue Calculation**: Realistic fares based on distance ($2.69 - $14.20 range)

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript, Socket.io
- **Routing**: OSRM (Open Source Routing Machine)
- **Maps**: Leaflet with OpenStreetMap tiles
- **Real-time Communication**: Socket.io for live vehicle updates

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker (for OSRM)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/robo-spark-dash.git
   cd robo-spark-dash
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up OSRM** (see OSRM_SETUP.md for detailed instructions)
   ```bash
   # Option 1: Docker (recommended)
   docker pull osrm/osrm-backend
   docker run -t -i -p 5000:5000 -v "${PWD}:/data" osrm/osrm-backend osrm-routed /data/california-latest.osrm
   
   # Option 2: Local installation
   brew install osrm-backend
   osrm-routed california-latest.osrm
   ```

4. **Start the system**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev
   
   # Terminal 2: Realistic Vehicle Simulator
   node realisticVehicleSimulator.cjs
   
   # Terminal 3: Frontend
   npm run dev:frontend
   ```

5. **Access the dashboard**
   - Open http://localhost:8080/dashboard
   - View real-time vehicle positions, routes, and diagnostics

## 📊 Dashboard Components

### Fleet Overview
- **Vehicle Count**: Total vehicles in fleet (15 vehicles)
- **Active Trips**: Currently en-route vehicles
- **Average Wait Time**: Static metric generated on launch
- **Fleet Health**: Overall system health score

### Interactive Map
- **Vehicle Markers**: Color-coded by status (blue=driving, green=charging, gray=available)
- **Route Visualization**: Click vehicles to see their planned routes
- **Ride Requests**: Orange markers for pickup, purple for destination
- **Compton Boundary**: Red polygon showing service area

### Vehicle Management
- **Fleet Vehicles Panel**: Scrollable list of all vehicles with real-time status
- **Diagnostics Panel**: Detailed vehicle health when selected
- **Emergency Controls**: Emergency stop, contact vehicle, remote diagnostics

### Trip Management
- **Active Trips**: Vehicles currently en-route or dropping off
- **Ride Requests**: Pending requests with nearest vehicle suggestions
- **Trip Details**: Passenger names, pickup/destination, mileage, fare

## 🔧 Configuration

### Vehicle Types
- **Cybertruck**: 5 vehicles (IDs: vehicle-001 to vehicle-005)
- **Model Y**: 5 vehicles (IDs: vehicle-006 to vehicle-010)  
- **Model X**: 5 vehicles (IDs: vehicle-011 to vehicle-015)

### Charging Stations
- Compton City Hall
- Compton College
- Compton Shopping Center
- Compton Plaza
- Compton Medical Center

### Service Area
- **Boundary**: Compton, CA (33.87442°N to 33.92313°N, -118.26315°W to -118.17995°W)
- **Landmarks**: City Hall, College, Airport, Library, High School, etc.

## 📈 Diagnostic Features

### Battery Monitoring
- Level, temperature, voltage, current
- Health assessment (excellent/good/fair/poor)
- Cycle count and estimated range
- Automatic low battery alerts

### Autonomous Systems
- LiDAR, camera, radar status
- GPS accuracy monitoring
- Sensor calibration status
- Software version tracking

### Mechanical Systems
- Tire pressure monitoring (4 tires)
- Brake wear percentage
- Motor temperature
- Transmission and suspension status

### Performance Metrics
- Efficiency score (0-100%)
- Harsh driving events (acceleration, braking, cornering)
- Average speed tracking
- Environmental conditions

## 🚨 Alert System

### Critical Alerts
- Low battery level (<20%)
- Sensor failures (LiDAR, camera, radar)
- Safety system issues

### Warning Alerts
- Battery health degradation
- Tire pressure below recommended
- Sensor calibration needed
- Performance efficiency issues

### Remote Actions
- Automatic routing to charging stations
- Sensor calibration procedures
- Software updates
- Driving parameter adjustments

## 🔄 Real-time Updates

- **Vehicle Positions**: Updated every 2 seconds
- **Trip Assignments**: Automatic nearest vehicle assignment
- **Status Changes**: Real-time status updates
- **Diagnostic Data**: Continuous health monitoring
- **Route Generation**: Dynamic OSRM-based routing

## 🛡️ Safety Features

- **Emergency Stop**: Immediate vehicle halt capability
- **Boundary Enforcement**: Vehicles cannot leave Compton area
- **Collision Avoidance**: Active safety system monitoring
- **Remote Diagnostics**: 24/7 vehicle health monitoring

## 📝 Development

### Project Structure
```
robo-spark-dash/
├── src/
│   ├── components/          # React components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript type definitions
├── backend/                # Express server
├── public/                 # Static assets
└── realisticVehicleSimulator.cjs  # Vehicle simulation
```

### Key Files
- `src/pages/Dashboard.tsx` - Main dashboard component
- `src/components/LeafletMapComponent.tsx` - Interactive map
- `src/utils/vehicleDiagnostics.ts` - Diagnostic system
- `realisticVehicleSimulator.cjs` - Vehicle simulation logic
- `backend/src/index.ts` - Express server

### Adding New Features
1. Create component in `src/components/`
2. Add types in `src/types/` if needed
3. Update simulator in `realisticVehicleSimulator.cjs`
4. Test with `npm run dev:both`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **OSRM**: Open Source Routing Machine for realistic navigation
- **OpenStreetMap**: Map data and tiles
- **Leaflet**: Interactive mapping library
- **Tesla**: Inspiration for autonomous vehicle fleet management

## 📞 Support

For questions or issues:
- Create an issue on GitHub
- Check the OSRM_SETUP.md for routing setup help
- Review the diagnostic system documentation

---

**Built with ❤️ for the future of autonomous transportation**
