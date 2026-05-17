import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';

export async function compressPhoto(localUri: string) {
  return ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: 1280 } }],
    { compress: 0.72, format: ImageManipulator.SaveFormat.JPEG }
  );
}

export async function uploadDestinationPhoto(tripId: string, stopNumber: number, localUri: string): Promise<string> {
  const compressed = await compressPhoto(localUri);
  const response = await fetch(compressed.uri);
  const arrayBuffer = await response.arrayBuffer();
  const path = `trips/${tripId}/stop-${stopNumber}.jpg`;

  const { error } = await supabase.storage.from('trip-photos').upload(path, arrayBuffer, {
    contentType: 'image/jpeg',
    upsert: true
  });
  if (error) throw error;

  const { data } = supabase.storage.from('trip-photos').getPublicUrl(path);
  return data.publicUrl;
}
