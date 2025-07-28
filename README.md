# Robo-Spark Dashboard

A comprehensive autonomous vehicle fleet management dashboard for Tesla robotaxis operating in Compton, CA. Features realistic routing with Google Maps, real-time diagnostics, and intelligent fleet management capabilities.

## 🚗 Features

### Dynamic Google Maps Integration
- **Google Maps API**: Real street-based navigation using Google Maps Directions API
- **Compton Boundary**: Vehicles constrained to Compton, CA service area with map restrictions
- **Realistic Movement**: Vehicles follow actual streets, not random paths
- **Route Visualization**: Click on vehicles to see their planned routes following real roads
- **Address Input**: Type any address to send selected vehicles to that destination
- **Geocoding**: Automatic address-to-coordinates conversion with Compton context

### Vehicle Status Management
- **Status Types**: 
  - `available` - Ready for new trips
  - `en-route` - Currently driving to pickup/destination
  - `charging` - At charging station
  - `picking-up` - Heading to pickup location
  - `dropping-off` - Taking passenger to destination
- **Intelligent Trip Assignment**: Automatically assigns nearest available vehicle to ride requests
- **Charging Management**: Low battery vehicles automatically routed to nearest charging station
- **Real-time Updates**: Vehicle positions, status, and diagnostics updated every 2 seconds

### Interactive Map Features
- **Vehicle Markers**: 
  - Cybertruck icons for Cybertruck vehicles
  - Model X icons for Model X vehicles  
  - Model Y icons for Model Y vehicles
  - Size scaling for selected vehicles
- **Info Windows**: Click vehicles to see detailed stats (type, status, battery, speed, ETA, location)
- **Route Display**: Street-following routes using Google Maps Directions API
- **Compton Boundary**: Red polygon showing service area with map restrictions
- **Address Input**: Type addresses to route selected vehicles

### Comprehensive Diagnostics
- **Real-time Monitoring**: Battery health, sensor status, mechanical systems
- **Predictive Maintenance**: Identifies issues before they become critical
- **Remote Troubleshooting**: Determines what can be fixed remotely vs. requiring technician
- **Health Scoring**: Overall vehicle health percentage (0-100%)
- **Battery Values**: Displayed as two-digit whole numbers

### Fleet Analytics
- **Real-time Metrics**: Active vehicles, average wait time, trip completion rates
- **Performance Tracking**: Efficiency scores, harsh driving events, average speeds
- **Revenue Calculation**: Realistic fares based on distance ($2.69 - $14.20 range)
- **Ride Requests**: 18-25 people with proper status distribution (en-route, dropping off, pending)

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript, Socket.io
- **Maps**: Google Maps API with @react-google-maps/api
- **Routing**: Google Maps Directions API, Geocoding API, Roads API
- **Real-time Communication**: Socket.io for live vehicle updates
- **Database**: PostgreSQL for vehicle and route storage

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Google Maps API key
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/robo-spark-dash.git
   cd robo-spark-dash
   ```

2. **Set up Google Maps API key**
   ```bash
   # Create .env file in project root
   echo "GOOGLE_MAPS_API_KEY=your_api_key_here" > .env
   ```

3. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install
   ```

4. **Start the system**
   ```bash
   # Option 1: Run all services at once
   npm run dev:all
   
   # Option 2: Run services separately
   # Terminal 1: Backend
   npm run dev:backend
   
   # Terminal 2: Frontend  
   npm run dev:frontend
   
   # Terminal 3: Vehicle Simulator
   npm run dev:simulator
   ```

5. **Access the dashboard**
   - Open http://localhost:8080/dashboard
   - View real-time vehicle positions, routes, and diagnostics

## 📊 Dashboard Components

### Fleet Overview
- **Vehicle Count**: Total vehicles in fleet (15 vehicles)
- **Active Trips**: Currently en-route vehicles (matches ride requests en-route count)
- **Average Wait Time**: Static metric generated on launch
- **Fleet Health**: Overall system health score

### Interactive Google Map
- **Vehicle Markers**: 
  - Correct vehicle type icons (Cybertruck, Model X, Model Y)
  - Color-coded by status (blue=driving, green=charging, gray=available)
  - Size scaling for selected vehicles
- **Route Visualization**: 
  - Street-following routes using Google Maps Directions API
  - Fallback polyline if Directions API fails
  - Click vehicles to see their planned routes
- **Info Windows**: 
  - Vehicle type, status, battery (whole numbers), speed, ETA, location
  - Address input field for routing selected vehicles
