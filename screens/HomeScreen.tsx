import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { MetricCard } from '../components/MetricCard';
import { formatDistance, formatDuration } from '../lib/distance';
import { fetchTrips, getTripStats } from '../lib/trips';
import { colors } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { TripWithDetails } from '../types/trip';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const [trips, setTrips] = useState<TripWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTrips = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTrips(await fetchTrips());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load trips.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadTrips();
    }, [loadTrips])
  );

  const stats = getTripStats(trips);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Private walking sprees</Text>
          <Text style={styles.title}>Chalo</Text>
        </View>
        <Button title="+" onPress={() => navigation.navigate('NewTrip')} style={styles.plus} />
      </View>

      <View style={styles.metrics}>
        <MetricCard label="Total trips" value={String(stats.totalTrips)} />
        <MetricCard label="Walked" value={formatDistance(stats.totalDistance)} />
        <MetricCard label="Stops" value={String(stats.totalStops)} />
      </View>

      {loading ? <ActivityIndicator color={colors.accent} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={trips.length ? <Text style={styles.section}>Recent trips</Text> : null}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Tap + to start your first free Chalo walk.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.tripCard}>
            {item.cover_photo_url ? <Image source={{ uri: item.cover_photo_url }} style={styles.cover} /> : <View style={styles.coverFallback} />}
            <View style={styles.tripBody}>
              <Text style={styles.tripDate}>{new Date(item.start_time).toLocaleString()}</Text>
              <Text style={styles.tripTitle}>{item.title ?? 'Chalo walk'}</Text>
              <Text style={styles.tripMeta}>
                {formatDistance(Number(item.total_distance_meters || 0))} • {formatDuration(Number(item.total_duration_seconds || 0))} •{' '}
                {Number(item.average_speed_kmph || 0).toFixed(1)} km/h • {item.destinations?.length ?? 0} stops
              </Text>
              <Button title="Open Trip Details" variant="secondary" onPress={() => navigation.navigate('TripDetails', { tripId: item.id, trip: item })} />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, paddingTop: 64, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { color: colors.green, fontWeight: '800', letterSpacing: 0 },
  title: { color: colors.text, fontSize: 48, fontWeight: '900' },
  plus: { width: 58, borderRadius: 29 },
  metrics: { flexDirection: 'row', gap: 10, marginTop: 24, marginBottom: 18 },
  section: { color: colors.text, fontSize: 18, fontWeight: '900', marginBottom: 10 },
  list: { paddingBottom: 40 },
  tripCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 20, marginBottom: 14, overflow: 'hidden' },
  cover: { height: 150, width: '100%' },
  coverFallback: { height: 90, backgroundColor: colors.surfaceSoft },
  tripBody: { padding: 14, gap: 8 },
  tripDate: { color: colors.muted, fontSize: 12 },
  tripTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  tripMeta: { color: colors.muted, lineHeight: 20 },
  empty: { color: colors.muted, marginTop: 30, lineHeight: 22 },
  error: { color: colors.danger, marginBottom: 12 }
});
