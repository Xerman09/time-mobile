import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Animated,
  ActivityIndicator,
  useWindowDimensions,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useAttendance, formatDuration, formatTime, PunchType } from '../../hooks/useAttendance';
import { useAuth } from '../../hooks/useAuth';
import { LiveClock } from '../../components/LiveClock';
import { deriveStatus } from '../../components/StatusBadge';

interface PunchButtonConfig {
  type: PunchType;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  available: boolean;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const {
    status,
    workedSec,
    isLoading,
    isPunching,
    error,
    punch,
    fetchStatus,
  } = useAttendance();

  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [refreshing, setRefreshing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const record = status?.record ?? null;
  const attendStatus = deriveStatus(record);

  // Pulse animation for "working" state
  useEffect(() => {
    if (attendStatus === 'working') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [attendStatus, pulseAnim]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStatus();
    setRefreshing(false);
  };

  const handlePunch = async (type: PunchType) => {
    const labels: Record<PunchType, string> = {
      time_in: 'Time In',
      break_in: 'Break In',
      break_out: 'Break Out',
      time_out: 'Time Out',
    };

    Alert.alert(
      'Confirm',
      `Are you sure you want to ${labels[type]}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            const result = await punch(type);
            if (!result.success) {
              Alert.alert('Error', result.error ?? 'Punch failed.');
            }
          },
        },
      ]
    );
  };

  const getPunchButtons = (): PunchButtonConfig[] => {
    return [
      {
        type: 'time_in',
        label: 'Time In',
        icon: 'log-in',
        color: '#89c8a3', // Greenish
        available: !record?.time_in,
      },
      {
        type: 'break_in',
        label: 'Break In',
        icon: 'coffee',
        color: '#f5af24', // Yellowish orange
        available: !!(record?.time_in && !record.time_out && !record.break_in),
      },
      {
        type: 'break_out',
        label: 'Break Out',
        icon: 'user-check',
        color: '#918fc3', // Purple/Blue
        available: !!(record?.break_in && !record.break_out && !record.time_out),
      },
      {
        type: 'time_out',
        label: 'Time Out',
        icon: 'log-out',
        color: '#f05b62', // Red/Pink
        available: !!(record?.time_in && !record.time_out),
      },
    ];
  };

  const todayDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const getStatusText = () => {
    switch (attendStatus) {
      case 'on_break': return 'You are currently on break.';
      case 'working': return 'You are currently working.';
      case 'done': return 'Your shift is complete.';
      default: return 'You have not timed in yet.';
    }
  };

  return (
    <View style={styles.pageContainer}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
        contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
      >
        <View style={styles.mainWrapper}>
          
          {/* Header Row */}
          <View style={[styles.headerRow, isDesktop && styles.headerRowDesktop]}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconBox}>
                <Feather name="clock" size={20} color="#fff" />
              </View>
              <Text style={styles.headerTitle}>Shift Attendance</Text>
            </View>
            <View style={styles.datePill}>
              <Feather name="calendar" size={14} color="#6b7280" />
              <Text style={styles.datePillText}>
                Today ({status?.tz_name ?? 'Local'}): {todayDate}
              </Text>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          ) : null}

          {/* Two Column Layout */}
          <View style={[styles.contentGrid, isDesktop && styles.contentGridDesktop]}>
            
            {/* Left Column */}
            <View style={styles.column}>
              
              {/* Worked Time Card */}
              <View style={styles.workedCard}>
                <View style={styles.workedCardHeader}>
                  <Text style={styles.workedCardTitle}>WORKED TIME (LIVE)</Text>
                  {attendStatus === 'working' && <View style={styles.liveDot} />}
                </View>
                <Animated.View style={{ transform: [{ scale: attendStatus === 'working' ? pulseAnim : 1 }] }}>
                  <Text style={styles.workedTimeText}>{formatDuration(workedSec)}</Text>
                </Animated.View>
                <View style={styles.statusInfoRow}>
                  <Feather name="info" size={14} color="#9ca3af" />
                  <Text style={styles.statusInfoText}>{getStatusText()}</Text>
                </View>
              </View>

              {/* Today's Timestamps */}
              <View style={styles.timestampsCard}>
                <Text style={styles.timestampsTitle}>TODAY'S TIMESTAMPS</Text>
                <View style={styles.pillsGrid}>
                  {[
                    { label: 'TIME IN', value: formatTime(record?.time_in ?? null) },
                    { label: 'BREAK IN', value: formatTime(record?.break_in ?? null) },
                    { label: 'BREAK OUT', value: formatTime(record?.break_out ?? null) },
                    { label: 'TIME OUT', value: formatTime(record?.time_out ?? null) },
                  ].map((item, idx) => (
                    <View key={idx} style={styles.timestampPill}>
                      <Text style={styles.pillLabel}>{item.label}</Text>
                      <Text style={styles.pillValue}>{item.value || '—'}</Text>
                    </View>
                  ))}
                </View>
              </View>

            </View>

            {/* Right Column */}
            <View style={styles.column}>
              <View style={styles.actionsCard}>
                <Text style={styles.actionsTitle}>QUICK ACTIONS</Text>
                <View style={styles.actionButtonsGrid}>
                  {getPunchButtons().map((btn) => (
                    <TouchableOpacity
                      key={btn.type}
                      style={[
                        styles.actionBtn, 
                        { backgroundColor: btn.color },
                        !btn.available && styles.actionBtnDisabled
                      ]}
                      onPress={() => btn.available && handlePunch(btn.type)}
                      disabled={!btn.available || isPunching}
                      activeOpacity={0.8}
                    >
                      {isPunching ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Feather name={btn.icon} size={28} color="#fff" style={{ marginBottom: 12 }} />
                          <Text style={styles.actionBtnText}>{btn.label}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Smart Actions Alert */}
                <View style={styles.smartActionsAlert}>
                  <Feather name="zap" size={16} color="#d97706" style={{ marginTop: 2 }} />
                  <Text style={styles.smartActionsText}>
                    <Text style={{ fontWeight: '700', color: '#b45309' }}>Smart Actions: </Text>
                    Buttons will automatically enable/disable based on your current state.
                  </Text>
                </View>
              </View>
            </View>

          </View>
        </View>
      </ScrollView>

      {isLoading && !refreshing ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  scrollContentDesktop: {
    padding: 32,
    alignItems: 'center',
  },
  mainWrapper: {
    width: '100%',
    maxWidth: 1000,
  },
  
  headerRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    // Web shadow
    ...(Platform.OS === 'web' ? { boxShadow: '0px 4px 20px rgba(0,0,0,0.03)' } : { elevation: 2 }),
  },
  headerRowDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#a2a5e4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 99,
  },
  datePillText: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '500',
    marginLeft: 8,
  },

  contentGrid: {
    flexDirection: 'column',
    gap: 24,
  },
  contentGridDesktop: {
    flexDirection: 'row',
  },
  column: {
    flex: 1,
    gap: 24,
  },

  workedCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    ...(Platform.OS === 'web' ? { boxShadow: '0px 4px 15px rgba(0,0,0,0.02)' } : {}),
  },
  workedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  workedCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366f1',
    letterSpacing: 1,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  workedTimeText: {
    fontSize: 54,
    fontWeight: '800',
    color: '#1e293b',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
    marginBottom: 16,
  },
  statusInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },

  timestampsCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 24,
  },
  timestampsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 16,
  },
  pillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timestampPill: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  pillLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
  },
  pillValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },

  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    ...(Platform.OS === 'web' ? { boxShadow: '0px 4px 15px rgba(0,0,0,0.02)' } : {}),
  },
  actionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 16,
  },
  actionButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    minWidth: '45%',
    height: 120,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { boxShadow: '0px 8px 20px rgba(0,0,0,0.1)' } : { elevation: 4 }),
  },
  actionBtnDisabled: {
    opacity: 0.4,
    ...(Platform.OS === 'web' ? { boxShadow: 'none' } : { elevation: 0 }),
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  smartActionsAlert: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
    gap: 12,
  },
  smartActionsText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    lineHeight: 20,
  },

  errorBanner: {
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: { color: '#dc2626', fontWeight: '500' },

  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
