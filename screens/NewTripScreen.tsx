import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../components/Button';
import { formatDistance } from '../lib/distance';
import { openGoogleMapsWalkingDirections } from '../lib/googleMapsLink';
import { categoryOptions, getRandomDestination } from '../lib/places';
import { createTrip } from '../lib/trips';
import { colors } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { DestinationCategory, LatLng, Place } from '../types/trip';

type Props = NativeStackScreenProps<RootStackParamList, 'NewTrip'>;

export function NewTripScreen({ navigation }: Props) {
  const [minKm, setMinKm] = useState('1');
  const [maxKm, setMaxKm] = useState('5');
  const [category, setCategory] = useState<DestinationCategory>('surprise');
  const [location, setLocation] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function useCurrentLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') throw new Error('Location permission is needed to find nearby places.');
    const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const next = { latitude: current.coords.latitude, longitude: current.coords.longitude };
    setLocation(next);
    return next;
  }

  async function findDestination() {
    setLoading(true);
    setError(null);
    setDestination(null);
    try {
      const current = location ?? (await useCurrentLocation());
      const minRadiusMeters = Math.max(0, Number(minKm) * 1000);
      const maxRadiusMeters = Math.max(minRadiusMeters + 100, Number(maxKm) * 1000);
      const picked = await getRandomDestination({
        latitude: current.latitude,
        longitude: current.longitude,
        minRadiusMeters,
        maxRadiusMeters,
        category
      });
      setDestination(picked);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No destination found. Try increasing radius or changing category.');
    } finally {
      setLoading(false);
    }
  }

  async function startWalking() {
    if (!location || !destination) return;
    setLoading(true);
    setError(null);
    try {
      const trip = await createTrip(location);
      await openGoogleMapsWalkingDirections(destination);
      navigation.replace('ActiveTrip', {
        tripId: trip.id,
        home: location,
        destination,
        minRadiusMeters: Number(minKm) * 1000,
        maxRadiusMeters: Number(maxKm) * 1000,
        category,
        stopNumber: 1
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start walking.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Choose your walking ring</Text>
      <View style={styles.row}>
        <View style={styles.inputWrap}>
          <Text style={styles.label}>Minimum radius in km</Text>
          <TextInput value={minKm} onChangeText={setMinKm} keyboardType="decimal-pad" style={styles.input} />
        </View>
        <View style={styles.inputWrap}>
          <Text style={styles.label}>Maximum radius in km</Text>
          <TextInput value={maxKm} onChangeText={setMaxKm} keyboardType="decimal-pad" style={styles.input} />
        </View>
      </View>

      <Text style={styles.label}>Category</Text>
      <View style={styles.chips}>
        {categoryOptions.map((option) => (
          <Pressable key={option.value} onPress={() => setCategory(option.value)} style={[styles.chip, category === option.value && styles.chipActive]}>
            <Text style={[styles.chipText, category === option.value && styles.chipTextActive]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>

      <Button title={location ? 'Location ready' : 'Use current location'} variant={location ? 'secondary' : 'primary'} onPress={() => void useCurrentLocation().catch((err) => setError(err.message))} />
      <Button title={loading ? 'Finding...' : 'Find random destination'} onPress={findDestination} disabled={loading} />
      {loading ? <ActivityIndicator color={colors.accent} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {destination ? (
        <View style={styles.result}>
          <Text style={styles.destinationName}>{destination.name}</Text>
          <Text style={styles.meta}>{destination.category}</Text>
          <Text style={styles.meta}>{destination.address || 'OpenStreetMap place'}</Text>
          <Text style={styles.distance}>{formatDistance(destination.distanceMeters)} away</Text>
          <Text style={styles.coords}>{destination.latitude.toFixed(5)}, {destination.longitude.toFixed(5)}</Text>
          <Button title="Start walking with Google Maps" onPress={startWalking} disabled={loading} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 18 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900' },
  row: { flexDirection: 'row', gap: 12 },
  inputWrap: { flex: 1 },
  label: { color: colors.muted, fontWeight: '800', marginBottom: 8 },
  input: { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text, fontWeight: '800' },
  chipTextActive: { color: '#15100A' },
  result: { gap: 10, padding: 16, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 20 },
  destinationName: { color: colors.text, fontSize: 24, fontWeight: '900' },
  meta: { color: colors.muted, lineHeight: 20 },
  distance: { color: colors.green, fontWeight: '900' },
  coords: { color: colors.muted, fontSize: 12 },
  error: { color: colors.danger, lineHeight: 21 }
});
