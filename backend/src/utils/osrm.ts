import axios from 'axios';

interface OSRMRouteResponse {
  code: string;
  routes: Array<{
    geometry: string;
    distance: number;
    duration: number;
    legs: Array<{
      steps: Array<{
        geometry: string;
        distance: number;
        duration: number;
      }>;
    }>;
  }>;
}

export async function getOSRMRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<[number, number][]> {
  try {
    const url = `http://localhost:5000/route/v1/driving/${startLng},${startLat};${endLng},${endLat}`;
    const response = await axios.get<OSRMRouteResponse>(url);
    
    if (response.data.code === 'Ok' && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const geometry = route.geometry;
      
      // Decode polyline geometry
      return decodePolyline(geometry);
    }
    
    throw new Error('No route found');
  } catch (error) {
    console.error('OSRM routing error:', error);
    // Fallback to straight line
    return [[startLat, startLng], [endLat, endLng]];
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

export async function snapToRoad(coordinates: [number, number][]): Promise<[number, number][]> {
  if (coordinates.length < 2) return coordinates;
  
  try {
    const coordString = coordinates.map(([lat, lng]) => `${lng},${lat}`).join(';');
    const url = `http://localhost:5000/match/v1/driving/${coordString}`;
    const response = await axios.get(url);
    
    if (response.data.code === 'Ok' && response.data.matchings.length > 0) {
      const geometry = response.data.matchings[0].geometry;
      return decodePolyline(geometry);
    }
    
    return coordinates;
  } catch (error) {
    console.error('OSRM snap error:', error);
    return coordinates;
  }
} 