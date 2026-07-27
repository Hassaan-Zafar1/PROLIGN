import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, radius, shadow, shadowSm } from '../theme';

// ---- Icon: accepts Material Symbols style names (underscores) ----
export function Icon({ name, size = 20, color = colors.onSurfaceVariant, style }) {
  const mapped = String(name).replace(/_/g, '-');
  return <MaterialIcons name={mapped} size={size} color={color} style={style} />;
}

// ---- Avatar: initials in a moss circle (matches web fallback) ----
export function Avatar({ name, size = 40, bg = colors.secondary, color = colors.white }) {
  const initials = (name || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2, backgroundColor: bg,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: colors.surfaceVariant,
      }}
    >
      <Text style={{ color, fontFamily: fonts.bodyBold, fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}

// ---- Card ----
export function Card({ children, style, padded = true }) {
  return (
    <View style={[styles.card, padded && { padding: 18 }, style]}>{children}</View>
  );
}

// ---- Button ----
const btnVariants = {
  primary: { bg: colors.primary, fg: colors.onPrimary, border: 'transparent' },
  secondary: { bg: colors.surfaceContainerHigh, fg: colors.onSurface, border: colors.outlineVariant },
  accent: { bg: colors.secondary, fg: colors.onSecondary, border: 'transparent' },
  outline: { bg: 'transparent', fg: colors.primary, border: colors.outlineVariant },
  ghost: { bg: 'transparent', fg: colors.onSurfaceVariant, border: 'transparent' },
  error: { bg: colors.error, fg: colors.onError, border: 'transparent' },
};
export function Button({ title, onPress, variant = 'primary', icon, size = 'md', style, disabled, full }) {
  const v = btnVariants[variant] || btnVariants.primary;
  const pad = size === 'lg' ? { paddingVertical: 14, paddingHorizontal: 22 }
    : size === 'sm' ? { paddingVertical: 8, paddingHorizontal: 12 }
    : { paddingVertical: 12, paddingHorizontal: 18 };
  const fontSize = size === 'lg' ? 16 : size === 'sm' ? 13 : 14.5;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          backgroundColor: v.bg, borderColor: v.border, borderWidth: v.border === 'transparent' ? 0 : 1,
          borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: disabled ? 0.5 : 1,
        },
        pad,
        full && { alignSelf: 'stretch' },
        variant === 'primary' || variant === 'accent' ? shadowSm : null,
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={fontSize + 3} color={v.fg} /> : null}
      <Text style={{ color: v.fg, fontFamily: fonts.bodyBold, fontSize }}>{title}</Text>
    </TouchableOpacity>
  );
}

// ---- Badge / status pill ----
const badgeStyles = {
  confirmed: { bg: colors.primaryContainer, fg: colors.onPrimaryContainer },
  scheduled: { bg: colors.primaryContainer, fg: colors.onPrimaryContainer },
  pending: { bg: 'rgba(49,36,3,0.10)', fg: colors.tertiary },
  cancelled: { bg: colors.errorContainer, fg: colors.onErrorContainer },
  completed: { bg: colors.secondaryContainer, fg: colors.onSecondaryContainer },
  approved: { bg: colors.secondaryContainer, fg: colors.onSecondaryContainer },
  rejected: { bg: colors.errorContainer, fg: colors.onErrorContainer },
  junior: { bg: 'rgba(74,90,42,0.10)', fg: colors.secondary },
  intermediate: { bg: 'rgba(49,36,3,0.10)', fg: colors.tertiary },
  senior: { bg: 'rgba(26,40,10,0.10)', fg: colors.primary },
  neutral: { bg: colors.surfaceContainerHigh, fg: colors.onSurfaceVariant },
};
export function Badge({ label, variant = 'neutral', icon, style }) {
  const key = String(variant).toLowerCase();
  const v = badgeStyles[key] || badgeStyles.neutral;
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: v.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' }, style]}>
      {icon ? <Icon name={icon} size={13} color={v.fg} /> : null}
      <Text style={{ color: v.fg, fontFamily: fonts.bodyBold, fontSize: 11 }}>{label}</Text>
    </View>
  );
}

// ---- Tag / chip (skills) ----
export function Tag({ label, active }) {
  return (
    <View style={{ backgroundColor: active ? colors.primary : colors.surfaceContainerHigh, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill }}>
      <Text style={{ color: active ? colors.onPrimary : colors.onSurfaceVariant, fontFamily: fonts.bodySemi, fontSize: 11.5 }}>{label}</Text>
    </View>
  );
}

// ---- Input ----
export function Input({ value, onChangeText, placeholder, secureTextEntry, icon, keyboardType, autoCapitalize, style }) {
  return (
    <View style={[styles.inputWrap, style]}>
      {icon ? <Icon name={icon} size={20} color={colors.onSurfaceVariant} style={{ marginRight: 8 }} /> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9a9688"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize || 'none'}
        style={{ flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.onSurface, paddingVertical: 0 }}
      />
    </View>
  );
}

// ---- Section title ----
export function SectionTitle({ children, style }) {
  return <Text style={[{ fontFamily: fonts.bodyBold, fontSize: 17, color: colors.onSurface }, style]}>{children}</Text>;
}

// ---- KPI / Stat card ----
export function StatCard({ value, label, icon }) {
  return (
    <Card style={{ flex: 1, minWidth: 150 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.serifBold, fontSize: 26, color: colors.onSurface }}>{value}</Text>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 }}>{label}</Text>
        </View>
        {icon ? (
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(26,40,10,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={icon} size={20} color={colors.primary} />
          </View>
        ) : null}
      </View>
    </Card>
  );
}

// ---- Star rating row ----
export function Stars({ rating, size = 14 }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Icon name="star" size={size} color="#d4a017" />
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: size, color: colors.onSurface }}>{rating > 0 ? rating.toFixed(1) : 'New'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(200,194,178,0.45)',
    ...shadowSm,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceBright,
    borderWidth: 1, borderColor: colors.outlineVariant,
    borderRadius: radius.md, paddingHorizontal: 14, height: 52,
  },
});
