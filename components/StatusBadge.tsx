import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type StatusType = 'not_started' | 'working' | 'on_break' | 'done';

interface StatusBadgeProps {
  status: StatusType;
  large?: boolean;
}

const CONFIG: Record<StatusType, { label: string; bg: string; text: string; dot: string }> = {
  not_started: { label: 'Not Started', bg: '#f1f5f9', text: '#64748b', dot: '#94a3b8' },
  working:     { label: 'Working',     bg: '#ecfdf5', text: '#059669', dot: '#10b981' },
  on_break:    { label: 'On Break',    bg: '#fffbeb', text: '#d97706', dot: '#f59e0b' },
  done:        { label: 'Shift Done',  bg: '#eff6ff', text: '#2563eb', dot: '#6366f1' },
};

export function deriveStatus(record: {
  time_in: string | null;
  break_in: string | null;
  break_out: string | null;
  time_out: string | null;
} | null): StatusType {
  if (!record || !record.time_in) return 'not_started';
  if (record.time_out) return 'done';
  if (record.break_in && !record.break_out) return 'on_break';
  return 'working';
}

export function StatusBadge({ status, large = false }: StatusBadgeProps) {
  const cfg = CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }, large && styles.badgeLarge]}>
      <View style={[styles.dot, { backgroundColor: cfg.dot }, large && styles.dotLarge]} />
      <Text style={[styles.label, { color: cfg.text }, large && styles.labelLarge]}>
        {cfg.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  dotLarge: {
    width: 10,
    height: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  labelLarge: {
    fontSize: 15,
  },
});
