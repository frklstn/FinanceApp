'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Key, Copy, Check, Trash2, Plus, AlertCircle, ShieldAlert } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import {
  getApiKeysAction,
  createApiKeyAction,
  revokeApiKeyAction,
  ApiKeyItem,
  CreatedApiKeyResult,
} from '@/app/actions/api-keys';

export function ApiKeyManager() {
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyName, setKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<CreatedApiKeyResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      const list = await getApiKeysAction();
      setKeys(list);
    } catch {
      toast('Gagal memuat daftar API Key.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) {
      toast('Nama aplikasi/kunci wajib diisi.', 'warning');
      return;
    }

    setCreating(true);
    try {
      const res = await createApiKeyAction(keyName);
      setNewlyCreatedKey(res);
      setKeyName('');
      toast('API Key berhasil dibuat!', 'success');
      loadKeys();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Gagal membuat API key', 'danger');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyKey = () => {
    if (!newlyCreatedKey?.key) return;
    navigator.clipboard.writeText(newlyCreatedKey.key);
    setCopied(true);
    toast('API Key disalin ke clipboard!', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleRevoke = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin mencabut API Key "${name}"? Aplikasi pihak ketiga tidak akan bisa mengakses lagi.`)) {
      return;
    }

    try {
      const ok = await revokeApiKeyAction(id);
      if (ok) {
        toast('API Key berhasil dicabut.', 'info');
        loadKeys();
      }
    } catch {
      toast('Gagal mencabut API Key.', 'danger');
    }
  };

  return (
    <Card className="p-6 border-line bg-surface space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <Key className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">API Keys & Integrasi Pihak Ketiga</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gunakan API Key untuk menghubungkan Bot Telegram, OpenClaw, atau Script automasi ke akunmu.
          </p>
        </div>
      </div>

      {/* Modal / Alert Key Baru yang Baru Dibuat */}
      {newlyCreatedKey && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-500">
              <ShieldAlert className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Simpan API Key Sekarang!</span>
            </div>
            <button
              onClick={() => setNewlyCreatedKey(null)}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Tutup
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            Kunci ini <strong>hanya ditampilkan sekali</strong> demi keamanan. Masukkan kunci ini ke header{' '}
            <code className="bg-background px-1.5 py-0.5 rounded text-primary">X-API-Key</code> aplikasi lu.
          </p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={newlyCreatedKey.key}
              className="flex-1 font-mono text-xs bg-background border border-line rounded-lg px-3 py-2 text-foreground select-all"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyKey}
              className="flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Form Buat Key Baru */}
      <form onSubmit={handleCreateKey} className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 w-full space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Nama Kunci / Aplikasi</label>
          <Input
            type="text"
            placeholder="Misal: Telegram Bot, Otomasi Cron, Script Python"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            disabled={creating}
            className="w-full text-xs"
          />
        </div>
        <Button
          type="submit"
          disabled={creating}
          className="flex items-center gap-2 shrink-0 cursor-pointer w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{creating ? 'Membuat...' : 'Buat API Key'}</span>
        </Button>
      </form>

      {/* List Active API Keys */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Kunci Aktif ({keys.length})
        </h4>

        {loading ? (
          <p className="text-xs text-muted-foreground">Memuat kunci...</p>
        ) : keys.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-line text-center">
            <p className="text-xs text-muted-foreground">Belum ada API Key aktif.</p>
          </div>
        ) : (
          <div className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-background">
            {keys.map((k) => (
              <div key={k.id} className="p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground truncate">{k.name}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface border border-line text-muted-foreground">
                      {k.key_prefix}...
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Dibuat: {new Date(k.created_at).toLocaleDateString('id-ID')} •{' '}
                    {k.last_used_at
                      ? `Terakhir dipakai: ${new Date(k.last_used_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
                      : 'Belum pernah dipakai'}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevoke(k.id, k.name)}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2 h-auto cursor-pointer"
                  title="Cabut API Key"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
