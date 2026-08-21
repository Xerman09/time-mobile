import React, { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';

interface LiveClockProps {
  style?: object;
  color?: string;
}

export function LiveClock({ style, color = '#fff' }: LiveClockProps) {
  const [time, setTime] = useState(getCurrentTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getCurrentTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return <Text style={[styles.clock, { color }, style]}>{time}</Text>;
}

function getCurrentTime(): string {
  const now = new Date();
  const h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${String(hour).padStart(2, '0')}:${m}:${s} ${ampm}`;
}

const styles = StyleSheet.create({
  clock: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
});
