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
  Platform,
  Modal,
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

  // Custom Modal State
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    type: 'confirm' | 'error';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ visible: false, type: 'confirm', title: '', message: '' });

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

  const handlePunch = (type: PunchType) => {
    const labels: Record<PunchType, string> = {
      time_in: 'Time In',
      break_in: 'Break In',
      break_out: 'Break Out',
      time_out: 'Time Out',
    };

    setModalConfig({
      visible: true,
      type: 'confirm',
      title: 'Confirm Punch',
      message: `Are you sure you want to ${labels[type]}?`,
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, visible: false }));
        const res = await punch(type);
        if (!res.success) {
          // Slight delay to allow fade out of previous modal before showing error
          setTimeout(() => {
            setModalConfig({
              visible: true,
              type: 'error',
              title: 'Error',
              message: res.error ?? 'Punch failed.',
            });
          }, 300);
        }
      }
    });
  };

  const getPunchButtons = (): PunchButtonConfig[] => {
    return [
      {
        type: 'time_in',
        label: 'Time In',
        icon: 'log-in',
        color: '#10b981', // Solid Emerald Green
        available: !record || !record.time_in,
      },
      {
        type: 'break_in',
        label: 'Break In',
        icon: 'coffee',
        color: '#f59e0b', // Solid Amber
        available: !!(record?.time_in && !record.time_out && !record.break_in),
      },
      {
        type: 'break_out',
        label: 'Break Out',
        icon: 'user-check',
        color: '#8b5cf6', // Solid Violet
        available: !!(record?.break_in && !record.break_out && !record.time_out),
      },
      {
        type: 'time_out',
        label: 'Time Out',
        icon: 'log-out',
        color: '#ef4444', // Solid Red
        available: !!(record?.time_in && !record.time_out),
      },
    ];
  };

  const todayDate = new Date().toLocaleDateString('en-US', {
    timeZone: status?.tz_name,
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

  const renderWorkedTime = () => (
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
  );

  const renderTimestamps = () => (
    <View style={styles.timestampsCard}>
      <Text style={styles.timestampsTitle}>TODAY'S TIMESTAMPS</Text>
      <View style={styles.pillsGrid}>
          {[
            { label: 'TIME IN', value: formatTime(record?.time_in_ts ?? null, status?.tz_name) },
            { label: 'BREAK IN', value: formatTime(record?.break_in_ts ?? null, status?.tz_name) },
            { label: 'BREAK OUT', value: formatTime(record?.break_out_ts ?? null, status?.tz_name) },
            { label: 'TIME OUT', value: formatTime(record?.time_out_ts ?? null, status?.tz_name) },
          ].map((item, idx) => (
          <View key={idx} style={styles.timestampPill}>
            <Text style={styles.pillLabel}>{item.label}</Text>
            <Text style={styles.pillValue}>{item.value || '—'}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderActions = () => (
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
    </View>
  );

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

          {/* Dynamic Column Layout */}
          <View style={[styles.contentGrid, isDesktop && styles.contentGridDesktop]}>
            {isDesktop ? (
              <>
                <View style={styles.column}>
                  {renderWorkedTime()}
                  {renderTimestamps()}
                </View>
                <View style={styles.column}>
                  {renderActions()}
                </View>
              </>
            ) : (
              <View style={styles.column}>
                {renderWorkedTime()}
                {renderActions()}
                {renderTimestamps()}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {isLoading && !refreshing ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : null}

      {/* Custom Modal */}
      <Modal visible={modalConfig.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Feather name={modalConfig.type === 'error' ? 'alert-circle' : 'help-circle'} size={24} color={modalConfig.type === 'error' ? '#ef4444' : '#6366f1'} />
              <Text style={styles.modalTitle}>{modalConfig.title}</Text>
            </View>
            <Text style={styles.modalMessage}>{modalConfig.message}</Text>
            <View style={styles.modalActions}>
              {modalConfig.type === 'confirm' && (
                <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setModalConfig(prev => ({ ...prev, visible: false }))}>
                  <Text style={styles.modalBtnCancelText}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.modalBtnConfirm, modalConfig.type === 'error' && { backgroundColor: '#ef4444' }]} 
                onPress={() => {
                  if (modalConfig.type === 'confirm' && modalConfig.onConfirm) {
                    modalConfig.onConfirm();
                  } else {
                    setModalConfig(prev => ({ ...prev, visible: false }));
                  }
                }}
              >
                <Text style={styles.modalBtnConfirmText}>{modalConfig.type === 'confirm' ? 'Yes, Confirm' : 'OK'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    ...(Platform.OS === 'web' ? { boxShadow: '0px 10px 40px rgba(0,0,0,0.2)' } : { elevation: 10 }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  modalMessage: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 32,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalBtnCancel: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  modalBtnCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  modalBtnConfirm: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#6366f1',
  },
  modalBtnConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
