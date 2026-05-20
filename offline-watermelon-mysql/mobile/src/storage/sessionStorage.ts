import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '../types/session';

const SESSION_KEY = '@offline_watermelon/session';

export async function saveSession(session: Session) {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function loadSession(): Promise<Session | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as Session) : null;
}

export async function clearSession() {
  await AsyncStorage.removeItem(SESSION_KEY);
}
