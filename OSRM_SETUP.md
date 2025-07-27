# OSRM Setup for Realistic Vehicle Routing

## What is OSRM?

OSRM (Open Source Routing Machine) is a high-performance routing engine that provides realistic turn-by-turn navigation using OpenStreetMap data. It's perfect for our robotaxi simulation because it:

- Uses real street networks and traffic rules
- Provides accurate travel times and distances
- Supports multiple transportation modes
- Is completely free and open source

## Installation Options

### Option 1: Docker (Recommended)

```bash
# Pull the OSRM Docker image
docker pull osrm/osrm-backend

# Download California OSM data
wget https://download.geofabrik.de/north-america/us/california-latest.osm.pbf

# Extract and prepare the data
docker run -t -v "${PWD}:/data" osrm/osrm-backend osrm-extract -p /opt/car.lua /data/california-latest.osm.pbf
docker run -t -v "${PWD}:/data" osrm/osrm-backend osrm-partition /data/california-latest.osrm
docker run -t -v "${PWD}:/data" osrm/osrm-backend osrm-customize /data/california-latest.osrm

# Start OSRM server
docker run -t -i -p 5000:5000 -v "${PWD}:/data" osrm/osrm-backend osrm-routed /data/california-latest.osrm
```

### Option 2: Local Installation

```bash
# Install OSRM on macOS
brew install osrm-backend

# Download and prepare data
wget https://download.geofabrik.de/north-america/us/california-latest.osm.pbf
osrm-extract -p /opt/car.lua california-latest.osm.pbf
osrm-partition california-latest.osrm
osrm-customize california-latest.osrm

# Start server
osrm-routed california-latest.osrm
```

## API Usage

Once OSRM is running on port 5000, you can make routing requests:

```javascript
// Example: Route from Compton City Hall to Compton College
const response = await fetch(
  'http://localhost:5000/route/v1/driving/-118.2201,33.8958;-118.2189,33.8897?overview=full&geometries=geojson'
);

const data = await response.json();
console.log('Route duration:', data.routes[0].duration, 'seconds');
console.log('Route distance:', data.routes[0].distance, 'meters');
```

## Integration with Our System

The realistic vehicle simulator automatically:

1. **Uses OSRM for routing** between pickup and destination points
2. **Falls back to straight-line routing** if OSRM is unavailable
3. **Calculates realistic travel times** based on street networks
4. **Provides turn-by-turn navigation** for vehicles

## Benefits Over Random Movement

- **Realistic paths**: Vehicles follow actual streets and roads
- **Accurate timing**: Travel times based on real-world conditions
- **Traffic rules**: Respects one-way streets, speed limits, etc.
- **Professional appearance**: Looks like a real navigation system

## Alternative: Google Maps API

If you prefer Google Maps API (requires API key):

```javascript
// Replace OSRM with Google Directions API
const response = await fetch(
  `https://maps.googleapis.com/maps/api/directions/json?origin=${startLat},${startLng}&destination=${endLat},${endLng}&key=YOUR_API_KEY`
);
```

However, OSRM is recommended because it's:
- **Free**: No API costs or rate limits
- **Private**: All data stays on your server
- **Customizable**: Can modify routing algorithms
- **Reliable**: No dependency on external services

## Testing OSRM

Test if OSRM is working:

```bash
curl "http://localhost:5000/route/v1/driving/-118.2201,33.8958;-118.2189,33.8897"
```

You should get a JSON response with route information. 