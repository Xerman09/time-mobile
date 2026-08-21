import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../hooks/useAuth';
import { BASE_URL } from '../../constants/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  superadmin: { bg: '#fdf4ff', text: '#a21caf' },
  admin:      { bg: '#eff6ff', text: '#1d4ed8' },
  employee:   { bg: '#ecfdf5', text: '#059669' },
};

const STORAGE_KEY_URL = 'shift_base_url';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState(BASE_URL);
  const [savingUrl, setSavingUrl] = useState(false);

  const roleConfig = ROLE_COLORS[user?.role ?? 'employee'] ?? ROLE_COLORS.employee;

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const saveServerUrl = async () => {
    const trimmed = urlInput.trim().replace(/\/$/, '');
    if (!trimmed.startsWith('http')) {
      Alert.alert('Invalid URL', 'URL must start with http:// or https://');
      return;
    }
    setSavingUrl(true);
    await AsyncStorage.setItem(STORAGE_KEY_URL, trimmed);
    setSavingUrl(false);
    setShowUrlModal(false);
    Alert.alert('Saved', 'Server URL updated. Restart the app to apply changes.');
  };

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  const MenuButton = ({
    emoji,
    label,
    onPress,
    danger = false,
  }: {
    emoji: string;
    label: string;
    onPress: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity style={styles.menuBtn} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.menuEmoji}>{emoji}</Text>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar + Name Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>
              {(user?.username ?? 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.username}>{user?.username ?? '—'}</Text>
          <View style={[styles.roleBadge, { backgroundColor: roleConfig.bg }]}>
            <Text style={[styles.roleText, { color: roleConfig.text }]}>
              {(user?.role ?? 'employee').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Account Info Card */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT DETAILS</Text>
          <View style={styles.card}>
            <InfoRow label="Username" value={user?.username ?? '—'} />
            <View style={styles.divider} />
            <InfoRow label="Account Code" value={String(user?.account ?? '—')} />
            <View style={styles.divider} />
            <InfoRow label="Role" value={user?.role ?? '—'} />
            <View style={styles.divider} />
            <InfoRow label="Status" value={user?.status ?? '—'} />
            <View style={styles.divider} />
            <InfoRow label="Branch ID" value={String(user?.acc_no ?? '—')} />
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SETTINGS</Text>
          <View style={styles.card}>
            <MenuButton
              emoji="🌐"
              label="Server URL"
              onPress={() => setShowUrlModal(true)}
            />
            <View style={styles.divider} />
            <MenuButton
              emoji="🔴"
              label="Sign Out"
              onPress={handleLogout}
              danger
            />
          </View>
        </View>

        <Text style={styles.versionText}>SHIFT Mobile App · v1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Server URL Modal */}
      <Modal visible={showUrlModal} animationType="slide" presentationStyle="formSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowUrlModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Server URL</Text>
            <TouchableOpacity onPress={saveServerUrl} disabled={savingUrl}>
              {savingUrl ? (
                <ActivityIndicator size="small" color="#4f46e5" />
              ) : (
                <Text style={styles.modalSave}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.urlHint}>
              Change this if you need to connect to a different server.{'\n'}
              Android emulator: http://10.0.2.2/time{'\n'}
              Real device: http://192.168.x.x/time
            </Text>
            <TextInput
              style={styles.urlInput}
              value={urlInput}
              onChangeText={setUrlInput}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholder="http://10.0.2.2/time"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  header: {
    alignItems: 'center',
    paddingTop: 70,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#4f46e5',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  avatarLetter: { fontSize: 32, color: '#fff', fontWeight: '800' },
  username: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  roleBadge: { borderRadius: 99, paddingHorizontal: 14, paddingVertical: 5 },
  roleText: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },

  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  infoLabel: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  infoValue: { fontSize: 14, color: '#1e293b', fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#f8fafc', marginHorizontal: 18 },

  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 14,
  },
  menuEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  menuLabel: { flex: 1, fontSize: 15, color: '#1e293b', fontWeight: '600' },
  menuLabelDanger: { color: '#dc2626' },
  menuArrow: { fontSize: 20, color: '#cbd5e1' },

  versionText: {
    textAlign: 'center',
    color: '#cbd5e1',
    fontSize: 12,
    marginTop: 32,
  },

  modal: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  modalCancel: { color: '#94a3b8', fontSize: 16 },
  modalSave: { color: '#4f46e5', fontSize: 16, fontWeight: '700' },
  modalBody: { padding: 20 },
  urlHint: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  urlInput: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: '#1e293b',
  },
});
