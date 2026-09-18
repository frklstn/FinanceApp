import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../src/lib/api-client';
import { storage } from '../../src/lib/storage';
import { AuthResponseData } from '../../src/types/api';
import { COLORS, SPACING } from '../../src/constants/theme';
import { LogIn } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      setErrorMsg('Harap masukkan email/username dan password');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.post<AuthResponseData>(
        '/auth/login',
        { identifier: identifier.trim(), password },
        { skipAuth: true }
      );

      if (res.success && res.data) {
        await storage.setAuthToken(res.data.token);
        await storage.setUserData(res.data.user);
        router.replace('/(tabs)');
      } else {
        const msg = res.message || 'Login gagal. Periksa kembali kredensial Anda.';
        setErrorMsg(msg);
        if (Platform.OS !== 'web') {
          Alert.alert('Gagal Masuk', msg);
        }
      }
    } catch (err: any) {
      const msg = err?.message || 'Terjadi kesalahan koneksi';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brandTitle}>🪙 FinanceApp</Text>
          <Text style={styles.brandSubtitle}>Personal Finance & Debt Survival</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Masuk ke Akun</Text>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email atau Username</Text>
            <TextInput
              style={styles.input}
              placeholder="user@example.com"
              placeholderTextColor={COLORS.muted}
              autoCapitalize="none"
              value={identifier}
              onChangeText={setIdentifier}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={COLORS.muted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.primaryForeground} />
            ) : (
              <View style={styles.btnContent}>
                <LogIn size={18} color={COLORS.primaryForeground} style={styles.btnIcon} />
                <Text style={styles.buttonText}>Masuk</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.foreground,
  },
  brandSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.destructive,
    fontSize: 13,
    marginBottom: SPACING.sm,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderColor: COLORS.inputBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.foreground,
    fontSize: 15,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: COLORS.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
});
