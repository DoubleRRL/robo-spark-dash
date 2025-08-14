// Configuration for map providers
// IMPORTANT: This file imports API key from api-keys.ts which should be in .gitignore

import { apiKeys } from './api-keys';

export const mapsConfig = {
  googleMaps: {
    // Get API key from api-keys.ts or fall back to env variable if available
    apiKey: apiKeys.googleMaps,
    // Default center coordinates (Compton, CA)
    defaultCenter: {
      lat: 33.8958, 
      lng: -118.2201
    },
    defaultZoom: 13,
    // Map style and options
    mapOptions: {
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    }
  },
  // Compton boundary information (kept from old system)
  comptonBounds: {
    north: 33.92313,
    south: 33.86303,
    east: -118.17995,
    west: -118.26315
  }
}; 