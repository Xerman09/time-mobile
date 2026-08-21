import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AttendanceRecord, formatTime, formatDuration } from '../hooks/useAttendance';
import { StatusBadge, deriveStatus } from './StatusBadge';

interface AttendanceRowProps {
  record: AttendanceRecord;
}

function calcWorked(record: AttendanceRecord): number {
  if (!record.time_in_ts) return 0;
  const end = record.time_out_ts ?? Math.floor(Date.now() / 1000);
  let dur = end - record.time_in_ts;
  if (record.break_in_ts) {
    const bEnd = record.break_out_ts ?? (record.time_out_ts ?? Math.floor(Date.now() / 1000));
    dur -= Math.max(0, bEnd - record.break_in_ts);
  }
  return Math.max(0, dur);
}

export function AttendanceRow({ record }: AttendanceRowProps) {
  const status = deriveStatus(record);
  const worked = calcWorked(record);

  const dateObj = new Date(record.work_date);
  const dateLabel = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.row}>
      <View style={styles.dateCol}>
        <Text style={styles.dateText}>{dateLabel}</Text>
        <StatusBadge status={status} />
      </View>
      <View style={styles.timesCol}>
        <View style={styles.timeItem}>
          <Text style={styles.timeLabel}>IN</Text>
          <Text style={styles.timeValue}>{formatTime(record.time_in)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.timeItem}>
          <Text style={styles.timeLabel}>OUT</Text>
          <Text style={styles.timeValue}>{formatTime(record.time_out)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.timeItem}>
          <Text style={styles.timeLabel}>WORKED</Text>
          <Text style={[styles.timeValue, styles.mono]}>{formatDuration(worked)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  dateCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  timesCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 3,
  },
  timeValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  mono: {
    fontVariant: ['tabular-nums'],
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#f1f5f9',
  },
});
