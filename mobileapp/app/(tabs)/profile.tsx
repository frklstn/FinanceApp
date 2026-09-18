import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut, Server, ShieldCheck, Mail } from 'lucide-react-native';
import { storage } from '../../src/lib/storage';
import { api } from '../../src/lib/api-client';
import { COLORS, SPACING } from '../../src/constants/theme';
import { Profile } from '../../src/types/api';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const cached = await storage.getUserProfile();
      if (cached) setProfile(cached);

      const res = await api.get<Profile>('/auth/me');
      if (res.success && res.data) {
        setProfile(res.data);
        await storage.saveUserProfile(res.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleLogout = () => {
    Alert.alert('Konfirmasi Keluar', 'Yakin ingin keluar dari akun ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await storage.clearAuth();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {profile?.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'}
          </Text>
        </View>

        <Text style={styles.userName}>{profile?.full_name || 'Pengguna'}</Text>
        <Text style={styles.userEmail}>{profile?.email}</Text>

        <View style={styles.planBadge}>
          <ShieldCheck size={14} color={COLORS.primary} />
          <Text style={styles.planText}>{profile?.plan?.toUpperCase() || 'PRO PLAN'}</Text>
        </View>
      </View>

      {/* Connection info */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Server size={18} color={COLORS.primary} />
            <Text style={styles.infoLabel}>Backend API Engine</Text>
          </View>
          <Text style={styles.infoValue}>Rust Axum (Port 3006)</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Mail size={18} color={COLORS.muted} />
            <Text style={styles.infoLabel}>Mata Uang Default</Text>
          </View>
          <Text style={styles.infoValue}>{profile?.currency || 'IDR'}</Text>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={18} color={COLORS.destructive} />
        <Text style={styles.logoutText}>Keluar dari Aplikasi</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  avatarText: {
    color: '#000000',
    fontSize: 24,
    fontWeight: '800',
  },
  userName: {
    color: COLORS.foreground,
    fontSize: 18,
    fontWeight: '700',
  },
  userEmail: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 2,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: SPACING.md,
  },
  planText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  infoLabel: {
    color: COLORS.muted,
    fontSize: 13,
  },
  infoValue: {
    color: COLORS.foreground,
    fontSize: 13,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: '#ef444415',
    paddingVertical: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef444430',
  },
  logoutText: {
    color: COLORS.destructive,
    fontSize: 14,
    fontWeight: '600',
  },
});
