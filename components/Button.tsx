import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors } from '../theme';

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  style
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style
      ]}
    >
      <Text style={[styles.text, variant === 'secondary' && styles.secondaryText]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 18
  },
  secondary: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border
  },
  danger: { backgroundColor: colors.danger },
  disabled: { opacity: 0.45 },
  pressed: { transform: [{ scale: 0.98 }] },
  text: { color: '#15100A', fontWeight: '900', fontSize: 16 },
  secondaryText: { color: colors.text }
});
