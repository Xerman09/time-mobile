import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar as RNStatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useAttendance } from '../../hooks/useAttendance';
import { useAppUpdates } from '../../hooks/useAppUpdates';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiGet, apiPost } from '../../lib/api';
import { ENDPOINTS, APP_VERSION, CURRENT_BUILD_NUMBER } from '../../constants/Config';

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  superadmin: { bg: '#fdf4ff', text: '#a21caf' },
  admin:      { bg: '#eff6ff', text: '#1d4ed8' },
  employee:   { bg: '#ecfdf5', text: '#059669' },
};

interface UserProfileData {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  username?: string;
  email?: string;
  contact_number?: string;
  position?: string;
  department_name?: string;
  company_name?: string;
  business_name?: string;
  geo_address?: string;
  geo_radius?: number;
  track_location?: number;
}

export default function ProfileScreen() {
  const { user, logout, lockSession } = useAuth();
  const { status } = useAttendance();
  const { checkForUpdates, isChecking } = useAppUpdates();
  const insets = useSafeAreaInsets();

  // My Information Modal State
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Change Password Modal State
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const roleConfig = ROLE_COLORS[user?.role ?? 'employee'] ?? ROLE_COLORS.employee;

  // Fetch full employee details
  useEffect(() => {
    if (user?.id) {
      setIsLoadingProfile(true);
      apiGet<UserProfileData>(ENDPOINTS.users, { action: 'get', id: user.id })
        .then((res) => {
          if (res.success && res.data) {
            setProfileData(res.data);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoadingProfile(false));
    }
  }, [user?.id]);

  const fullName = [
    profileData?.first_name,
    profileData?.middle_name,
    profileData?.last_name,
  ]
    .filter(Boolean)
    .join(' ') || user?.username || '—';

  const companyName =
    profileData?.company_name ||
    profileData?.business_name ||
    user?.company_name ||
    user?.business_name;

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

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      Alert.alert('Error', 'Please enter your current password.');
      return;
    }
    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter your new password.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirmation do not match.');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const res = await apiPost<{ success: boolean; message?: string; error?: string }>(
        ENDPOINTS.changePass,
        {
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
          account: user?.account ?? user?.acc_no ?? '',
          username: user?.username ?? '',
        }
      );

      if (res.success) {
        Alert.alert('Success', res.message ?? 'Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordModalVisible(false);
      } else {
        Alert.alert('Error', res.error ?? 'Failed to update password.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Network error. Please try again.');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  const MenuButton = ({
    icon,
    label,
    onPress,
    danger = false,
  }: {
    icon: keyof typeof Feather.glyphMap;
    label: string;
    onPress: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity style={styles.menuBtn} onPress={onPress} activeOpacity={0.7}>
      <Feather name={icon} size={20} color={danger ? '#dc2626' : '#64748b'} style={styles.menuIcon} />
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      <Feather name="chevron-right" size={20} color="#cbd5e1" />
    </TouchableOpacity>
  );

  const safeTopPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 0
  ) + 12;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar + Name Header */}
        <View style={[styles.header, { paddingTop: safeTopPadding }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>
              {(user?.username ?? 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.username}>{fullName}</Text>
          <Text style={styles.userHandle}>@{user?.username ?? '—'}</Text>
          {Boolean(companyName) && (
            <View style={styles.companyBadge}>
              <Feather name="briefcase" size={11} color="#0f766e" style={{ marginRight: 5 }} />
              <Text style={styles.companyBadgeText}>{companyName}</Text>
            </View>
          )}
          <View style={[styles.roleBadge, { backgroundColor: roleConfig.bg }]}>
            <Text style={[styles.roleText, { color: roleConfig.text }]}>
              {(user?.role ?? 'employee').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* My Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MY INFORMATION</Text>
          <View style={styles.card}>
            <MenuButton
              icon="user"
              label="View Full Information"
              onPress={() => setInfoModalVisible(true)}
            />
            <View style={styles.divider} />
            <InfoRow label="Employee ID" value={`#${user?.id ?? '—'}`} />
            <View style={styles.divider} />
            <InfoRow label="Full Name" value={fullName} />
            {Boolean(companyName) && (
              <>
                <View style={styles.divider} />
                <InfoRow label="Company" value={companyName!} />
              </>
            )}
            <View style={styles.divider} />
            <InfoRow label="Account Code" value={String(user?.account ?? user?.acc_no ?? '—')} />
            {Boolean(profileData?.department_name) && (
              <>
                <View style={styles.divider} />
                <InfoRow label="Department" value={profileData!.department_name!} />
              </>
            )}
            {Boolean(profileData?.position) && (
              <>
                <View style={styles.divider} />
                <InfoRow label="Position" value={profileData!.position!} />
              </>
            )}
          </View>
        </View>

        {/* Settings (Change Password) */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SETTINGS</Text>
          <View style={styles.card}>
            <MenuButton
              icon="key"
              label="Change Password"
              onPress={() => setPasswordModalVisible(true)}
            />
          </View>
        </View>

        {/* Security & Session */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SECURITY & SESSION</Text>
          <View style={styles.card}>
            <MenuButton
              icon="lock"
              label="Lock Session (Quick Unlock)"
              onPress={lockSession}
            />
            <View style={styles.divider} />
            <MenuButton
              icon="log-out"
              label="Sign Out"
              onPress={handleLogout}
              danger
            />
          </View>
        </View>

        {/* In-App Updates */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>APP UPDATES</Text>
          <View style={styles.card}>
            <MenuButton
              icon="refresh-cw"
              label={isChecking ? 'Checking for updates...' : 'Check for Updates'}
              onPress={() => checkForUpdates(true)}
            />
          </View>
        </View>

        <Text style={styles.versionText}>WorkShift Mobile App · v{APP_VERSION} (Build #{CURRENT_BUILD_NUMBER})</Text>
        <Text style={styles.versionSub}>Workforce & Shift Attendance</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* My Information Modal */}
      <Modal
        visible={infoModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <View style={styles.modalIconWrap}>
                  <Feather name="user-check" size={18} color="#0c9488" />
                </View>
                <Text style={styles.modalTitle}>My Information</Text>
              </View>
              <TouchableOpacity
                onPress={() => setInfoModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.infoModalBody} showsVerticalScrollIndicator={false}>
              {/* ID Card Banner */}
              <View style={styles.idCardBanner}>
                <View style={styles.idCardHeader}>
                  <View style={styles.idAvatar}>
                    <Text style={styles.idAvatarText}>
                      {(user?.username ?? 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.idMeta}>
                    <Text style={styles.idName}>{fullName}</Text>
                    <Text style={styles.idRoleText}>{(user?.role ?? 'employee').toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.idCardFooter}>
                  <Text style={styles.idBadgeNumber}>ID: #{user?.id ?? '—'}</Text>
                  {Boolean(companyName) && (
                    <Text style={styles.idCompanyBadge}>{companyName}</Text>
                  )}
                  <Text style={styles.idAccountText}>Account: {user?.account ?? user?.acc_no ?? '—'}</Text>
                </View>
              </View>

              {/* Personal Details */}
              <Text style={styles.infoSectionHeader}>PERSONAL DETAILS</Text>
              <View style={styles.infoDetailsBox}>
                <InfoRow label="Full Name" value={fullName} />
                <View style={styles.divider} />
                <InfoRow label="Username" value={`@${user?.username ?? '—'}`} />
                <View style={styles.divider} />
                <InfoRow label="Email" value={profileData?.email || '—'} />
                <View style={styles.divider} />
                <InfoRow label="Contact Number" value={profileData?.contact_number || '—'} />
              </View>

              {/* Employment & Department */}
              <Text style={styles.infoSectionHeader}>EMPLOYMENT & ROLE</Text>
              <View style={styles.infoDetailsBox}>
                {Boolean(companyName) && (
                  <>
                    <InfoRow label="Company" value={companyName!} />
                    <View style={styles.divider} />
                  </>
                )}
                <InfoRow label="Role" value={user?.role ?? '—'} />
                <View style={styles.divider} />
                <InfoRow label="Department" value={profileData?.department_name || 'General Staff'} />
                <View style={styles.divider} />
                <InfoRow label="Position" value={profileData?.position || 'Staff'} />
                <View style={styles.divider} />
                <InfoRow label="Account Code" value={String(user?.account ?? user?.acc_no ?? '—')} />
              </View>

              {/* Workplace & Geofence Details */}
              <Text style={styles.infoSectionHeader}>WORKPLACE & SHIFT</Text>
              <View style={styles.infoDetailsBox}>
                <InfoRow
                  label="Assigned Timezone"
                  value={status?.tz_name || 'America/Chicago'}
                />
                <View style={styles.divider} />
                <InfoRow
                  label="Workplace Location"
                  value={profileData?.geo_address || status?.geo_config?.geo_address || 'Designated Workplace'}
                />
                <View style={styles.divider} />
                <InfoRow
                  label="Location Tracking"
                  value={
                    (profileData?.track_location ?? status?.track_location) === 1
                      ? 'GPS Verification Enabled'
                      : 'Exempt'
                  }
                />
              </View>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeFullBtn}
                onPress={() => setInfoModalVisible(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.closeFullText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={passwordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <View style={styles.modalIconWrap}>
                  <Feather name="key" size={18} color="#0c9488" />
                </View>
                <Text style={styles.modalTitle}>Change Password</Text>
              </View>
              <TouchableOpacity
                onPress={() => setPasswordModalVisible(false)}
                disabled={isSubmittingPassword}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              {/* Current Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CURRENT PASSWORD</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Enter current password"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showCurrent}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowCurrent(!showCurrent)}
                  >
                    <Feather name={showCurrent ? 'eye' : 'eye-off'} size={18} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* New Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NEW PASSWORD</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="At least 6 characters"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showNew}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowNew(!showNew)}
                  >
                    <Feather name={showNew ? 'eye' : 'eye-off'} size={18} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm New Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CONFIRM NEW PASSWORD</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Re-type new password"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowConfirm(!showConfirm)}
                  >
                    <Feather name={showConfirm ? 'eye' : 'eye-off'} size={18} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setPasswordModalVisible(false)}
                  disabled={isSubmittingPassword}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSubmitBtn, isSubmittingPassword && styles.modalSubmitBtnDisabled]}
                  onPress={handleChangePassword}
                  disabled={isSubmittingPassword}
                  activeOpacity={0.85}
                >
                  {isSubmittingPassword ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.modalSubmitText}>Update Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  header: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 22,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0c9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    ...(Platform.OS === 'web' ? { boxShadow: '0px 8px 16px rgba(12, 148, 136, 0.35)' } : {
      shadowColor: '#0c9488',
      shadowOpacity: 0.35,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    }),
  },
  avatarLetter: { fontSize: 32, color: '#fff', fontWeight: '800' },
  username: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 2 },
  userHandle: { fontSize: 13, color: '#64748b', fontWeight: '500', marginBottom: 8 },
  companyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccfbf1',
    marginBottom: 8,
  },
  companyBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f766e',
  },
  roleBadge: { borderRadius: 99, paddingHorizontal: 14, paddingVertical: 5 },
  roleText: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },

  section: { paddingHorizontal: 16, marginTop: 22 },
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
    ...(Platform.OS === 'web' ? { boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)' } : {
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    }),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  infoLabel: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  infoValue: { fontSize: 14, color: '#1e293b', fontWeight: '700', maxWidth: '60%', textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#f8fafc', marginHorizontal: 18 },

  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 14,
  },
  menuIcon: { width: 28, textAlign: 'center' },
  menuLabel: { flex: 1, fontSize: 15, color: '#1e293b', fontWeight: '600' },
  menuLabelDanger: { color: '#dc2626' },

  versionText: {
    textAlign: 'center',
    color: '#cbd5e1',
    fontSize: 12,
    marginTop: 32,
  },
  versionSub: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.5,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...(Platform.OS === 'web' ? { boxShadow: '0 20px 40px rgba(0,0,0,0.15)' } : {
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 10 },
      elevation: 10,
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0fdfa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalBody: {
    padding: 20,
  },
  infoModalBody: {
    padding: 20,
    paddingBottom: 24,
  },

  // ID Card Banner in Info Modal
  idCardBanner: {
    backgroundColor: '#0c9488',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  idCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  idAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idAvatarText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '800',
  },
  idMeta: {
    flex: 1,
  },
  idName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  idRoleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ccfbf1',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  idCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 12,
    paddingTop: 10,
  },
  idBadgeNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  idCompanyBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  idAccountText: {
    fontSize: 12,
    color: '#ccfbf1',
    fontWeight: '600',
  },

  infoSectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 12,
  },
  infoDetailsBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    marginBottom: 10,
  },
  closeFullBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 16,
  },
  closeFullText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },

  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
  },
  eyeBtn: {
    padding: 6,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  modalSubmitBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#0c9488',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 130,
  },
  modalSubmitBtnDisabled: {
    opacity: 0.6,
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
