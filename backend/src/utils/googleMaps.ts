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

// Last resort: try to load from environment variable
if (!apiKey) {
  apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
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

export async function getGoogleMapsRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<[number, number][]> {
  try {
    if (!apiKey) {
      throw new Error('Missing Google Maps API key');
    }

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${startLat},${startLng}&destination=${endLat},${endLng}&key=${apiKey}`;
    const response = await axios.get<GoogleMapsDirectionsResponse>(url);
    
    if (response.data.status === 'OK' && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const encodedPolyline = route.overview_polyline.points;
      
      // Decode polyline geometry
      return decodePolyline(encodedPolyline);
    }
    
    throw new Error(`No valid route found: ${response.data.status}`);
  } catch (error) {
    console.error('Google Maps routing error:', error);
    throw error;
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

export async function geocodeAddress(address: string): Promise<{lat: number, lng: number} | null> {
  // Simple validation for address string
  if (!address || typeof address !== 'string' || address.trim().length < 3) {
    console.warn('Invalid address provided for geocoding');
    return null;
  }
  
  if (!apiKey) {
    throw new Error('No Google Maps API key available for geocoding');
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
    
    throw new Error(`Geocoding failed: ${response.data.status}`);
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
}

export async function snapToRoad(coordinates: [number, number][]): Promise<[number, number][]> {
  // Basic validation
  if (coordinates.length < 2) {
    console.warn('Snapping to road requires at least 2 coordinates');
    return coordinates;
  }
  
  if (!apiKey) {
    throw new Error('No Google Maps API key available for Roads API');
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
    throw error;
  }
} 