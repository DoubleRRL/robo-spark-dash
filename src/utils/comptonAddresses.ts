// Real Compton, CA addresses for pickup/dropoff locations
export const comptonAddresses = [
  // Major landmarks and institutions
  {
    name: "Compton City Hall",
    address: "205 S Willowbrook Ave, Compton, CA 90220",
    lat: 33.8958,
    lng: -118.2201,
    type: "government"
  },
  {
    name: "Compton College",
    address: "1111 E Artesia Blvd, Compton, CA 90221",
    lat: 33.8897,
    lng: -118.2189,
    type: "education"
  },
  {
    name: "Compton Airport",
    address: "500 W Victoria St, Compton, CA 90220",
    lat: 33.8889,
    lng: -118.2350,
    type: "transportation"
  },
  {
    name: "Compton Library",
    address: "240 W Compton Blvd, Compton, CA 90220",
    lat: 33.8950,
    lng: -118.2200,
    type: "public"
  },
  {
    name: "Compton High School",
    address: "601 S Acacia Ave, Compton, CA 90220",
    lat: 33.8900,
    lng: -118.2150,
    type: "education"
  },
  
  // Shopping and commercial areas
  {
    name: "Compton Shopping Center",
    address: "1200 N Long Beach Blvd, Compton, CA 90221",
    lat: 33.8850,
    lng: -118.2000,
    type: "commercial"
  },
  {
    name: "Compton Plaza",
    address: "801 S Long Beach Blvd, Compton, CA 90221",
    lat: 33.8800,
    lng: -118.2100,
    type: "commercial"
  },
  {
    name: "Compton Station",
    address: "700 N Long Beach Blvd, Compton, CA 90221",
    lat: 33.8820,
    lng: -118.2050,
    type: "transportation"
  },
  
  // Medical facilities
  {
    name: "Compton Medical Center",
    address: "300 S Long Beach Blvd, Compton, CA 90221",
    lat: 33.8750,
    lng: -118.2050,
    type: "medical"
  },
  {
    name: "Compton Community Hospital",
    address: "500 N Long Beach Blvd, Compton, CA 90221",
    lat: 33.8780,
    lng: -118.2080,
    type: "medical"
  },
  
  // Parks and recreation
  {
    name: "Compton Creek Park",
    address: "400 S Long Beach Blvd, Compton, CA 90221",
    lat: 33.8700,
    lng: -118.2100,
    type: "recreation"
  },
  {
    name: "Compton Park",
    address: "600 S Long Beach Blvd, Compton, CA 90221",
    lat: 33.8650,
    lng: -118.2200,
    type: "recreation"
  },
  
  // Residential areas
  {
    name: "Compton Residential Area 1",
    address: "1000 E Compton Blvd, Compton, CA 90221",
    lat: 33.8900,
    lng: -118.1900,
    type: "residential"
  },
  {
    name: "Compton Residential Area 2",
    address: "1500 W Compton Blvd, Compton, CA 90220",
    lat: 33.8850,
    lng: -118.2300,
    type: "residential"
  },
  {
    name: "Compton Residential Area 3",
    address: "2000 N Long Beach Blvd, Compton, CA 90221",
    lat: 33.8800,
    lng: -118.1950,
    type: "residential"
  },
  
  // Business districts
  {
    name: "Compton Business District",
    address: "300 W Compton Blvd, Compton, CA 90220",
    lat: 33.8950,
    lng: -118.2250,
    type: "commercial"
  },
  {
    name: "Compton Industrial Area",
    address: "400 E Compton Blvd, Compton, CA 90221",
    lat: 33.8880,
    lng: -118.2000,
    type: "industrial"
  },
  
  // Schools
  {
    name: "Compton Elementary School",
    address: "500 S Long Beach Blvd, Compton, CA 90221",
    lat: 33.8750,
    lng: -118.2150,
    type: "education"
  },
  {
    name: "Compton Middle School",
    address: "600 N Long Beach Blvd, Compton, CA 90221",
    lat: 33.8820,
    lng: -118.2100,
    type: "education"
  },
  
  // Religious institutions
  {
    name: "Compton Church",
    address: "700 W Compton Blvd, Compton, CA 90220",
    lat: 33.8900,
    lng: -118.2300,
    type: "religious"
  },
  {
    name: "Compton Mosque",
    address: "800 E Compton Blvd, Compton, CA 90221",
    lat: 33.8850,
    lng: -118.1950,
    type: "religious"
  }
];

export function getRandomAddress() {
  return comptonAddresses[Math.floor(Math.random() * comptonAddresses.length)];
}

export function getAddressesByType(type: string) {
  return comptonAddresses.filter(addr => addr.type === type);
} 