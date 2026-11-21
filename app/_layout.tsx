import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, View, Image, Text, Animated, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { useAppUpdates } from '../hooks/useAppUpdates';
import { UpdateModal } from '../components/UpdateModal';

function LoadingSplash() {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.loadingContainer}>
      <StatusBar style="light" />
      <Animated.View style={[styles.logoCard, { transform: [{ scale: pulseAnim }] }]}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>
      <Text style={styles.brandTitle}>WorkShift</Text>
      <Text style={styles.brandTagline}>Workforce & Shift Attendance</Text>

      <View style={styles.loaderWrap}>
        <ActivityIndicator size="small" color="#0c9488" />
        <Text style={styles.loadingStatusText}>Starting up...</Text>
      </View>
    </View>
  );
}

function AuthGate() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const {
    updateModalVisible,
    isDownloading,
    applyUpdate,
    dismissUpdateModal,
  } = useAppUpdates();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to sign in
      router.replace('/(auth)');
    } else if (user && inAuthGroup) {
      // Already logged in, go to app
      router.replace('/(tabs)/home');
    }
  }, [user, isLoading, segments, router]);

  if (isLoading) {
    return <LoadingSplash />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <UpdateModal
        visible={updateModalVisible}
        isDownloading={isDownloading}
        onUpdate={applyUpdate}
        onDismiss={dismissUpdateModal}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoCard: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoImage: {
    width: 72,
    height: 72,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  loaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 36,
    backgroundColor: 'rgba(12, 148, 136, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(12, 148, 136, 0.25)',
  },
  loadingStatusText: {
    color: '#2dd4bf',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
