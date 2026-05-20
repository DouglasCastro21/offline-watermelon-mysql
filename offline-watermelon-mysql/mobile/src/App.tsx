import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { me } from './api/client';
import { syncDatabase } from './api/sync';
import { LoginScreen } from './features/auth/LoginScreen';
import { RecordsScreen } from './features/records/RecordsScreen';
import { clearSession, loadSession, saveSession } from './storage/sessionStorage';
import { Session } from './types/session';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    async function bootstrap() {
      const stored = await loadSession();
      if (!stored) {
        setLoading(false);
        return;
      }

      try {
        const response = await me(stored.token);
        const refreshedSession = { ...stored, user: response.user };
        await saveSession(refreshedSession);
        setSession(refreshedSession);
        syncDatabase(stored.token).catch(console.error);
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (message.includes('Token') || message.includes('Sessao')) {
          await clearSession();
        } else {
          setSession(stored);
        }
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator color="#1f7a5c" />
        <Text style={styles.loadingText}>Carregando sessao...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      {session ? (
        <RecordsScreen session={session} onLogout={() => setSession(null)} />
      ) : (
        <LoginScreen
          onLoggedIn={(nextSession) => {
            setSession(nextSession);
            syncDatabase(nextSession.token).catch(console.error);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6f7fb'
  },
  loadingText: {
    marginTop: 10,
    color: '#627086',
    fontWeight: '700'
  }
});
