import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { getDistanceMeters } from './distance';
import { saveRoutePoint } from './trips';
import { LatLng, RoutePoint } from '../types/trip';

export const CHALO_LOCATION_TASK = 'CHALO_LOCATION_TASK';
const ARRIVAL_THRESHOLD_METERS = 75;

type TrackingState = {
  tripId: string | null;
  destination: LatLng | null;
  onPoint?: (point: RoutePoint) => void;
  onArrival?: () => void;
  hasArrived: boolean;
};

const state: TrackingState = {
  tripId: null,
  destination: null,
  hasArrived: false
};

TaskManager.defineTask(CHALO_LOCATION_TASK, ({ data, error }) => {
  if (error || !state.tripId) return;
  const locations = (data as { locations?: Location.LocationObject[] }).locations ?? [];
  locations.forEach((location) => {
    const point = locationToRoutePoint(location);
    void saveRoutePoint(state.tripId as string, point);
    state.onPoint?.(point);
    detectArrival(point);
  });
});

function locationToRoutePoint(location: Location.LocationObject): RoutePoint {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    speed_mps: location.coords.speed,
    accuracy: location.coords.accuracy,
    recorded_at: new Date(location.timestamp).toISOString()
  };
}

async function detectArrival(point: LatLng) {
  if (!state.destination || state.hasArrived) return;
  const meters = getDistanceMeters(point, state.destination);
  if (meters <= ARRIVAL_THRESHOLD_METERS) {
    state.hasArrived = true;
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Chalo', body: 'You reached your Chalo destination.' },
      trigger: null
    });
    state.onArrival?.();
  }
}

export async function requestForegroundLocationPermission() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Location permission is needed to run a Chalo trip.');
}

export async function requestBackgroundLocationPermission() {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Background location permission was not granted. Foreground tracking can still be used.');
  }
}

export async function startTripLocationTracking(params: {
  tripId: string;
  destination: LatLng;
  onPoint: (point: RoutePoint) => void;
  onArrival: () => void;
}) {
  await requestForegroundLocationPermission();
  await Notifications.requestPermissionsAsync();
  state.tripId = params.tripId;
  state.destination = params.destination;
  state.onPoint = params.onPoint;
  state.onArrival = params.onArrival;
  state.hasArrived = false;

  const foregroundWatcher = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      distanceInterval: 10,
      timeInterval: 5000
    },
    (location) => {
      const point = locationToRoutePoint(location);
      void saveRoutePoint(params.tripId, point);
      params.onPoint(point);
      void detectArrival(point);
    }
  );

  try {
    await requestBackgroundLocationPermission();
    const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(CHALO_LOCATION_TASK);
    if (!alreadyStarted) {
      await Location.startLocationUpdatesAsync(CHALO_LOCATION_TASK, {
        accuracy: Location.Accuracy.High,
        distanceInterval: 20,
        timeInterval: 10000,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'Chalo is tracking your walk',
          notificationBody: 'Your private walking trip is active.',
          notificationColor: '#FF9F1C'
        }
      });
    }
  } catch {
    // Expo Go may not fully support background tracking. The foreground watcher
    // remains active, and the UI includes a manual Mark Reached fallback.
  }

  return foregroundWatcher;
}

export async function stopTripLocationTracking() {
  state.tripId = null;
  state.destination = null;
  state.onPoint = undefined;
  state.onArrival = undefined;
  state.hasArrived = false;
  const started = await Location.hasStartedLocationUpdatesAsync(CHALO_LOCATION_TASK);
  if (started) await Location.stopLocationUpdatesAsync(CHALO_LOCATION_TASK);
}

export function updateTrackingDestination(destination: LatLng) {
  state.destination = destination;
  state.hasArrived = false;
}
