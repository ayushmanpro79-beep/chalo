export type LatLng = {
  latitude: number;
  longitude: number;
};

export type DestinationCategory =
  | 'surprise'
  | 'cafe'
  | 'park'
  | 'food'
  | 'landmark'
  | 'mall'
  | 'religious_place'
  | 'tourist_attraction';

export type Place = LatLng & {
  id: string;
  provider: 'openstreetmap';
  name: string;
  address?: string;
  category: string;
  distanceMeters: number;
  rawTags?: Record<string, string>;
};

export type Trip = {
  id: string;
  title: string | null;
  start_time: string;
  end_time: string | null;
  start_latitude: number | null;
  start_longitude: number | null;
  total_distance_meters: number;
  total_duration_seconds: number;
  average_speed_kmph: number;
  diary_note: string | null;
  cover_photo_url: string | null;
  status: 'active' | 'completed';
  created_at: string;
};

export type DestinationStop = {
  id: string;
  trip_id: string;
  stop_number: number;
  provider_place_id: string | null;
  provider: string;
  place_name: string;
  place_address: string | null;
  category: string | null;
  latitude: number;
  longitude: number;
  arrival_time: string | null;
  time_taken_seconds: number | null;
  distance_from_previous_meters: number | null;
  photo_url: string | null;
  caption: string | null;
  destination_type: 'random_stop' | 'round_trip_home';
  created_at: string;
};

export type RoutePoint = LatLng & {
  id?: string;
  trip_id?: string;
  speed_mps?: number | null;
  accuracy?: number | null;
  recorded_at?: string;
};

export type TripWithDetails = Trip & {
  destinations: DestinationStop[];
  route_points: RoutePoint[];
};
