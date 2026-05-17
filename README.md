# Chalo

Chalo is a private, single-user walking-spree app designed to run at ₹0/month for personal use.

It does not use AI, Google Maps SDK, Google Places API, Google Routes API, paid map APIs, or a Google Cloud billing account. Random destinations come from free OpenStreetMap data through the public Overpass API. Google Maps is only opened externally with a normal directions URL.

## Included

- Expo React Native app with TypeScript
- Supabase free-tier database and Storage support
- OpenStreetMap/Overpass destination discovery
- External Google Maps walking directions links
- Expo foreground and background location tracking
- Arrival detection with Haversine distance
- Local arrival notification plus manual Mark Reached fallback
- Photo compression before Supabase Storage upload
- Free OpenStreetMap route preview through a small Leaflet WebView

## Install

```bash
npm install
```

## Supabase Setup

1. Create a free Supabase project.
2. Open the SQL Editor.
3. Paste and run `supabase/schema.sql`.
4. Confirm the Storage bucket exists:
   - Bucket name: `trip-photos`
   - Prototype mode: public bucket
   - Photo path format: `trips/{trip_id}/stop-{stop_number}.jpg`

The schema includes simple anonymous read/write policies for a private prototype. Tighten these later with Supabase Auth before sharing the app.

## Environment

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Fill in:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_PLACES_PROVIDER=overpass
```

Do not add Google API keys. Chalo does not need them.

## Run

```bash
npm run start
```

Use a physical iOS or Android device for GPS, camera, local notifications, and Google Maps handoff.

## Why Google Maps SDK Is Not Used

Google Maps SDK, Places API, and Routes API can require Google Cloud setup and billing. Chalo avoids that completely. The app opens Google Maps externally with:

```text
https://www.google.com/maps/dir/?api=1&destination=LAT,LNG&travelmode=walking
```

Navigation happens in the Google Maps app or browser. Chalo only tracks the walk privately and saves your diary.

## Overpass Notes

Overpass is a free public OpenStreetMap service. It is suitable for personal/private use, but it should be used politely:

- Chalo only calls Overpass when you tap `Find random destination` or `Continue Trip`.
- A basic in-app rate limit avoids repeated rapid requests.
- Avoid repeatedly testing tiny changes by spamming requests.

## Background Location Notes

Expo background location may require a development build. Expo Go may not fully support every background behavior. Foreground tracking still works, and the Active Trip screen includes a manual `Mark Reached` button in case OS background limits interrupt arrival detection.

Android and iOS permissions are configured in `app.config.ts`, but each platform can still show its own permission prompts.

## Staying Free

- Keep the app private.
- Compress photos before upload. Chalo uses `expo-image-manipulator` to resize photos to 1280px wide and JPEG quality `0.72`.
- Keep an eye on Supabase free-tier database and Storage usage.
- Avoid Google paid APIs.
- Avoid heavy OpenStreetMap tile usage; route previews are for personal diary viewing, not mass traffic.

## MVP Boundaries

No social accounts, no login, no achievements, no monetization, no AI, and no paid API dependency.
