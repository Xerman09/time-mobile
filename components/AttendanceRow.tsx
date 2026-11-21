import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AttendanceRecord, formatTime, formatDuration } from '../hooks/useAttendance';
import { StatusBadge, deriveStatus } from './StatusBadge';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

function calcBreakDuration(record: AttendanceRecord): number {
  if (!record.break_in_ts) return 0;
  const bEnd = record.break_out_ts ?? (record.time_out_ts ?? Math.floor(Date.now() / 1000));
  return Math.max(0, bEnd - record.break_in_ts);
}

export function AttendanceRow({ record }: AttendanceRowProps) {
  const [expanded, setExpanded] = useState(false);
  const status = deriveStatus(record);
  const worked = calcWorked(record);
  const breakDur = calcBreakDuration(record);

  const dateObj = new Date(record.work_date);
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNum = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const hasExtraDetails = Boolean(record.break_in || record.time_in_address);

  return (
    <TouchableOpacity
      style={[styles.card, expanded && styles.cardExpanded]}
      onPress={toggleExpand}
      activeOpacity={0.85}
    >
      {/* Top Header: Date, Day & Status */}
      <View style={styles.topHeader}>
        <View style={styles.dateBlock}>
          <View style={styles.calendarPill}>
            <Text style={styles.dayNameText}>{dayName.toUpperCase()}</Text>
          </View>
          <Text style={styles.dateLabel}>{dayNum}</Text>
        </View>

        <View style={styles.badgeWrap}>
          <StatusBadge status={status} />
          {hasExtraDetails && (
            <Feather
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#94a3b8"
              style={{ marginLeft: 6 }}
            />
          )}
        </View>
      </View>

      {/* Primary Metrics: In, Out, Total Worked */}
      <View style={styles.metricsContainer}>
        {/* Clock In */}
        <View style={styles.metricBox}>
          <View style={styles.metricIconRow}>
            <View style={[styles.iconDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.metricLabel}>CLOCK IN</Text>
          </View>
          <Text style={styles.metricValue}>
            {record.time_in_ts ? formatTime(record.time_in_ts) : '—'}
          </Text>
        </View>

        {/* Clock Out */}
        <View style={styles.metricBox}>
          <View style={styles.metricIconRow}>
            <View style={[styles.iconDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.metricLabel}>CLOCK OUT</Text>
          </View>
          <Text style={styles.metricValue}>
            {record.time_out_ts ? formatTime(record.time_out_ts) : '—'}
          </Text>
        </View>

        {/* Net Hours Worked */}
        <View style={[styles.metricBox, styles.workedHighlight]}>
          <View style={styles.metricIconRow}>
            <Feather name="clock" size={11} color="#0c9488" style={{ marginRight: 3 }} />
            <Text style={[styles.metricLabel, { color: '#0c9488' }]}>NET HOURS</Text>
          </View>
          <Text style={[styles.metricValue, styles.workedText]}>
            {formatDuration(worked)}
          </Text>
        </View>
      </View>

      {/* Expanded Breakdown */}
      {expanded && (
        <View style={styles.expandedSection}>
          <View style={styles.divider} />

          {/* Break Details */}
          {Boolean(record.break_in) && (
            <View style={styles.detailRow}>
              <View style={styles.detailTitleGroup}>
                <Feather name="coffee" size={13} color="#64748b" />
                <Text style={styles.detailLabel}>Break Duration</Text>
              </View>
              <Text style={styles.detailValue}>
                {formatTime(record.break_in_ts)} - {record.break_out_ts ? formatTime(record.break_out_ts) : 'Ongoing'} ({formatDuration(breakDur)})
              </Text>
            </View>
          )}

          {/* Location / Geotag Details */}
          {Boolean(record.time_in_address) && (
            <View style={styles.detailRow}>
              <View style={styles.detailTitleGroup}>
                <Feather name="map-pin" size={13} color="#0c9488" />
                <Text style={styles.detailLabel}>Verified Location</Text>
              </View>
              <Text style={styles.locationText} numberOfLines={2}>
                {record.time_in_address}
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }
      : {
          shadowColor: '#0f172a',
          shadowOpacity: 0.04,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }),
  },
  cardExpanded: {
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  dateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dayNameText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  dateLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
  },
  metricIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  workedHighlight: {
    backgroundColor: '#f0fdfa',
    borderRadius: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  workedText: {
    color: '#0f766e',
    fontWeight: '800',
  },
  expandedSection: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  locationText: {
    fontSize: 11,
    color: '#0f766e',
    fontWeight: '500',
    maxWidth: '55%',
    textAlign: 'right',
  },
});
