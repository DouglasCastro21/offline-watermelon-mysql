import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { syncDatabase } from '../api/sync';

export function useNetworkSync(token?: string) {
  const [online, setOnline] = useState(false);
  const [syncing, setSyncing] = useState(false);

  async function syncNow() {
    if (!token) {
      return;
    }

    setSyncing(true);
    try {
      await syncDatabase(token);
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = Boolean(state.isConnected && state.isInternetReachable !== false);
      setOnline(connected);

      if (connected) {
        syncNow().catch(console.error);
      }
    });

    return unsubscribe;
  }, [token]);

  return { online, syncing, syncNow };
}
