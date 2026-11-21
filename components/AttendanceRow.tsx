import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AttendanceRecord, formatDuration } from '../hooks/useAttendance';
import { StatusBadge, deriveStatus } from './StatusBadge';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AttendanceRowProps {
  record: AttendanceRecord;
}

function resolveTs(ts: number | null | undefined, dateStr: string | null | undefined): number | null {
  if (typeof ts === 'number' && ts > 0) return ts;
  if (!dateStr || dateStr.trim() === '') return null;
  const parsed = Date.parse(dateStr.replace(' ', 'T'));
  return !isNaN(parsed) ? Math.floor(parsed / 1000) : null;
}

function formatCleanTime(ts: number | null): string {
  if (!ts) return '—';
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatExactTime(ts: number | null): string {
  if (!ts) return '—';
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

function calcWorked(record: AttendanceRecord): number {
  const inTs = resolveTs(record.time_in_ts, record.time_in);
  if (!inTs) return 0;
  const outTs = resolveTs(record.time_out_ts, record.time_out);

  // If not timed out and it's a past date, do not compute runaway hours
  if (!outTs) {
    const isToday = record.work_date === new Date().toISOString().slice(0, 10);
    if (!isToday) return 0;
  }

  const end = outTs ?? Math.floor(Date.now() / 1000);
  let dur = end - inTs;

  const bInTs = resolveTs(record.break_in_ts, record.break_in);
  if (bInTs) {
    const bOutTs = resolveTs(record.break_out_ts, record.break_out);
    const bEnd = bOutTs ?? (outTs ?? Math.floor(Date.now() / 1000));
    dur -= Math.max(0, bEnd - bInTs);
  }
  return Math.max(0, dur);
}

function calcBreakDuration(record: AttendanceRecord): number {
  const bInTs = resolveTs(record.break_in_ts, record.break_in);
  if (!bInTs) return 0;
  const outTs = resolveTs(record.time_out_ts, record.time_out);
  const bOutTs = resolveTs(record.break_out_ts, record.break_out);
  const bEnd = bOutTs ?? (outTs ?? Math.floor(Date.now() / 1000));
  return Math.max(0, bEnd - bInTs);
}

export function AttendanceRow({ record }: AttendanceRowProps) {
  const [expanded, setExpanded] = useState(false);
  const status = deriveStatus(record);
  const worked = calcWorked(record);
  const breakDur = calcBreakDuration(record);

  const timeInTs = resolveTs(record.time_in_ts, record.time_in);
  const breakInTs = resolveTs(record.break_in_ts, record.break_in);
  const breakOutTs = resolveTs(record.break_out_ts, record.break_out);
  const timeOutTs = resolveTs(record.time_out_ts, record.time_out);

  const dateObj = new Date(record.work_date);
  const dayName = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-US', { weekday: 'short' }) : '—';
  const dayNum = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : record.work_date;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const hasExtraDetails = Boolean(record.time_in_address || (breakInTs && breakOutTs));

  return (
    <TouchableOpacity
      style={[styles.card, expanded && styles.cardExpanded]}
      onPress={toggleExpand}
      activeOpacity={0.85}
    >
      {/* 1. Header: Date on left, Status + Worked on right */}
      <View style={styles.topHeader}>
        <View style={styles.dateBlock}>
          <View style={styles.calendarPill}>
            <Text style={styles.dayNameText}>{dayName.toUpperCase()}</Text>
          </View>
          <Text style={styles.dateLabel}>{dayNum}</Text>
        </View>

        <View style={styles.headerRightGroup}>
          {worked > 0 && (
            <View style={styles.hoursBadge}>
              <Feather name="clock" size={11} color="#0f766e" style={{ marginRight: 4 }} />
              <Text style={styles.hoursText}>{formatDuration(worked)}</Text>
            </View>
          )}
          <StatusBadge status={status} />
          <Feather
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#94a3b8"
            style={{ marginLeft: 4 }}
          />
        </View>
      </View>

      {/* 2. Main Timestamps Section: Spacious 2-Column Layout */}
      <View style={styles.punchesRow}>
        {/* Time In */}
        <View style={styles.punchColumn}>
          <View style={styles.punchLabelRow}>
            <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.punchLabel}>TIME IN</Text>
          </View>
          <Text style={[styles.punchValue, !timeInTs && styles.mutedText]}>
            {formatCleanTime(timeInTs)}
          </Text>
        </View>

        {/* Vertical divider */}
        <View style={styles.verticalDivider} />

        {/* Time Out */}
        <View style={styles.punchColumn}>
          <View style={styles.punchLabelRow}>
            <View style={[styles.statusDot, { backgroundColor: '#f43f5e' }]} />
            <Text style={styles.punchLabel}>TIME OUT</Text>
          </View>
          <Text style={[styles.punchValue, !timeOutTs && styles.mutedText]}>
            {timeOutTs ? formatCleanTime(timeOutTs) : (timeInTs ? 'In Progress' : '—')}
          </Text>
        </View>
      </View>

      {/* 3. Break Pill (Clean & only shown when a break is recorded) */}
      {Boolean(breakInTs) && (
        <View style={styles.breakPill}>
          <Feather name="coffee" size={12} color="#b45309" style={{ marginRight: 6 }} />
          <Text style={styles.breakText}>
            Break: <Text style={styles.breakBold}>{formatCleanTime(breakInTs)}</Text>
            {breakOutTs ? (
              <> → <Text style={styles.breakBold}>{formatCleanTime(breakOutTs)}</Text></>
            ) : (
              ' (Ongoing)'
            )}
            {breakDur > 0 ? ` • ${formatDuration(breakDur)}` : ''}
          </Text>
        </View>
      )}

      {/* 4. Expanded Breakdown (Verified Address, exact seconds, shift details) */}
      {expanded && (
        <View style={styles.expandedSection}>
          <View style={styles.horizontalDivider} />

          {/* Exact Timestamps Table */}
          <View style={styles.exactTable}>
            <Text style={styles.exactTableTitle}>EXACT TIMESTAMPS</Text>
            <View style={styles.exactGrid}>
              <View style={styles.exactItem}>
                <Text style={styles.exactLabel}>Time In:</Text>
                <Text style={styles.exactValue}>{formatExactTime(timeInTs)}</Text>
              </View>
              <View style={styles.exactItem}>
                <Text style={styles.exactLabel}>Time Out:</Text>
                <Text style={styles.exactValue}>{formatExactTime(timeOutTs)}</Text>
              </View>
              {Boolean(breakInTs) && (
                <View style={styles.exactItem}>
                  <Text style={styles.exactLabel}>Break In:</Text>
                  <Text style={styles.exactValue}>{formatExactTime(breakInTs)}</Text>
                </View>
              )}
              {Boolean(breakOutTs) && (
                <View style={styles.exactItem}>
                  <Text style={styles.exactLabel}>Break Out:</Text>
                  <Text style={styles.exactValue}>{formatExactTime(breakOutTs)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Location Details */}
          {Boolean(record.time_in_address) && (
            <View style={styles.detailRow}>
              <View style={styles.detailTitleGroup}>
                <Feather name="map-pin" size={12} color="#0c9488" />
                <Text style={styles.detailLabel}>Location</Text>
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
      ? { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }
      : {
          shadowColor: '#0f172a',
          shadowOpacity: 0.04,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }),
  },
  cardExpanded: {
    borderColor: '#0c9488',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hoursBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  hoursText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f766e',
  },
  punchesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  punchColumn: {
    flex: 1,
  },
  punchLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  punchLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  punchValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  mutedText: {
    color: '#94a3b8',
    fontWeight: '500',
  },
  verticalDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
  },
  breakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  breakText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
  },
  breakBold: {
    fontWeight: '700',
    color: '#78350f',
  },
  expandedSection: {
    marginTop: 12,
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 10,
  },
  exactTable: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  exactTableTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  exactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exactItem: {
    width: '48%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  exactLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  exactValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1e293b',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  locationText: {
    fontSize: 11,
    color: '#0f766e',
    fontWeight: '500',
    maxWidth: '65%',
    textAlign: 'right',
  },
});
