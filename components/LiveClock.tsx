import React, { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';

interface LiveClockProps {
  style?: object;
  color?: string;
  timeZone?: string;
}

export function LiveClock({ style, color = '#fff', timeZone }: LiveClockProps) {
  const [time, setTime] = useState(getCurrentTime(timeZone));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getCurrentTime(timeZone));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeZone]);

  return <Text style={[styles.clock, { color }, style]}>{time}</Text>;
}

function getCurrentTime(timeZone?: string): string {
  const now = new Date();
  if (timeZone) {
    try {
      return now.toLocaleTimeString('en-US', { timeZone, hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch(e) {}
  }
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
