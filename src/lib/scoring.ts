// Haversine formula to calculate the great-circle distance between two points on a sphere given their longitudes and latitudes
export function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Calculate score based on distance (max 5000 points, 0 points if > 2000km away)
export function calculateScore(distanceMeters: number): number {
  const distanceKm = distanceMeters / 1000;
  const MAX_SCORE = 5000;

  if (distanceKm <= 0.1) return MAX_SCORE; // Less than 100 meters is perfect

  const score = Math.floor(MAX_SCORE * Math.pow(Math.E, -distanceKm / 1000));

  return score < 0 ? 0 : score > MAX_SCORE ? MAX_SCORE : score;
}
