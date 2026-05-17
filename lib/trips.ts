import { LatLng, Place, RoutePoint, Trip, TripWithDetails } from '../types/trip';
import { calculateAverageSpeedKmph, calculateRouteDistanceMeters } from './distance';
import { supabase } from './supabase';

export async function fetchTrips(): Promise<TripWithDetails[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*, destinations(*), route_points(*)')
    .order('start_time', { ascending: false })
    .order('stop_number', { referencedTable: 'destinations', ascending: true })
    .order('recorded_at', { referencedTable: 'route_points', ascending: true });
  if (error) throw error;
  return (data ?? []) as TripWithDetails[];
}

export async function fetchTripDetails(tripId: string): Promise<TripWithDetails> {
  const { data, error } = await supabase
    .from('trips')
    .select('*, destinations(*), route_points(*)')
    .eq('id', tripId)
    .order('stop_number', { referencedTable: 'destinations', ascending: true })
    .order('recorded_at', { referencedTable: 'route_points', ascending: true })
    .single();
  if (error) throw error;
  return data as TripWithDetails;
}

export async function createTrip(home: LatLng): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .insert({
      title: `Chalo walk ${new Date().toLocaleDateString()}`,
      start_latitude: home.latitude,
      start_longitude: home.longitude,
      status: 'active'
    })
    .select()
    .single();
  if (error) throw error;
  return data as Trip;
}

export async function saveRoutePoint(tripId: string, point: RoutePoint) {
  const { error } = await supabase.from('route_points').insert({
    trip_id: tripId,
    latitude: point.latitude,
    longitude: point.longitude,
    speed_mps: point.speed_mps ?? null,
    accuracy: point.accuracy ?? null,
    recorded_at: point.recorded_at ?? new Date().toISOString()
  });
  if (error) throw error;
}

export async function saveDestinationStop(params: {
  tripId: string;
  stopNumber: number;
  destination: Place;
  destinationType?: 'random_stop' | 'round_trip_home';
  timeTakenSeconds: number;
  distanceFromPreviousMeters: number;
  photoUrl?: string | null;
  caption?: string | null;
}) {
  const { error } = await supabase.from('destinations').insert({
    trip_id: params.tripId,
    stop_number: params.stopNumber,
    provider_place_id: params.destination.id,
    provider: params.destination.provider,
    place_name: params.destination.name,
    place_address: params.destination.address ?? null,
    category: params.destination.category,
    latitude: params.destination.latitude,
    longitude: params.destination.longitude,
    arrival_time: new Date().toISOString(),
    time_taken_seconds: params.timeTakenSeconds,
    distance_from_previous_meters: params.distanceFromPreviousMeters,
    photo_url: params.photoUrl ?? null,
    caption: params.caption ?? null,
    destination_type: params.destinationType ?? 'random_stop'
  });
  if (error) throw error;
}

export async function finalizeTrip(tripId: string, routePoints: RoutePoint[], startedAt: number) {
  const distance = calculateRouteDistanceMeters(routePoints);
  const duration = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
  const averageSpeed = calculateAverageSpeedKmph(distance, duration);
  const { data: stops } = await supabase
    .from('destinations')
    .select('photo_url')
    .eq('trip_id', tripId)
    .not('photo_url', 'is', null)
    .order('stop_number', { ascending: true })
    .limit(1);

  const { error } = await supabase
    .from('trips')
    .update({
      end_time: new Date().toISOString(),
      total_distance_meters: distance,
      total_duration_seconds: duration,
      average_speed_kmph: averageSpeed,
      cover_photo_url: stops?.[0]?.photo_url ?? null,
      status: 'completed'
    })
    .eq('id', tripId);
  if (error) throw error;
}

export async function updateDiaryNote(tripId: string, diaryNote: string) {
  const { error } = await supabase.from('trips').update({ diary_note: diaryNote }).eq('id', tripId);
  if (error) throw error;
}

export function getTripStats(trips: TripWithDetails[]) {
  return trips.reduce(
    (stats, trip) => ({
      totalTrips: stats.totalTrips + 1,
      totalDistance: stats.totalDistance + Number(trip.total_distance_meters || 0),
      totalStops: stats.totalStops + (trip.destinations?.length ?? 0)
    }),
    { totalTrips: 0, totalDistance: 0, totalStops: 0 }
  );
}
