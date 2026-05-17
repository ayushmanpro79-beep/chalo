import { LatLng, RoutePoint } from '../types/trip';

const EARTH_RADIUS_METERS = 6371000;
const toRadians = (value: number) => (value * Math.PI) / 180;

export function getDistanceMeters(pointA: LatLng, pointB: LatLng): number {
  const dLat = toRadians(pointB.latitude - pointA.latitude);
  const dLon = toRadians(pointB.longitude - pointA.longitude);
  const latA = toRadians(pointA.latitude);
  const latB = toRadians(pointB.latitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(latA) * Math.cos(latB) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateRouteDistanceMeters(routePoints: Array<RoutePoint | LatLng>): number {
  if (routePoints.length < 2) return 0;
  return routePoints.slice(1).reduce((total, point, index) => {
    return total + getDistanceMeters(routePoints[index], point);
  }, 0);
}

export function calculateAverageSpeedKmph(distanceMeters: number, durationSeconds: number): number {
  if (durationSeconds <= 0) return 0;
  return (distanceMeters / 1000) / (durationSeconds / 3600);
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

export function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remaining = safeSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${remaining}s`;
  return `${remaining}s`;
}
