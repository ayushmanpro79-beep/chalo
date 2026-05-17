import { Linking } from 'react-native';
import { LatLng } from '../types/trip';

export function createGoogleMapsWalkingUrl({
  destinationLat,
  destinationLng
}: {
  destinationLat: number;
  destinationLng: number;
}) {
  return `https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLng}&travelmode=walking`;
}

export async function openGoogleMapsWalkingDirections(destination: LatLng) {
  const url = createGoogleMapsWalkingUrl({
    destinationLat: destination.latitude,
    destinationLng: destination.longitude
  });
  await Linking.openURL(url);
}
