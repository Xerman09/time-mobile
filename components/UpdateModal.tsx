import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface UpdateModalProps {
  visible: boolean;
  isDownloading: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

export function UpdateModal({
  visible,
  isDownloading,
  onUpdate,
  onDismiss,
}: UpdateModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Feather name="download-cloud" size={28} color="#0c9488" />
          </View>

          <Text style={styles.title}>New Update Available</Text>
          <Text style={styles.message}>
            A new version of WorkShift has been published. Update now to apply the latest improvements and features.
          </Text>

          <View style={styles.actions}>
            {!isDownloading && (
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={onDismiss}
                activeOpacity={0.7}
              >
                <Text style={styles.btnSecondaryText}>Later</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.btnPrimary, isDownloading && styles.btnDisabled]}
              onPress={onUpdate}
              disabled={isDownloading}
              activeOpacity={0.85}
            >
              {isDownloading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.btnPrimaryText}>Updating...</Text>
                </View>
              ) : (
                <View style={styles.btnRow}>
                  <Text style={styles.btnPrimaryText}>Update & Restart</Text>
                  <Feather name="refresh-cw" size={15} color="#ffffff" style={{ marginLeft: 6 }} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    maxWidth: 380,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...(Platform.OS === 'web' ? { boxShadow: '0px 20px 40px rgba(0, 0, 0, 0.15)' } : {
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 10,
    }),
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btnSecondary: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  btnPrimary: {
    flex: 1.5,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#0c9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});

