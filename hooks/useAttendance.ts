import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGet, apiPost } from '../lib/api';
import { ENDPOINTS } from '../constants/Config';

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

export function useAttendance() {
  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPunching, setIsPunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [histPage, setHistPage] = useState(1);
  const [histTotal, setHistTotal] = useState(0);
  const [histPages, setHistPages] = useState(1);

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
  }, [startTicker]);

  const punch = useCallback(
    async (type: PunchType): Promise<{ success: boolean; error?: string }> => {
      setIsPunching(true);
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
    [startTicker]
  );

  const fetchHistory = useCallback(async (page = 1) => {
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
  }, []);

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
  };
}

/** Format seconds → HH:MM:SS */
export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

/** Format a datetime string to "8:30 AM" */
export function formatTime(dt: string | null): string {
  if (!dt) return '—';
  const d = new Date(dt.replace(' ', 'T'));
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
