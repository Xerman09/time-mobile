import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useAttendance } from '../../hooks/useAttendance';
import { AttendanceRow } from '../../components/AttendanceRow';

export default function HistoryScreen() {
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

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Attendance History</Text>
        <Text style={styles.subtitle}>{histTotal} records</Text>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <AttendanceRow record={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="clipboard" size={48} color="#cbd5e1" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>No attendance records found.</Text>
            </View>
          }
          ListFooterComponent={
            histPages > 1 ? (
              <View style={styles.pagination}>
                <TouchableOpacity
                  style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                  onPress={() => goTo(page - 1)}
                  disabled={page <= 1}
                >
                  <Text style={styles.pageBtnText}>← Prev</Text>
                </TouchableOpacity>
                <Text style={styles.pageInfo}>
                  {page} / {histPages}
                </Text>
                <TouchableOpacity
                  style={[styles.pageBtn, page >= histPages && styles.pageBtnDisabled]}
                  onPress={() => goTo(page + 1)}
                  disabled={page >= histPages}
                >
                  <Text style={styles.pageBtnText}>Next →</Text>
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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 2 },

  list: { padding: 16, paddingBottom: 40 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#94a3b8', fontWeight: '500' },

  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 16,
  },
  pageBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  pageBtnDisabled: { backgroundColor: '#e2e8f0' },
  pageBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  pageInfo: { fontSize: 14, color: '#64748b', fontWeight: '600' },
});