- **Compton Boundary**: Red polygon showing service area with map restrictions
- **Address Input**: Type any address to route selected vehicles

### Vehicle Management
- **Fleet Vehicles Panel**: Scrollable list of all vehicles with real-time status
- **Diagnostics Panel**: Detailed vehicle health when selected
- **Emergency Controls**: Emergency stop, contact vehicle, remote diagnostics
- **Battery Display**: Two-digit whole numbers only

### Trip Management
- **Active Trips**: Vehicles currently en-route or dropping off
- **Ride Requests**: 18-25 people with proper status distribution
  - 20-30% en-route
  - 10-15% dropping off  
  - Rest pending
- **Trip Details**: Passenger names, pickup/destination, mileage, fare
- **Status Filtering**: Filter by "all", "ride requested", "en-route"

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
- **Map Restrictions**: Vehicles cannot leave Compton area

## 🎮 How Actions Work

### Vehicle Selection & Routing
1. **Click any vehicle** on the map to select it
2. **Info window appears** showing vehicle stats and address input
3. **Type an address** in the input field (e.g., "Compton City Hall")
4. **Press Enter** or click "Send Vehicle"
5. **Vehicle routes** to the destination using Google Maps Directions API
6. **Route displays** as a street-following path on the map

### Ride Request Assignment
1. **View ride requests** in the right sidebar (18-25 total)
2. **Filter by status** using the dropdown (all, ride requested, en-route)
3. **Click "Assign"** next to any pending request
4. **Nearest available vehicle** automatically assigned
5. **Vehicle status changes** to "en-route" and routes to pickup
6. **Active trips count** updates to match en-route vehicles

### Vehicle Status Monitoring
1. **Real-time updates** every 2 seconds via Socket.io
2. **Battery levels** displayed as whole numbers
3. **Status changes** automatically reflected on map and fleet panel
4. **Low battery vehicles** automatically routed to charging stations
5. **Trip completion** automatically updates vehicle status to "available"

### Map Interactions
1. **Zoom/Pan**: Standard Google Maps controls
2. **Vehicle Selection**: Click any vehicle marker
3. **Route Viewing**: Selected vehicles show their current route
4. **Boundary Respect**: Map restricted to Compton area
5. **Address Geocoding**: Automatic address-to-coordinates conversion

## 📈 Diagnostic Features

### Battery Monitoring
- Level, temperature, voltage, current
- Health assessment (excellent/good/fair/poor)
- Cycle count and estimated range
- Automatic low battery alerts
- Display as two-digit whole numbers

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

- **Vehicle Positions**: Updated every 2 seconds via Socket.io
- **Trip Assignments**: Automatic nearest vehicle assignment
- **Status Changes**: Real-time status updates
- **Diagnostic Data**: Continuous health monitoring
- **Route Generation**: Dynamic Google Maps-based routing
- **Battery Values**: Rounded to whole numbers

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
│   │   ├── GoogleMapComponent.tsx  # Google Maps integration
│   │   └── ui/              # shadcn/ui components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   └── config/             # Configuration files
├── backend/                # Express server
│   └── src/
│       ├── utils/googleMaps.ts  # Google Maps API utilities
│       └── controllers/    # API controllers
├── public/                 # Static assets
└── realisticVehicleSimulator.cjs  # Vehicle simulation
```

### Key Files
- `src/pages/Dashboard.tsx` - Main dashboard component
- `src/components/GoogleMapComponent.tsx` - Google Maps integration
- `src/utils/vehicleRouting.ts` - Routing utilities
- `backend/src/utils/googleMaps.ts` - Google Maps API backend utilities
- `realisticVehicleSimulator.cjs` - Vehicle simulation logic
- `backend/src/index.ts` - Express server

### API Key Management
- **Primary**: `.env` file with `GOOGLE_MAPS_API_KEY`
- **Fallback**: `src/config/api-keys.ts` (git-ignored)
- **Example**: `src/config/api-keys.example.ts` for reference

### Adding New Features
1. Create component in `src/components/`
2. Add types in `src/types/` if needed
3. Update simulator in `realisticVehicleSimulator.cjs`
4. Test with `npm run dev:all`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Google Maps API**: For realistic routing and geocoding
- **Tesla**: Inspiration for autonomous vehicle fleet management
- **Compton, CA**: Service area for the robotaxi fleet

## 📞 Support

For questions or issues:
- Create an issue on GitHub
- Check the Google Maps API setup
- Review the diagnostic system documentation

---

**Built with ❤️ for the future of autonomous transportation**
