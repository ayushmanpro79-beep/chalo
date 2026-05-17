import { getDistanceMeters } from './distance';
import { DestinationCategory, Place } from '../types/trip';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const MIN_REQUEST_INTERVAL_MS = 8000;
let lastRequestAt = 0;

export const categoryOptions: Array<{ label: string; value: DestinationCategory }> = [
  { label: 'Surprise me', value: 'surprise' },
  { label: 'Cafe', value: 'cafe' },
  { label: 'Park', value: 'park' },
  { label: 'Food', value: 'food' },
  { label: 'Landmark', value: 'landmark' },
  { label: 'Mall', value: 'mall' },
  { label: 'Religious place', value: 'religious_place' },
  { label: 'Tourist attraction', value: 'tourist_attraction' }
];

const overpassFilters: Record<DestinationCategory, string[]> = {
  cafe: ['["amenity"="cafe"]'],
  food: ['["amenity"="restaurant"]', '["amenity"="fast_food"]'],
  park: ['["leisure"="park"]'],
  landmark: ['["tourism"="attraction"]', '["historic"]'],
  mall: ['["shop"="mall"]'],
  religious_place: ['["amenity"="place_of_worship"]'],
  tourist_attraction: ['["tourism"="attraction"]'],
  surprise: [
    '["amenity"="cafe"]',
    '["amenity"="restaurant"]',
    '["amenity"="fast_food"]',
    '["leisure"="park"]',
    '["tourism"="attraction"]',
    '["historic"]',
    '["shop"="mall"]',
    '["amenity"="place_of_worship"]'
  ]
};

type OverpassElement = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function getCategoryFromTags(tags: Record<string, string> = {}) {
  if (tags.amenity === 'cafe') return 'Cafe';
  if (tags.amenity === 'restaurant' || tags.amenity === 'fast_food') return 'Food';
  if (tags.leisure === 'park') return 'Park';
  if (tags.shop === 'mall') return 'Mall';
  if (tags.amenity === 'place_of_worship') return 'Religious place';
  if (tags.tourism === 'attraction') return 'Tourist attraction';
  if (tags.historic) return 'Landmark';
  return 'Surprise';
}

function getAddress(tags: Record<string, string> = {}) {
  const parts = [tags['addr:housenumber'], tags['addr:street'], tags['addr:suburb'], tags['addr:city']].filter(Boolean);
  return parts.join(', ');
}

function buildQuery(latitude: number, longitude: number, radius: number, category: DestinationCategory) {
  const filters = overpassFilters[category] ?? overpassFilters.surprise;
  const blocks = filters
    .flatMap((filter) => [
      `node${filter}(around:${Math.round(radius)},${latitude},${longitude});`,
      `way${filter}(around:${Math.round(radius)},${latitude},${longitude});`,
      `relation${filter}(around:${Math.round(radius)},${latitude},${longitude});`
    ])
    .join('\n');

  return `
    [out:json][timeout:25];
    (
      ${blocks}
    );
    out center tags 80;
  `;
}

export async function getRandomDestination({
  latitude,
  longitude,
  minRadiusMeters,
  maxRadiusMeters,
  category
}: {
  latitude: number;
  longitude: number;
  minRadiusMeters: number;
  maxRadiusMeters: number;
  category: DestinationCategory;
}): Promise<Place> {
  // Overpass is a free public OpenStreetMap service. Be polite: call it only on
  // explicit user actions and keep a basic rate limit between requests.
  const now = Date.now();
  const waitFor = Math.max(0, MIN_REQUEST_INTERVAL_MS - (now - lastRequestAt));
  if (waitFor > 0) await sleep(waitFor);
  lastRequestAt = Date.now();

  const query = buildQuery(latitude, longitude, maxRadiusMeters, category);
  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: `data=${encodeURIComponent(query)}`
  });

  if (!response.ok) {
    throw new Error('Destination search is busy right now. Try again in a minute.');
  }

  const json = (await response.json()) as { elements?: OverpassElement[] };
  const origin = { latitude, longitude };

  const places = (json.elements ?? [])
    .map((element): Place | null => {
      const lat = element.lat ?? element.center?.lat;
      const lon = element.lon ?? element.center?.lon;
      if (typeof lat !== 'number' || typeof lon !== 'number') return null;
      const tags = element.tags ?? {};
      const name = tags.name?.trim();
      if (!name) return null;
      const destination = { latitude: lat, longitude: lon };
      const distanceMeters = getDistanceMeters(origin, destination);
      return {
        id: `${element.type}/${element.id}`,
        provider: 'openstreetmap',
        name,
        address: getAddress(tags),
        category: getCategoryFromTags(tags),
        latitude: lat,
        longitude: lon,
        distanceMeters,
        rawTags: tags
      };
    })
    .filter((place): place is Place => Boolean(place))
    .filter((place) => place.distanceMeters >= minRadiusMeters && place.distanceMeters <= maxRadiusMeters);

  const unique = Array.from(new Map(places.map((place) => [place.id, place])).values());
  const picked = shuffle(unique)[0];

  if (!picked) {
    throw new Error('No destination found. Try increasing radius or changing category.');
  }

  return picked;
}
