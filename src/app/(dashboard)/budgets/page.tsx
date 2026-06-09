'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import { budgetService, Budget } from '@/lib/services/budget.service';
import { categoryService, Category } from '@/lib/services/category.service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/toast';
import { Plus, PiggyBank, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function BudgetsPage() {
  const { accountId } = useApp();
  const { toast } = useToast();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchBudgets = useCallback(async () => {
    if (!accountId) return;
    try {
      setLoading(true);
      const [bList, cList] = await Promise.all([
        budgetService.getBudgets(accountId),
        categoryService.getCategories(accountId),
      ]);
      setBudgets(bList);
      setCategories(cList.filter((c) => c.type === 'expense'));
    } catch (err: any) {
      toast(err.message || 'Error fetching budgeting tools.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [accountId, toast]);

  useEffect(() => {
    if (accountId) {
      Promise.resolve().then(fetchBudgets);
    }
  }, [accountId, fetchBudgets]);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !categoryId || !limitAmount) return;

    const amountNum = Number(limitAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast('Please enter a valid spending ceiling.', 'danger');
      return;
    }

    setSubmitting(true);
    try {
      await budgetService.createBudget(accountId, categoryId, amountNum);
      toast('Budget limit set successfully!', 'success');
      setIsModalOpen(false);
      setCategoryId('');
      setLimitAmount('');
      fetchBudgets();
    } catch (err: any) {
      toast(err.message || 'Failed to save budget target.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Are you sure you want to remove this category budget limits?')) return;
    try {
      await budgetService.deleteBudget(id);
      toast('Budget cap removed.', 'success');
      fetchBudgets();
    } catch (err: any) {
      toast(err.message || 'Failed to delete budget.', 'danger');
    }
  };

  const getBudgetVariant = (pct: number) => {
    if (pct >= 100) return 'danger';
    if (pct >= 80) return 'warning';
    return 'success';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 pb-24">
      {/* Header Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary">
            Monthly Category Budgets
          </h2>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Establish spending caps for specific expense categories to secure your net margin
          </p>
        </div>
        <Button className="flex items-center gap-2 cursor-pointer" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Setup Budget Cap
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-40 rounded-2xl border border-light-border dark:border-dark-border shimmer" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-light-border/40 dark:bg-dark-border/40 flex items-center justify-center mb-4 text-light-text-secondary">
            <PiggyBank className="w-6.5 h-6.5" />
          </div>
          <h4 className="text-base font-bold text-light-text-primary dark:text-dark-text-primary mb-1">No Budgets Formulated</h4>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary max-w-sm mb-4">
            Select standard categories (like Food, Rent, Entertainment) and configure custom limits to monitor monthly thresholds.
          </p>
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Set Budget Cap
          </Button>
        </div>
      ) : (
        /* Budgets Grid Display */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((b) => {
            const spentNum = Number(b.spent);
            const limitNum = Number(b.amount);
            const percentage = limitNum > 0 ? (spentNum / limitNum) * 100 : 0;
            const isOver = spentNum > limitNum;
            const remaining = limitNum - spentNum;

            return (
              <Card key={b.id} className="p-5 flex flex-col justify-between hover:shadow-lg transition-all duration-200">
                <div className="space-y-4">
                  {/* Category Title & Colors */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: b.categories?.color }} />
                      <h4 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary">
                        {b.categories?.name}
                      </h4>
                    </div>
                    <button
                      onClick={() => handleDeleteBudget(b.id)}
                      className="p-1.5 rounded-lg hover:bg-danger/10 text-light-text-secondary hover:text-danger cursor-pointer transition-all duration-150"
                      title="Remove cap"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Visual limit numbers */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-end text-xs font-semibold">
                      <span className="text-light-text-secondary dark:text-dark-text-secondary">Spent compared to budget</span>
                      <span className="text-light-text-primary dark:text-dark-text-primary font-bold">
                        ${spentNum.toFixed(0)} / ${limitNum.toFixed(0)}
                      </span>
                    </div>
                    <Progress value={percentage} variant={getBudgetVariant(percentage)} />
                  </div>
                </div>

                {/* Subtext info */}
                <div className="flex items-center gap-1.5 mt-6 pt-3 border-t border-light-border/40 dark:border-dark-border/40 text-xs font-semibold">
                  {isOver ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-danger shrink-0" />
                      <span className="text-danger">Over budget by ${Math.abs(remaining).toFixed(2)}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                      <span className="text-light-text-secondary dark:text-dark-text-secondary">
                        ${remaining.toFixed(2)} remaining inside safe threshold
                      </span>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Set budget Limit modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Configure Budget Cap">
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <Select
            label="Target Expense Category"
            options={[
              { value: '', label: '-- Choose --' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            disabled={submitting}
          />
          <Input
            label="Monthly Limit ($)"
            placeholder="500.00"
            type="number"
            step="1"
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value)}
            required
            disabled={submitting}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Apply Budget Cap
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
