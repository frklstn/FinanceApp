'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, LayoutList } from 'lucide-react';
import type { LoanTracker } from '@/lib/debt-planner/types';
import { ActiveDebtCard } from './ActiveDebtCard';

interface ActiveDebtListProps {
  loans: LoanTracker[];
  onAdd: () => void;
  onMarkPaid: (id: string, name: string) => void;
  onDelete: (id: string, name: string) => void;
}

export function ActiveDebtList({ loans, onAdd, onMarkPaid, onDelete }: ActiveDebtListProps) {
  if (loans.length === 0) {
    return (
      <div className="pinjol-empty">
        <div className="pinjol-empty-icon">
          <LayoutList className="w-7 h-7" />
        </div>
        <h4 className="pinjol-empty-title">Daftar masih kosong</h4>
        <p className="pinjol-empty-desc">Belum ada pinjaman yang dicatat.</p>
        <Button size="sm" onClick={onAdd}>
          <Plus className="w-4 h-4 mr-1.5" /> Tambah Pinjaman
        </Button>
      </div>
    );
  }

  return (
    <div className="pinjol-debt-grid">
      {loans.map((loan) => (
        <ActiveDebtCard
          key={loan.id}
          loan={loan}
          onMarkPaid={onMarkPaid}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
