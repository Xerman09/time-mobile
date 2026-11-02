import { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Updates from 'expo-updates';

export interface AppUpdateState {
  isChecking: boolean;
  isDownloading: boolean;
  isUpdateAvailable: boolean;
  updateModalVisible: boolean;
  checkForUpdates: (manual?: boolean) => Promise<void>;
  applyUpdate: () => Promise<void>;
  dismissUpdateModal: () => void;
  updateId: string | null;
  channel: string | null;
  runtimeVersion: string | null;
}

export function useAppUpdates(): AppUpdateState {
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);

  const checkForUpdates = useCallback(async (manual: boolean = false) => {
    // Updates are only enabled in standalone builds (EAS release builds)
    if (__DEV__ || !Updates.isEnabled) {
      if (manual) {
        Alert.alert(
          'Development Environment',
          'Over-The-Air (OTA) updates are active in standalone release builds. Changes in development are automatically streamed via the Metro bundler.'
        );
      }
      return;
    }

    try {
      setIsChecking(true);
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        setIsUpdateAvailable(true);
        setUpdateModalVisible(true);
      } else if (manual) {
        Alert.alert('Up to Date', 'WorkShift is already running the latest version.');
      }
    } catch (err: any) {
      if (manual) {
        Alert.alert('Check Failed', err?.message ?? 'Could not check for updates.');
      }
    } finally {
      setIsChecking(false);
    }
  }, []);

  const applyUpdate = useCallback(async () => {
    try {
      setIsDownloading(true);
      const result = await Updates.fetchUpdateAsync();
      if (result.isNew) {
        await Updates.reloadAsync();
      } else {
        setUpdateModalVisible(false);
        Alert.alert('Up to Date', 'You are already running the newest bundle.');
      }
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message ?? 'Failed to download and apply the update.');
    } finally {
      setIsDownloading(false);
    }
  }, []);

  const dismissUpdateModal = useCallback(() => {
    setUpdateModalVisible(false);
  }, []);

  // Automatically check for updates on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      checkForUpdates(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [checkForUpdates]);

  return {
    isChecking,
    isDownloading,
    isUpdateAvailable,
    updateModalVisible,
    checkForUpdates,
    applyUpdate,
    dismissUpdateModal,
    updateId: Updates.updateId,
    channel: Updates.channel,
    runtimeVersion: Updates.runtimeVersion,
  };
}
