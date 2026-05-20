import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { login } from '../../api/client';
import { saveSession } from '../../storage/sessionStorage';
import { Session } from '../../types/session';

type Props = {
  onLoggedIn: (session: Session) => void;
};

export function LoginScreen({ onLoggedIn }: Props) {
  const [loginValue, setLoginValue] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!loginValue.trim() || !senha.trim()) {
      Alert.alert('Campos obrigatorios', 'Informe usuario e senha.');
      return;
    }

    setLoading(true);
    try {
      const session = await login(loginValue.trim(), senha);
      await saveSession(session);
      onLoggedIn(session);
    } catch (error) {
      Alert.alert('Login nao realizado', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Lancamentos</Text>
        <Text style={styles.subtitle}>Entre para sincronizar os dados da sua empresa.</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Usuario</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setLoginValue}
          placeholder="ana@empresa-norte.com"
          style={styles.input}
          value={loginValue}
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          onChangeText={setSenha}
          placeholder="senha123"
          secureTextEntry
          style={styles.input}
          value={senha}
        />

        <Pressable disabled={loading} onPress={handleLogin} style={styles.button}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f6f7fb'
  },
  header: {
    marginBottom: 32
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#18202f'
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#627086'
  },
  form: {
    gap: 12
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#293241'
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#cbd3df',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: '#fff'
  },
  button: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#1f7a5c',
    marginTop: 12
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800'
  }
});
