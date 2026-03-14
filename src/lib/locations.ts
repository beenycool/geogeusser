export interface Location {
  id: string; // Mapillary Image ID
  lat: number;
  lng: number;
  name: string;
}

export const PRE_CURATED_LOCATIONS: Location[] = [
  {
    id: "273347068153065", // Times Square, NY
    lat: 40.7580,
    lng: -73.9855,
    name: "Times Square, New York, USA"
  },
  {
    id: "3127419137497676", // Eiffel Tower, Paris
    lat: 48.8584,
    lng: 2.2945,
    name: "Eiffel Tower, Paris, France"
  },
  {
    id: "356515869408669", // Colosseum, Rome
    lat: 41.8902,
    lng: 12.4922,
    name: "Colosseum, Rome, Italy"
  },
  {
    id: "198031268953923", // Sydney Opera House
    lat: -33.8568,
    lng: 151.2153,
    name: "Sydney Opera House, Australia"
  },
  {
    id: "3051410214959196", // Shibuya Crossing, Tokyo
    lat: 35.6595,
    lng: 139.7001,
    name: "Shibuya Crossing, Tokyo, Japan"
  }
];

export function getRandomLocations(count: number): Location[] {
  const shuffled = [...PRE_CURATED_LOCATIONS];
  // Fisher-Yates (Durstenfeld) algorithm for uniform distribution
  for (let i = shuffled.length - 1; i > 0; i--) {
    const array = new Uint32Array(1);
    globalThis.crypto.getRandomValues(array);
    const j = array[0] % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}
