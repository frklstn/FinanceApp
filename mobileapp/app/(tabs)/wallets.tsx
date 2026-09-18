import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Plus, Trash2, X, Wallet as WalletIcon } from 'lucide-react-native';
import { api } from '../../src/lib/api-client';
import { COLORS, SPACING } from '../../src/constants/theme';
import { Wallet } from '../../src/types/api';

function formatRupiah(amount: number | string | undefined | null): string {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
}

const COLORS_PICKER = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

export default function WalletsScreen() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  // New wallet form state
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [type, setType] = useState('bank');
  const [selectedColor, setSelectedColor] = useState(COLORS_PICKER[0]);
  const [submitting, setSubmitting] = useState(false);

  const fetchWallets = useCallback(async () => {
    try {
      const res = await api.get<Wallet[]>('/wallets');
      if (res.success && res.data) {
        setWallets(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const handleCreateWallet = async () => {
    if (!name.trim()) {
      Alert.alert('Perhatian', 'Nama dompet wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post<Wallet>('/wallets', {
        name: name.trim(),
        balance: parseFloat(balance.replace(/[^0-9]/g, '')) || 0,
        type,
        color: selectedColor,
        icon: type === 'bank' ? 'bank' : type === 'ewallet' ? 'smartphone' : 'wallet',
      });

      if (res.success) {
        setModalVisible(false);
        setName('');
        setBalance('');
        fetchWallets();
      } else {
        Alert.alert('Gagal', res.message || 'Gagal membuat dompet');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWallet = (wallet: Wallet) => {
    Alert.alert('Hapus Dompet', `Yakin ingin menghapus ${wallet.name}?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          const res = await api.delete(`/wallets/${wallet.id}`);
          if (res.success) {
            fetchWallets();
          } else {
            Alert.alert('Gagal', res.message || 'Gagal menghapus dompet');
          }
        },
      },
    ]);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={wallets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          fetchWallets();
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <WalletIcon size={48} color={COLORS.muted} />
            <Text style={styles.emptyTitle}>Belum Ada Dompet</Text>
            <Text style={styles.emptySubtitle}>Tambahkan rekening bank, e-wallet, atau kas fisik kamu.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.walletCard, { borderLeftColor: item.color || COLORS.primary }]}>
            <View style={styles.walletInfo}>
              <View style={styles.walletHeader}>
                <Text style={styles.walletName}>{item.name}</Text>
                <View style={[styles.typeBadge, { backgroundColor: item.color ? `${item.color}20` : '#3b82f620' }]}>
                  <Text style={[styles.typeText, { color: item.color || COLORS.primary }]}>{item.type.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.walletBalance}>{formatRupiah(item.balance)}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDeleteWallet(item)} style={styles.deleteButton}>
              <Trash2 size={16} color={COLORS.muted} />
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Plus size={24} color="#000000" />
      </TouchableOpacity>

      {/* Modal Buat Dompet */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Dompet Baru</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Nama Dompet</Text>
            <TextInput
              style={styles.input}
              placeholder="Misal: BCA Utama, GoPay, Kas"
              placeholderTextColor={COLORS.muted}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.inputLabel}>Saldo Awal</Text>
            <TextInput
              style={styles.input}
              placeholder="Rp 0"
              placeholderTextColor={COLORS.muted}
              keyboardType="numeric"
              value={balance}
              onChangeText={setBalance}
            />

            <Text style={styles.inputLabel}>Tipe Dompet</Text>
            <View style={styles.typeSelector}>
              {['bank', 'ewallet', 'cash'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeOption, type === t && styles.typeOptionActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.typeOptionText, type === t && styles.typeOptionTextActive]}>
                    {t === 'bank' ? 'Bank' : t === 'ewallet' ? 'E-Wallet' : 'Tunai'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Pilih Warna</Text>
            <View style={styles.colorRow}>
              {COLORS_PICKER.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorCircle, { backgroundColor: c }, selectedColor === c && styles.colorCircleActive]}
                  onPress={() => setSelectedColor(c)}
                />
              ))}
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleCreateWallet} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={styles.submitButtonText}>Simpan Dompet</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl + 40,
  },
  walletCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletInfo: {
    flex: 1,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  walletName: {
    color: COLORS.foreground,
    fontSize: 15,
    fontWeight: '600',
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  walletBalance: {
    color: COLORS.foreground,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  deleteButton: {
    padding: SPACING.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
    gap: SPACING.sm,
  },
  emptyTitle: {
    color: COLORS.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  fab: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    color: COLORS.foreground,
    fontSize: 17,
    fontWeight: '700',
  },
  inputLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
    marginTop: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: SPACING.sm + 2,
    color: COLORS.foreground,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    fontSize: 14,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  typeOption: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  typeOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}15`,
  },
  typeOptionText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  typeOptionTextActive: {
    color: COLORS.primary,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: SPACING.sm,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorCircleActive: {
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  submitButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
});
