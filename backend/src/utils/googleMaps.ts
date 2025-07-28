import axios from 'axios';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load API key from root .env file if available
let apiKey = '';
try {
  const rootEnvPath = path.resolve(__dirname, '../../../.env');
  if (fs.existsSync(rootEnvPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(rootEnvPath));
    apiKey = envConfig.VITE_GOOGLE_MAPS_API_KEY || '';
  }
} catch (error) {
  console.error('Error loading Google Maps API key from .env:', error);
}

// If .env doesn't exist or key wasn't found, try loading from config
if (!apiKey) {
  try {
    // Try to load from api-keys.ts by requiring the compiled JS file
    const configPath = path.resolve(__dirname, '../../../dist/config/api-keys.js');
    if (fs.existsSync(configPath)) {
      const apiKeysModule = require(configPath);
      apiKey = apiKeysModule.apiKeys?.googleMaps || '';
    }
  } catch (error) {
    console.error('Error loading Google Maps API key from config:', error);
  }
}

// Last resort: try to load from environment variable
if (!apiKey) {
  apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
  
  if (!apiKey) {
    console.warn('Google Maps API key not found! Routing functionality will be limited.');
  }
}

interface GoogleMapsDirectionsResponse {
  routes: Array<{
    overview_polyline: {
      points: string;
    };
    legs: Array<{
      duration: {
        value: number;  // duration in seconds
      };
      steps: Array<{
        polyline: {
          points: string;
        };
        duration: {
          value: number;
        };
      }>;
    }>;
  }>;
  status: string;
}

// Create a robust fallback for when the API is unavailable
function generateStraightLineWithJitter(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  numPoints: number = 10
): [number, number][] {
  console.log('Generating fallback route with straight line and jitter');
  
  const points: [number, number][] = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const fraction = i / numPoints;
    
    // Linear interpolation with some randomness
    const lat = startLat + (endLat - startLat) * fraction + (Math.random() - 0.5) * 0.001;
    const lng = startLng + (endLng - startLng) * fraction + (Math.random() - 0.5) * 0.001;
    
    points.push([lat, lng]);
  }
  
  return points;
}

