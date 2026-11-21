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
  const {
    history,
    histPage,
    histPages,
    histTotal,
    fetchHistory,
    isLoading,
    isLoadingMore,
  } = useAttendance();

  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Initial load
  useEffect(() => {
    fetchHistory(1, false);
    setCurrentPage(1);
  }, [fetchHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await fetchHistory(1, false);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (currentPage < histPages && !isLoadingMore && !isLoading) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchHistory(nextPage, true);
    }
  };

  const safeTopPadding =
    Math.max(
      insets.top,
      Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 0
    ) + 12;

  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={styles.footerLoading}>
          <ActivityIndicator size="small" color="#0c9488" />
          <Text style={styles.footerLoadingText}>Loading older shifts...</Text>
        </View>
      );
    }

    if (currentPage < histPages) {
      return (
        <TouchableOpacity
          style={styles.loadMoreBtn}
          onPress={handleLoadMore}
          activeOpacity={0.8}
        >
          <Feather name="arrow-down-circle" size={16} color="#0c9488" style={{ marginRight: 6 }} />
          <Text style={styles.loadMoreText}>
            Load More Shifts ({history.length} of {histTotal})
          </Text>
        </TouchableOpacity>
      );
    }

    if (history.length > 0 && history.length >= histTotal) {
      return (
        <View style={styles.endNotice}>
          <Feather name="check-circle" size={14} color="#94a3b8" style={{ marginRight: 6 }} />
          <Text style={styles.endNoticeText}>All {histTotal} recorded shifts loaded</Text>
        </View>
      );
    }

    return null;
  };

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
          <Text style={styles.statsBadgeText}>
            {histTotal > 0 ? `${history.length} of ${histTotal}` : `${histTotal}`} {histTotal === 1 ? 'Shift' : 'Shifts'}
          </Text>
        </View>
      </View>

      {isLoading && !refreshing && history.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0c9488" />
          <Text style={styles.loadingText}>Loading shift history...</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <AttendanceRow record={item} />}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Math.max(insets.bottom + 100, 120) },
          ]}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
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
          ListFooterComponent={renderFooter}
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
  footerLoading: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  footerLoadingText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  loadMoreBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ccfbf1',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }
      : { elevation: 1 }),
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f766e',
  },
  endNotice: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
  },
  endNoticeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94a3b8',
  },
});
