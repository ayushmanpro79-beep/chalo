import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 84,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    justifyContent: 'space-between'
  },
  value: { color: colors.text, fontSize: 20, fontWeight: '900' },
  label: { color: colors.muted, fontSize: 12 }
});
