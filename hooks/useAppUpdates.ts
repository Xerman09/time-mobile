import { useEffect, useState, useCallback } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import {
  CURRENT_BUILD_NUMBER,
  UPDATE_VERSION_URL,
  UPDATE_API_URL,
  LATEST_APK_URL,
} from '../constants/Config';

export interface AppUpdateState {
  isChecking: boolean;
  isDownloading: boolean;
  isUpdateAvailable: boolean;
  updateModalVisible: boolean;
  latestBuild: number | null;
  downloadUrl: string;
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
  const [latestBuild, setLatestBuild] = useState<number | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>(LATEST_APK_URL);

  const checkForUpdates = useCallback(async (manual: boolean = false) => {
    setIsChecking(true);
    try {
      let remoteBuild: number | null = null;
      let targetDownloadUrl = LATEST_APK_URL;

      // 1. Try reading version.json directly from GitHub Release assets (native only, web lacks CORS on raw assets)
      if (Platform.OS !== 'web') {
        try {
          const vRes = await fetch(UPDATE_VERSION_URL, {
            headers: { 'Cache-Control': 'no-cache' },
          });
          if (vRes.ok) {
            const vData = await vRes.json();
            if (vData && typeof vData.buildNumber === 'number') {
              remoteBuild = vData.buildNumber;
              if (vData.downloadUrl) {
                targetDownloadUrl = vData.downloadUrl;
              }
            }
          }
        } catch {
          // Fallback to GitHub Releases API if version.json is not yet available
        }
      }

      // 2. Fallback: Query GitHub Releases Tag API
      if (remoteBuild === null) {
        try {
          const apiRes = await fetch(UPDATE_API_URL, {
            headers: {
              'User-Agent': 'WorkShiftApp',
              Accept: 'application/vnd.github.v3+json',
            },
          });
          if (apiRes.ok) {
            const apiData = await apiRes.json();
            const assets: Array<{ name: string; browser_download_url: string }> = apiData.assets || [];
            let maxBuild = 0;
            for (const asset of assets) {
              const match = asset.name.match(/build(\d+)\.apk/i);
              if (match) {
                const bNum = parseInt(match[1], 10);
                if (bNum > maxBuild) maxBuild = bNum;
              }
              if (asset.name === 'WorkShift-latest.apk') {
                targetDownloadUrl = asset.browser_download_url;
              }
            }
            if (maxBuild > 0) {
              remoteBuild = maxBuild;
            }
          }
        } catch {
          // GitHub API fallback failed
        }
      }

      if (remoteBuild !== null) {
        setLatestBuild(remoteBuild);
        setDownloadUrl(targetDownloadUrl);

        if (remoteBuild > CURRENT_BUILD_NUMBER) {
          setIsUpdateAvailable(true);
          setUpdateModalVisible(true);
        } else if (manual) {
          Alert.alert(
            'Up to Date',
            `WorkShift is already running the latest version (Build #${CURRENT_BUILD_NUMBER}).`
          );
        }
      } else if (manual) {
        Alert.alert(
          'Up to Date',
          `WorkShift is running Build #${CURRENT_BUILD_NUMBER}. You are on the newest version.`
        );
      }
    } catch {
      if (manual) {
        Alert.alert(
          'Update Check',
          'Unable to check for updates. Please verify your internet connection and try again.'
        );
      }
    } finally {
      setIsChecking(false);
    }
  }, []);

  const applyUpdate = useCallback(async () => {
    try {
      setIsDownloading(true);
      if (Platform.OS === 'web') {
        window.open(downloadUrl, '_blank');
      } else {
        const canOpen = await Linking.canOpenURL(downloadUrl);
        if (canOpen) {
          await Linking.openURL(downloadUrl);
        } else {
          await Linking.openURL(LATEST_APK_URL);
        }
      }
      setUpdateModalVisible(false);
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message ?? 'Failed to open the download link.');
    } finally {
      setIsDownloading(false);
    }
  }, [downloadUrl]);

  const dismissUpdateModal = useCallback(() => {
    setUpdateModalVisible(false);
  }, []);

  // Background check on launch
  useEffect(() => {
    const timer = setTimeout(() => {
      checkForUpdates(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [checkForUpdates]);

  return {
    isChecking,
    isDownloading,
    isUpdateAvailable,
    updateModalVisible,
    latestBuild,
    downloadUrl,
    checkForUpdates,
    applyUpdate,
    dismissUpdateModal,
    updateId: null,
    channel: 'github-releases',
    runtimeVersion: `1.0.0-b${CURRENT_BUILD_NUMBER}`,
  };
}
