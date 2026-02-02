/**
 * REALTIME HOOK
 * Real-time subscriptions for live updates
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceState {
  onlineUsers: number;
  activeInSandbox: number;
  activeInTerminal: number;
}

export function useRealtime(userId?: string) {
  const [presence, setPresence] = useState<PresenceState>({
    onlineUsers: 0,
    activeInSandbox: 0,
    activeInTerminal: 0,
  });
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId) return;

    const supabase = getSupabaseClient();

    // Subscribe to presence channel
    const presenceChannel = supabase.channel('phazur-presence', {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const users = Object.keys(state).length;
        const sandbox = Object.values(state).filter(
          (s: unknown[]) => s.some((u: unknown) => (u as { view?: string }).view === 'sandbox')
        ).length;
        const terminal = Object.values(state).filter(
          (s: unknown[]) => s.some((u: unknown) => (u as { view?: string }).view === 'terminal')
        ).length;

        setPresence({
          onlineUsers: users,
          activeInSandbox: sandbox,
          activeInTerminal: terminal,
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
            view: 'chat',
          });
        }
      });

    setChannel(presenceChannel);

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [userId]);

  const updatePresence = useCallback(async (view: 'chat' | 'terminal' | 'sandbox') => {
    if (channel && userId) {
      await channel.track({
        user_id: userId,
        online_at: new Date().toISOString(),
        view,
      });
    }
  }, [channel, userId]);

  return {
    presence,
    updatePresence,
  };
}

/**
 * Hook for subscribing to database changes
 */
export function useSubscription<T>(
  table: string,
  filter?: { column: string; value: string }
) {
  const [data, setData] = useState<T[]>([]);

  useEffect(() => {
    const supabase = getSupabaseClient();

    let channelConfig = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes' as 'system',
        {
          event: '*',
          schema: 'public',
          table,
          ...(filter && { filter: `${filter.column}=eq.${filter.value}` }),
        } as Record<string, unknown>,
        (payload: { new: T; old: T; eventType: string }) => {
          if (payload.eventType === 'INSERT') {
            setData(prev => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setData(prev =>
              prev.map(item =>
                (item as Record<string, unknown>).id === (payload.new as Record<string, unknown>).id
                  ? payload.new
                  : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setData(prev =>
              prev.filter(
                item =>
                  (item as Record<string, unknown>).id !== (payload.old as Record<string, unknown>).id
              )
            );
          }
        }
      );

    channelConfig.subscribe();

    return () => {
      channelConfig.unsubscribe();
    };
  }, [table, filter?.column, filter?.value]);

  return data;
}
