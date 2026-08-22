import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGet, apiPost } from '../lib/api';
import { ENDPOINTS } from '../constants/Config';
import { useNetInfo } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AttendanceRecord {
  id: number;
  branch_id: number;
  user_id: string;
  work_date: string;
  time_in: string | null;
  break_in: string | null;
  break_out: string | null;
  time_out: string | null;
  time_in_ts: number | null;
  break_in_ts: number | null;
  break_out_ts: number | null;
  time_out_ts: number | null;
}

export interface AttendanceStatus {
  tz_name: string;
  tz_offset: number;
  server_time: number;
  today: string;
  record: AttendanceRecord | null;
  worked_sec: number;
}

export type PunchType = 'time_in' | 'break_in' | 'break_out' | 'time_out';

interface PendingPunch {
  type: PunchType;
  timestamp: number;
}

export function useAttendance() {
  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPunching, setIsPunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [histPage, setHistPage] = useState(1);
  const [histTotal, setHistTotal] = useState(0);
  const [histPages, setHistPages] = useState(1);
  
  // Offline Sync State
  const netInfo = useNetInfo();
  const isOffline = netInfo.isConnected === false;
  const [isSyncing, setIsSyncing] = useState(false);

  // Live worked-seconds ticker
  const [workedSec, setWorkedSec] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTicker = useCallback((initialSec: number, record: AttendanceRecord | null) => {
    if (tickRef.current) clearInterval(tickRef.current);
    setWorkedSec(initialSec);

    // Only tick if currently working (timed in, not out, and not on break with no break_out)
    const isWorking =
      record &&
      record.time_in &&
      !record.time_out &&
      !(record.break_in && !record.break_out);

    if (!isWorking) return;

    tickRef.current = setInterval(() => {
      setWorkedSec((s) => s + 1);
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const fetchStatus = useCallback(async () => {
    if (isOffline) {
      setIsLoading(false);
      return; // Can't fetch fresh status if offline
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiGet<AttendanceStatus>(ENDPOINTS.shift, { action: 'status' });
      if (res.success && res.data) {
        setStatus(res.data);
        startTicker(res.data.worked_sec, res.data.record);
      } else {
        setError(res.error ?? 'Failed to fetch status.');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Network error.');
    } finally {
      setIsLoading(false);
    }
  }, [startTicker, isOffline]);

  const syncOfflinePunches = useCallback(async () => {
    if (isOffline || isSyncing) return;
    try {
      const queueStr = await AsyncStorage.getItem('OFFLINE_PUNCHES');
      if (!queueStr) return;
      const queue: PendingPunch[] = JSON.parse(queueStr);
      if (queue.length === 0) return;

      setIsSyncing(true);
      for (const p of queue) {
        // Send punch with historical timestamp
        await apiPost(`${ENDPOINTS.shift}?action=punch&type=${p.type}`, { timestamp: p.timestamp });
      }
      // Clear queue after successful sync
      await AsyncStorage.setItem('OFFLINE_PUNCHES', '[]');
      // Refresh status from server
      await fetchStatus();
    } catch (e) {
      console.warn('Sync failed, will retry later:', e);
    } finally {
      setIsSyncing(false);
    }
  }, [isOffline, isSyncing, fetchStatus]);

  // Trigger sync when coming back online
  useEffect(() => {
    if (netInfo.isConnected && !isOffline) {
      syncOfflinePunches();
    }
  }, [netInfo.isConnected, isOffline, syncOfflinePunches]);

  const punch = useCallback(
    async (type: PunchType): Promise<{ success: boolean; error?: string }> => {
      setIsPunching(true);
      
      // OFFLINE HANDLING
      if (isOffline) {
        try {
          const ts = Math.floor(Date.now() / 1000);
          const pending: PendingPunch = { type, timestamp: ts };
          
          const queueStr = await AsyncStorage.getItem('OFFLINE_PUNCHES');
          const queue = queueStr ? JSON.parse(queueStr) : [];
          queue.push(pending);
          await AsyncStorage.setItem('OFFLINE_PUNCHES', JSON.stringify(queue));
          
          // Optimistic local update
          setStatus(prev => {
            if (!prev) return prev;
            const newRecord = { ...(prev.record || {} as AttendanceRecord) };
            if (type === 'time_in') newRecord.time_in_ts = ts;
            if (type === 'break_in') newRecord.break_in_ts = ts;
            if (type === 'break_out') newRecord.break_out_ts = ts;
            if (type === 'time_out') newRecord.time_out_ts = ts;
            
            // Dummy string dates just to pass truthy checks
            if (type === 'time_in') newRecord.time_in = new Date(ts*1000).toISOString();
            if (type === 'break_in') newRecord.break_in = new Date(ts*1000).toISOString();
            if (type === 'break_out') newRecord.break_out = new Date(ts*1000).toISOString();
            if (type === 'time_out') newRecord.time_out = new Date(ts*1000).toISOString();

            startTicker(prev.worked_sec, newRecord);
            return { ...prev, record: newRecord };
          });
          
          setIsPunching(false);
          return { success: true };
        } catch (e) {
          setIsPunching(false);
          return { success: false, error: 'Failed to save offline punch.' };
        }
      }

      // ONLINE HANDLING
      try {
        const res = await apiPost<AttendanceStatus>(
          `${ENDPOINTS.shift}?action=punch&type=${type}`,
          {}
        );
        if (res.success && res.data) {
          setStatus(res.data);
          startTicker(res.data.worked_sec, res.data.record);
          return { success: true };
        }
        return { success: false, error: res.error ?? 'Punch failed.' };
      } catch (e: unknown) {
        return { success: false, error: e instanceof Error ? e.message : 'Network error.' };
      } finally {
        setIsPunching(false);
      }
    },
    [startTicker, isOffline]
  );

  const fetchHistory = useCallback(async (page = 1) => {
    if (isOffline) return;
    try {
      const res = await apiGet<{
        items: AttendanceRecord[];
        page: number;
        pages: number;
        total: number;
      }>(ENDPOINTS.shift, { action: 'history', page, limit: 14 });

      if (res.success && res.data) {
        setHistory(res.data.items);
        setHistPage(res.data.page);
        setHistPages(res.data.pages);
        setHistTotal(res.data.total);
      }
    } catch {
      // Silently fail history fetch
    }
  }, [isOffline]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    status,
    workedSec,
    isLoading,
    isPunching,
    error,
    punch,
    fetchStatus,
    history,
    histPage,
    histPages,
    histTotal,
    fetchHistory,
    isOffline,
    isSyncing,
  };
}

/** Format seconds → HH:MM:SS */
export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

/** Format a UNIX timestamp (seconds) to a time string with timezone support */
export function formatTime(ts: number | null, timeZone?: string): string {
  if (!ts) return '—';
  const d = new Date(ts * 1000);
  try {
    return d.toLocaleTimeString('en-US', { timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}
