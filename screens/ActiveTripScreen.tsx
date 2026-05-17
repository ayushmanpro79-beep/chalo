import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../components/Button';
import { calculateAverageSpeedKmph, calculateRouteDistanceMeters, formatDistance, formatDuration } from '../lib/distance';
import { openGoogleMapsWalkingDirections } from '../lib/googleMapsLink';
import { startTripLocationTracking, stopTripLocationTracking, updateTrackingDestination } from '../lib/locationTracking';
import { getRandomDestination } from '../lib/places';
import { uploadDestinationPhoto } from '../lib/storage';
import { finalizeTrip, saveDestinationStop } from '../lib/trips';
import { colors } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { Place, RoutePoint } from '../types/trip';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveTrip'>;

export function ActiveTripScreen({ navigation, route }: Props) {
  const { tripId, home, minRadiusMeters, maxRadiusMeters, category } = route.params;
  const [destination, setDestination] = useState<Place>(route.params.destination);
  const [stopNumber, setStopNumber] = useState(route.params.stopNumber);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [reached, setReached] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGoingHome, setIsGoingHome] = useState(false);
  const tripStartedAt = useRef(Date.now());
  const stopStartedAt = useRef(Date.now());

  const distance = useMemo(() => calculateRouteDistanceMeters(routePoints), [routePoints]);
  const duration = Math.floor((Date.now() - tripStartedAt.current) / 1000);
  const averageSpeed = calculateAverageSpeedKmph(distance, duration);
  const latest = routePoints[routePoints.length - 1];

  useEffect(() => {
    let watcher: { remove: () => void } | null = null;
    startTripLocationTracking({
      tripId,
      destination,
      onPoint: (point) => setRoutePoints((current) => [...current, point]),
      onArrival: () => setReached(true)
    })
      .then((subscription) => {
        watcher = subscription;
      })
      .catch((err) => setError(err.message));

    return () => {
      watcher?.remove();
      void stopTripLocationTracking();
    };
  }, [tripId]);

  useEffect(() => {
    updateTrackingDestination(destination);
  }, [destination]);

  async function pickPhoto() {
    const camera = await ImagePicker.requestCameraPermissionsAsync();
    if (camera.status === 'granted') {
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [4, 3] });
      if (!result.canceled) setPhotoUri(result.assets[0].uri);
      return;
    }
    const library = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (library.status !== 'granted') {
      setError('Allow camera or photo access to save a stop photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true, aspect: [4, 3] });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  }

  async function saveReachedStop(destinationType: 'random_stop' | 'round_trip_home' = 'random_stop') {
    setSaving(true);
    setError(null);
    try {
      const photoUrl = photoUri ? await uploadDestinationPhoto(tripId, stopNumber, photoUri) : null;
      await saveDestinationStop({
        tripId,
        stopNumber,
        destination,
        destinationType,
        timeTakenSeconds: Math.floor((Date.now() - stopStartedAt.current) / 1000),
        distanceFromPreviousMeters: distance,
        photoUrl,
        caption
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this stop.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function continueTrip() {
    const saved = await saveReachedStop();
    if (!saved || !latest) return;
    setSaving(true);
    try {
      const next = await getRandomDestination({
        latitude: latest.latitude,
        longitude: latest.longitude,
        minRadiusMeters,
        maxRadiusMeters,
        category
      });
      setDestination(next);
      setStopNumber((current) => current + 1);
      setCaption('');
      setPhotoUri(null);
      setReached(false);
      setIsGoingHome(false);
      stopStartedAt.current = Date.now();
      await openGoogleMapsWalkingDirections(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No destination found. Try increasing radius or changing category.');
    } finally {
      setSaving(false);
    }
  }

  async function roundTripHome() {
    const saved = await saveReachedStop();
    if (!saved) return;
    const homeDestination: Place = {
      id: 'trip-start',
      provider: 'openstreetmap',
      name: 'Trip start',
      category: 'Round trip home',
      latitude: home.latitude,
      longitude: home.longitude,
      distanceMeters: 0
    };
    setDestination(homeDestination);
    setStopNumber((current) => current + 1);
    setCaption('');
    setPhotoUri(null);
    setReached(false);
    setIsGoingHome(true);
    stopStartedAt.current = Date.now();
    await openGoogleMapsWalkingDirections(home);
  }

  async function endTrip() {
    if (reached && !isGoingHome) await saveReachedStop();
    if (reached && isGoingHome) await saveReachedStop('round_trip_home');
    await finalizeTrip(tripId, routePoints, tripStartedAt.current);
    await stopTripLocationTracking();
    navigation.replace('TripSummary', { tripId });
  }

  async function markReached() {
    setReached(true);
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>{isGoingHome ? 'Round trip home' : `Stop ${stopNumber}`}</Text>
        <Text style={styles.title}>{destination.name}</Text>
        <Text style={styles.meta}>{destination.category}</Text>
        <View style={styles.stats}>
          <Text style={styles.stat}>{formatDuration(duration)}</Text>
          <Text style={styles.stat}>{formatDistance(distance)}</Text>
          <Text style={styles.stat}>{averageSpeed.toFixed(1)} km/h</Text>
        </View>
        <Text style={styles.meta}>{Math.max(0, stopNumber - 1)} stops completed</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Reopen Google Maps" onPress={() => void openGoogleMapsWalkingDirections(destination)} />
        <Button title="Mark Reached" variant="secondary" onPress={markReached} />
        <Button title="End Trip" variant="danger" onPress={endTrip} disabled={saving} />
      </ScrollView>

      <Modal visible={reached} animationType="slide" transparent>
        <View style={styles.modalShade}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>You reached your Chalo destination.</Text>
            <Text style={styles.modalText}>{destination.name}</Text>
            <Button title={photoUri ? 'Photo selected' : 'Take or upload photo'} onPress={pickPhoto} variant={photoUri ? 'secondary' : 'primary'} />
            <TextInput value={caption} onChangeText={setCaption} placeholder="Optional caption" placeholderTextColor={colors.muted} style={styles.caption} />
            {saving ? <ActivityIndicator color={colors.accent} /> : null}
            {!isGoingHome ? <Button title="Continue Trip" onPress={continueTrip} disabled={saving} /> : null}
            {!isGoingHome ? <Button title="Round Trip Home" variant="secondary" onPress={roundTripHome} disabled={saving} /> : null}
            <Button title="End Trip" variant="secondary" onPress={endTrip} disabled={saving} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 16 },
  kicker: { color: colors.green, fontWeight: '900' },
  title: { color: colors.text, fontSize: 30, fontWeight: '900' },
  meta: { color: colors.muted, lineHeight: 21 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18 },
  stat: { color: colors.green, fontWeight: '900' },
  error: { color: colors.danger },
  modalShade: { flex: 1, backgroundColor: 'rgba(0,0,0,0.58)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, gap: 14 },
  modalTitle: { color: colors.text, fontSize: 24, fontWeight: '900' },
  modalText: { color: colors.muted },
  caption: { minHeight: 54, color: colors.text, backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14 }
});