export async function getGoogleMapsRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<[number, number][]> {
  try {
    // If we don't have an API key, use fallback immediately
    if (!apiKey) {
      console.warn('No Google Maps API key found, using fallback route generation');
      return generateStraightLineWithJitter(startLat, startLng, endLat, endLng, 12);
    }

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${startLat},${startLng}&destination=${endLat},${endLng}&key=${apiKey}`;
    const response = await axios.get<GoogleMapsDirectionsResponse>(url);
    
    if (response.data.status === 'OK' && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const encodedPolyline = route.overview_polyline.points;
      
      // Decode polyline geometry
      return decodePolyline(encodedPolyline);
    }
    
    // If the API returns a response but no valid route, log and use fallback
    console.warn(`No valid route found: ${response.data.status}`);
    return generateStraightLineWithJitter(startLat, startLng, endLat, endLng);
  } catch (error) {
    console.error('Google Maps routing error:', error);
    
    // More detailed logging based on the error
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error(`API responded with status ${error.response.status}: ${JSON.stringify(error.response.data)}`);
        
        // Handle specific error cases
        if (error.response.status === 403 || error.response.data?.status === 'REQUEST_DENIED') {
          console.error('API key may be invalid or have insufficient permissions');
        }
      } else if (error.request) {
        console.error('No response received from Google Maps API');
      }
    }
    
    // Always provide a fallback route
    console.log('Using fallback straight line route generation');
    return generateStraightLineWithJitter(startLat, startLng, endLat, endLng);
  }
}

// Decode Google polyline format
function decodePolyline(encoded: string): [number, number][] {
  const poly: [number, number][] = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let shift = 0, result = 0;

    do {
      let b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (result >= 0x20);

    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      let b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (result >= 0x20);

    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    poly.push([lat / 1E5, lng / 1E5]);
  }

  return poly;
}

// Hardcoded Compton area bounds for fallback
const COMPTON_BOUNDS = {
  north: 33.92313,
  south: 33.86303,
  east: -118.17995,
  west: -118.26315
};

// Get a random location within Compton for fallbacks
function getRandomComptonLocation(): {lat: number, lng: number} {
  const lat = COMPTON_BOUNDS.south + (Math.random() * (COMPTON_BOUNDS.north - COMPTON_BOUNDS.south));
  const lng = COMPTON_BOUNDS.west + (Math.random() * (COMPTON_BOUNDS.east - COMPTON_BOUNDS.west));
  return { lat, lng };
}

export async function geocodeAddress(address: string): Promise<{lat: number, lng: number} | null> {
  // Simple validation for address string
  if (!address || typeof address !== 'string' || address.trim().length < 3) {
    console.warn('Invalid address provided for geocoding');
    return null;
  }
  
  // Check if we have an API key
  if (!apiKey) {
    console.warn('No Google Maps API key available for geocoding, using fallback location in Compton area');
    return getRandomComptonLocation();
  }
  
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const response = await axios.get(url);
    
    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng
      };
    }
    
    console.warn(`Geocoding failed: ${response.data.status}`);
    
    // For specific error cases, provide more details
    if (response.data.status === 'ZERO_RESULTS') {
      console.warn(`No results found for address: ${address}`);
    } else if (response.data.status === 'REQUEST_DENIED') {
      console.error('Geocoding request denied - API key may be invalid');
    } else if (response.data.status === 'OVER_QUERY_LIMIT') {
      console.error('Geocoding over query limit - consider upgrading API plan');
    }
    
    // Return fallback location
    console.log('Using fallback location in Compton area');
    return getRandomComptonLocation();
  } catch (error) {
    console.error('Geocoding error:', error);
    
    // Log more details about the error
    if (axios.isAxiosError(error) && error.response) {
      console.error(`Geocoding API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    
    console.log('Using fallback location in Compton area due to error');
    return getRandomComptonLocation();
  }
}

export async function snapToRoad(coordinates: [number, number][]): Promise<[number, number][]> {
  // Basic validation
  if (coordinates.length < 2) {
    console.warn('Snapping to road requires at least 2 coordinates');
    return coordinates;
  }
  
  // Check if we have an API key
  if (!apiKey) {
    console.warn('No Google Maps API key available for snapping to road');
    return coordinates;
  }
  
  try {
    // Google Roads API has a limit of 100 points per request
    const MAX_POINTS_PER_REQUEST = 100;
    let result: [number, number][] = [];
    
    // Process in batches if needed
    for (let i = 0; i < coordinates.length; i += MAX_POINTS_PER_REQUEST) {
      const batch = coordinates.slice(i, i + MAX_POINTS_PER_REQUEST);
      const path = batch.map(([lat, lng]) => `${lat},${lng}`).join('|');
      const url = `https://roads.googleapis.com/v1/snapToRoads?path=${path}&interpolate=true&key=${apiKey}`;
      
      const response = await axios.get(url);
      
      if (response.data.snappedPoints) {
        const snapped = response.data.snappedPoints.map((point: any) => [
          point.location.latitude,
          point.location.longitude
        ] as [number, number]);
        
        result = result.concat(snapped);
      } else {
        console.warn('No snapped points returned for batch');
        // Add original points if snapping fails for this batch
        result = result.concat(batch);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Google Roads API error:', error);
    
    // More detailed error reporting
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error(`API responded with status ${error.response.status}: ${JSON.stringify(error.response.data)}`);
        
        // Handle quota/billing issues
        if (error.response.status === 403) {
          console.error('Roads API access denied - check API key permissions and billing');
        }
      } else if (error.request) {
        console.error('No response received from Google Roads API');
      }
    }
    
    // Return original coordinates as fallback
    return coordinates;
  }
} 