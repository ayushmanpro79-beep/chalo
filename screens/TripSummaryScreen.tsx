import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../components/Button';
import { RouteMap } from '../components/RouteMap';
import { formatDistance, formatDuration } from '../lib/distance';
import { fetchTripDetails, updateDiaryNote } from '../lib/trips';
import { colors } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { TripWithDetails } from '../types/trip';

type Props = NativeStackScreenProps<RootStackParamList, 'TripSummary'>;

export function TripSummaryScreen({ navigation, route }: Props) {
  const [trip, setTrip] = useState<TripWithDetails | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchTripDetails(route.params.tripId).then((data) => {
      setTrip(data);
      setNote(data.diary_note ?? '');
    });
  }, [route.params.tripId]);

  async function saveNote() {
    await updateDiaryNote(route.params.tripId, note);
    navigation.navigate('Home');
  }

  if (!trip) return <ActivityIndicator color={colors.accent} style={{ flex: 1 }} />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <RouteMap routePoints={trip.route_points ?? []} height={260} />
      <View style={styles.stats}>
        <Text style={styles.stat}>{formatDistance(Number(trip.total_distance_meters || 0))}</Text>
        <Text style={styles.stat}>{formatDuration(Number(trip.total_duration_seconds || 0))}</Text>
        <Text style={styles.stat}>{Number(trip.average_speed_kmph || 0).toFixed(1)} km/h</Text>
      </View>
      <Text style={styles.heading}>Stops</Text>
      {trip.destinations?.map((stop) => (
        <View key={stop.id} style={styles.stop}>
          {stop.photo_url ? <Image source={{ uri: stop.photo_url }} style={styles.photo} /> : null}
          <Text style={styles.stopName}>{stop.stop_number}. {stop.place_name}</Text>
          <Text style={styles.meta}>{stop.category}</Text>
          <Text style={styles.meta}>Reached in {formatDuration(Number(stop.time_taken_seconds || 0))}</Text>
          {stop.caption ? <Text style={styles.caption}>{stop.caption}</Text> : null}
        </View>
      ))}
      <Text style={styles.heading}>Diary note</Text>
      <TextInput value={note} onChangeText={setNote} multiline placeholder="How did this walk feel?" placeholderTextColor={colors.muted} style={styles.note} />
      <Button title="Save diary" onPress={saveNote} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 16 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14 },
  stat: { color: colors.green, fontWeight: '900' },
  heading: { color: colors.text, fontSize: 20, fontWeight: '900' },
  stop: { gap: 8, padding: 14, backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border },
  photo: { width: '100%', height: 180, borderRadius: 14 },
  stopName: { color: colors.text, fontSize: 18, fontWeight: '900' },
  meta: { color: colors.muted },
  caption: { color: colors.text, lineHeight: 21 },
  note: { minHeight: 140, textAlignVertical: 'top', color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 14 }
});
