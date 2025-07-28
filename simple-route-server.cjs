const http = require('http');
const url = require('url');

// Simple route server that generates fake routes for testing
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  const parsedUrl = url.parse(req.url, true);
  
  if (parsedUrl.pathname.startsWith('/route/v1/driving/')) {
    // Extract coordinates from URL like: /route/v1/driving/lng1,lat1;lng2,lat2
    const coords = parsedUrl.pathname.split('/').pop().split(';');
    const [startLng, startLat] = coords[0].split(',').map(Number);
    const [endLng, endLat] = coords[1].split(',').map(Number);
    
    // Generate a simple route with 10 points between start and end
    const routePoints = [];
    for (let i = 0; i <= 10; i++) {
      const progress = i / 10;
      const lng = startLng + (endLng - startLng) * progress;
      const lat = startLat + (endLat - startLat) * progress;
      routePoints.push([lng, lat]);
    }
    
    const response = {
      code: 'Ok',
      routes: [{
        geometry: {
          coordinates: routePoints
        },
        duration: 300 + Math.random() * 600, // 5-15 minutes
        distance: 1000 + Math.random() * 5000 // 1-6 km
      }]
    };
    
    console.log(`🗺️ Route requested: (${startLat.toFixed(4)}, ${startLng.toFixed(4)}) -> (${endLat.toFixed(4)}, ${endLng.toFixed(4)})`);
    res.end(JSON.stringify(response));
  } else {
    res.statusCode = 404;
    res.end('Not found');
  }
});

server.listen(5000, () => {
  console.log('🚗 Simple route server running on http://localhost:5000');
  console.log('🧪 Test with: curl "http://localhost:5000/route/v1/driving/-118.2201,33.8958;-118.2189,33.8897"');
});
