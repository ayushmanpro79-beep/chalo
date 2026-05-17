import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../theme';
import { LatLng, RoutePoint } from '../types/trip';

export function RouteMap({
  routePoints,
  destination,
  height = 260
}: {
  routePoints: RoutePoint[];
  destination?: LatLng;
  height?: number;
}) {
  const points = routePoints.map((point) => [point.latitude, point.longitude]);
  const marker = destination ? [destination.latitude, destination.longitude] : null;
  const center = points[0] ?? marker ?? [28.6139, 77.209];
  const html = `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          html, body, #map { height: 100%; margin: 0; background: #050811; }
          .leaflet-control-attribution { font-size: 10px; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          const points = ${JSON.stringify(points)};
          const destination = ${JSON.stringify(marker)};
          const map = L.map('map', { zoomControl: false }).setView(${JSON.stringify(center)}, 14);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);
          if (points.length > 1) {
            const line = L.polyline(points, { color: '#FFB020', weight: 5 }).addTo(map);
            map.fitBounds(line.getBounds(), { padding: [28, 28] });
          }
          if (destination) L.circleMarker(destination, { radius: 8, color: '#FF9F1C', fillColor: '#FF9F1C', fillOpacity: 1 }).addTo(map);
        </script>
      </body>
    </html>
  `;

  return (
    <View style={[styles.wrap, { height }]}>
      <WebView originWhitelist={['*']} source={{ html }} style={styles.webview} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  webview: { flex: 1, backgroundColor: colors.surface }
});
