import { DestinationCategory, LatLng, Place, TripWithDetails } from './trip';

export type RootStackParamList = {
  Home: undefined;
  NewTrip: undefined;
  ActiveTrip: {
    tripId: string;
    home: LatLng;
    destination: Place;
    minRadiusMeters: number;
    maxRadiusMeters: number;
    category: DestinationCategory;
    stopNumber: number;
  };
  TripSummary: { tripId: string };
  TripDetails: { tripId: string; trip?: TripWithDetails };
};
