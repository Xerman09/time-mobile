import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { apiGet, apiPost } from '../../lib/api';
import { ENDPOINTS } from '../../constants/Config';
import { useAuth } from '../../hooks/useAuth';

type LeaveStatus = 'pending' | 'approved' | 'rejected';

interface LeaveRequest {
  id: number;
  leave_type: string;
  date_from: string;
  date_to: string;
  reason: string;
  status: LeaveStatus;
  created_at: string;
  approver_name?: string;
}

const STATUS_COLORS: Record<LeaveStatus, { bg: string; text: string }> = {
  pending:  { bg: '#fffbeb', text: '#d97706' },
  approved: { bg: '#ecfdf5', text: '#059669' },
  rejected: { bg: '#fef2f2', text: '#dc2626' },
};

const LEAVE_TYPES = [
  'Sick Leave',
  'Vacation Leave',
  'Emergency Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Other',
];

export default function LeaveScreen() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [leaveType, setLeaveType] = useState(LEAVE_TYPES[0]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = useCallback(async () => {
    try {
      const res = await apiGet<{ items: LeaveRequest[] }>(ENDPOINTS.leaveApi, { action: 'my_list' });
      if (res.success && res.data) {
        setLeaves(res.data.items ?? []);
      } else {
        // Silently handle — backend may not have mobile leave API yet
        setLeaves([]);
      }
    } catch {
      setLeaves([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeaves();
    setRefreshing(false);
  };

  const submitLeave = async () => {
    if (!dateFrom || !dateTo || !reason.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    const res = await apiPost(ENDPOINTS.leaveApi, {
      action: 'create',
      leave_type: leaveType,
      date_from: dateFrom,
      date_to: dateTo,
      reason: reason.trim(),
    });
    setSubmitting(false);

    if (res.success) {
      setShowModal(false);
      setDateFrom('');
      setDateTo('');
      setReason('');
      setLeaveType(LEAVE_TYPES[0]);
      await fetchLeaves();
      Alert.alert('Success', 'Leave request submitted successfully!');
    } else {
      Alert.alert('Error', res.error ?? 'Failed to submit leave request.');
    }
  };

  const renderLeave = ({ item }: { item: LeaveRequest }) => {
    const cfg = STATUS_COLORS[item.status] ?? STATUS_COLORS.pending;
    return (
      <View style={styles.leaveCard}>
        <View style={styles.leaveTop}>
          <Text style={styles.leaveType}>{item.leave_type}</Text>
          <View style={[styles.leaveBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.leaveBadgeText, { color: cfg.text }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.leaveDates}>
          <Feather name="calendar" size={13} color="#64748b" /> {item.date_from} → {item.date_to}
        </Text>
        <Text style={styles.leaveReason}>{item.reason}</Text>
        {item.approver_name ? (
          <Text style={styles.leaveApprover}>Approver: {item.approver_name}</Text>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Leave Requests</Text>
          <Text style={styles.subtitle}>{leaves.length} requests</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={leaves}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderLeave}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="umbrella" size={52} color="#cbd5e1" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>No leave requests yet.</Text>
              <Text style={styles.emptySub}>Tap "+ New" to file a request.</Text>
            </View>
          }
        />
      )}

      {/* New Leave Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Leave Request</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Leave Type */}
            <Text style={styles.fieldLabel}>Leave Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
              {LEAVE_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, leaveType === t && styles.typeChipActive]}
                  onPress={() => setLeaveType(t)}
                >
                  <Text style={[styles.typeChipText, leaveType === t && styles.typeChipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Date From (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.fieldInput}
              value={dateFrom}
              onChangeText={setDateFrom}
              placeholder="e.g. 2026-09-01"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>Date To (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.fieldInput}
              value={dateTo}
              onChangeText={setDateTo}
              placeholder="e.g. 2026-09-03"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>Reason</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldTextarea]}
              value={reason}
              onChangeText={setReason}
              placeholder="Describe your reason..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={submitLeave}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Request</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  addBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    ...(Platform.OS === 'web' ? { boxShadow: '0px 4px 8px rgba(79, 70, 229, 0.3)' } : {
      shadowColor: '#4f46e5',
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    }),
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  list: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  leaveCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...(Platform.OS === 'web' ? { boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)' } : {
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    }),
  },
  leaveTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  leaveType: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  leaveBadge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  leaveBadgeText: { fontSize: 11, fontWeight: '700' },
  leaveDates: { fontSize: 13, color: '#64748b', marginBottom: 6 },
  leaveReason: { fontSize: 14, color: '#374151' },
  leaveApprover: { fontSize: 12, color: '#94a3b8', marginTop: 8 },

  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { marginBottom: 12 },
  emptyText: { fontSize: 17, fontWeight: '700', color: '#64748b' },
  emptySub: { fontSize: 13, color: '#94a3b8', marginTop: 4 },

  modal: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 28,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  modalClose: { fontSize: 20, color: '#94a3b8', fontWeight: '700' },
  modalBody: { flex: 1, padding: 20 },

  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8, marginTop: 16 },
  fieldInput: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: '#1e293b',
  },
  fieldTextarea: { height: 100, textAlignVertical: 'top' },

  typeRow: { marginBottom: 4 },
  typeChip: {
    backgroundColor: '#f1f5f9',
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  typeChipActive: { backgroundColor: '#ede9fe', borderColor: '#6366f1' },
  typeChipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  typeChipTextActive: { color: '#4f46e5' },

  submitBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 16,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    ...(Platform.OS === 'web' ? { boxShadow: '0px 6px 12px rgba(79, 70, 229, 0.35)' } : {
      shadowColor: '#4f46e5',
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    }),
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
