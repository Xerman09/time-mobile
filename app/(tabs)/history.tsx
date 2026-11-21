import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAttendance } from '../../hooks/useAttendance';
import { AttendanceRow } from '../../components/AttendanceRow';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { history, histPage, histPages, histTotal, fetchHistory, isLoading } = useAttendance();
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchHistory(page);
  }, [page, fetchHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory(1);
    setPage(1);
    setRefreshing(false);
  };

  const goTo = (p: number) => {
    if (p < 1 || p > histPages) return;
    setPage(p);
  };

  const safeTopPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 0
  ) + 12;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: safeTopPadding }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Attendance History</Text>
          <Text style={styles.subtitle}>Review your recorded shifts and work hours</Text>
        </View>
        <View style={styles.statsBadge}>
          <Feather name="layers" size={13} color="#0c9488" style={{ marginRight: 4 }} />
          <Text style={styles.statsBadgeText}>{histTotal} {histTotal === 1 ? 'Shift' : 'Shifts'}</Text>
        </View>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0c9488" />
          <Text style={styles.loadingText}>Loading shift history...</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <AttendanceRow record={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0c9488"
              colors={['#0c9488']}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Feather name="calendar" size={32} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>No Shifts Recorded</Text>
              <Text style={styles.emptySubtitle}>Your completed attendance punches will appear here.</Text>
              <TouchableOpacity style={styles.emptyRefreshBtn} onPress={onRefresh} activeOpacity={0.8}>
                <Feather name="refresh-cw" size={14} color="#0c9488" style={{ marginRight: 6 }} />
                <Text style={styles.emptyRefreshText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={
            histPages > 1 ? (
              <View style={styles.pagination}>
                <TouchableOpacity
                  style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                  onPress={() => goTo(page - 1)}
                  disabled={page <= 1}
                  activeOpacity={0.7}
                >
                  <Feather name="chevron-left" size={16} color={page <= 1 ? '#cbd5e1' : '#0f172a'} />
                  <Text style={[styles.pageBtnText, page <= 1 && styles.pageBtnTextDisabled]}>Previous</Text>
                </TouchableOpacity>

                <View style={styles.pagePill}>
                  <Text style={styles.pagePillText}>
                    Page <Text style={styles.pagePillActive}>{page}</Text> of {histPages}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.pageBtn, page >= histPages && styles.pageBtnDisabled]}
                  onPress={() => goTo(page + 1)}
                  disabled={page >= histPages}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pageBtnText, page >= histPages && styles.pageBtnTextDisabled]}>Next</Text>
                  <Feather name="chevron-right" size={16} color={page >= histPages ? '#cbd5e1' : '#0f172a'} />
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  statsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  statsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f766e',
  },
  list: {
    padding: 16,
    paddingBottom: 36,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: 240,
  },
  emptyRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  emptyRefreshText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f766e',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  pageBtnDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#f1f5f9',
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  pageBtnTextDisabled: {
    color: '#cbd5e1',
  },
  pagePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pagePillText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  pagePillActive: {
    fontWeight: '700',
    color: '#0f172a',
  },
});
