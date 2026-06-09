'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import { savingsService, SavingsGoal } from '@/lib/services/savings.service';
import { walletService, Wallet } from '@/lib/services/wallet.service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/toast';
import { Target, Plus, PiggyBank, Trash2, Calendar, Coins, ShieldCheck } from 'lucide-react';

export default function SavingsPage() {
  const { accountId } = useApp();
  const { toast } = useToast();

  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  // Creation Goal Form Modal states
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [targetAmt, setTargetAmt] = useState('');
  const [currentAmt, setCurrentAmt] = useState('0');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Contribution Modal states
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [contribWalletId, setContribWalletId] = useState('');
  const [contribAmount, setContribAmount] = useState('');
  const [contribNote, setContribNote] = useState('');

  const fetchData = useCallback(async () => {
    if (!accountId) return;
    try {
      setLoading(true);
      const [gList, wList] = await Promise.all([
        savingsService.getSavingsGoals(accountId),
        walletService.getWallets(accountId),
      ]);
      setGoals(gList);
      setWallets(wList);
    } catch (err: any) {
      toast(err.message || 'Error compiling savings modules.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [accountId, toast]);

  useEffect(() => {
    if (accountId) {
      Promise.resolve().then(fetchData);
    }
  }, [accountId, fetchData]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !goalName || !targetAmt) return;

    const targetNum = Number(targetAmt);
    const currentNum = Number(currentAmt);

    if (isNaN(targetNum) || targetNum <= 0) {
      toast('Please enter a valid positive target.', 'danger');
      return;
    }

    setSubmitting(true);
    try {
      await savingsService.createSavingsGoal(
        accountId,
        goalName,
        targetNum,
        currentNum,
        deadline || null
      );
      toast('Savings target initialized!', 'success');
      setIsGoalModalOpen(false);
      setGoalName('');
      setTargetAmt('');
      setCurrentAmt('0');
      setDeadline('');
      fetchData();
    } catch (err: any) {
      toast(err.message || 'Failed to establish goal.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenContribution = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setContribWalletId('');
    setContribAmount('');
    setContribNote(`Goal fund: ${goal.name}`);
    setIsContributionModalOpen(true);
  };

  const handleContributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !selectedGoal || !contribWalletId || !contribAmount) return;

    const amtNum = Number(contribAmount);
    if (isNaN(amtNum) || amtNum <= 0) {
      toast('Please specify a positive funding amount.', 'danger');
      return;
    }

    setSubmitting(true);
    try {
      await savingsService.addContribution(
        accountId,
        selectedGoal.id,
        amtNum,
        contribWalletId,
        contribNote
      );

      toast(`Successfully deposited $${amtNum} to "${selectedGoal.name}"!`, 'success');
      setIsContributionModalOpen(false);
      setSelectedGoal(null);
      fetchData();
    } catch (err: any) {
      toast(err.message || 'Contribution failed.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this savings target?')) return;
    try {
      await savingsService.deleteSavingsGoal(id);
      toast('Goal removed.', 'success');
      fetchData();
    } catch (err: any) {
      toast(err.message || 'Failed to remove target.', 'danger');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 pb-24">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary flex items-center gap-2">
            <Target className="w-5.5 h-5.5 text-primary" />
            Wealth Savings Goals
          </h2>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Accumulate funds for specific milestones, investments, and purchases
          </p>
        </div>
        <Button className="flex items-center gap-2 cursor-pointer" onClick={() => setIsGoalModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Savings Goal
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 rounded-2xl border border-light-border dark:border-dark-border shimmer" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-light-border/40 dark:bg-dark-border/40 flex items-center justify-center mb-4 text-light-text-secondary">
            <PiggyBank className="w-6.5 h-6.5" />
          </div>
          <h4 className="text-base font-bold text-light-text-primary dark:text-dark-text-primary mb-1">No Goals Active</h4>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary max-w-sm mb-4">
            Initialize targets (like emergency buffers, real-estate, down-payments) and transfer small balances dynamically.
          </p>
          <Button size="sm" onClick={() => setIsGoalModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Set Savings Goal
          </Button>
        </div>
      ) : (
        /* Goals list Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const currentNum = Number(goal.current_amount);
            const targetNum = Number(goal.target_amount);
            const percentage = targetNum > 0 ? (currentNum / targetNum) * 100 : 0;
            const isFinished = currentNum >= targetNum;

            return (
              <Card key={goal.id} className="p-5 flex flex-col justify-between hover:shadow-lg transition-all duration-200">
                <div className="space-y-4">
                  {/* Title & Delete */}
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary">
                      {goal.name}
                    </h4>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-1.5 rounded-lg hover:bg-danger/10 text-light-text-secondary hover:text-danger cursor-pointer transition-all duration-150"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress ring indicators */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-end text-xs font-semibold">
                      <span className="text-light-text-secondary dark:text-dark-text-secondary">Accumulated Progress</span>
                      <span className="text-light-text-primary dark:text-dark-text-primary font-bold">
                        ${currentNum.toFixed(0)} / ${targetNum.toFixed(0)}
                      </span>
                    </div>
                    <Progress value={percentage} variant={isFinished ? 'success' : 'primary'} />
                  </div>
                </div>

                {/* Contribution details and CTA */}
                <div className="flex items-center justify-between gap-3 mt-6 pt-3 border-t border-light-border/40 dark:border-dark-border/40">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-light-text-secondary dark:text-dark-text-secondary">
                    <Calendar className="w-3.5 h-3.5" />
                    {goal.deadline
                      ? `By ${new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                      : 'No Deadline'}
                  </div>
                  {isFinished ? (
                    <div className="flex items-center gap-1 text-xs font-bold text-success">
                      <ShieldCheck className="w-4 h-4" />
                      Completed
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="flex items-center gap-1 cursor-pointer" onClick={() => handleOpenContribution(goal)}>
                      <Coins className="w-3 h-3" />
                      Fund Goal
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add goal target modal */}
      <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title="Add Savings Goal">
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <Input
            label="Goal Name"
            placeholder="e.g. Wedding Fund, Emergency Buffer"
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
            required
            disabled={submitting}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Target Amount ($)"
              placeholder="5000"
              type="number"
              value={targetAmt}
              onChange={(e) => setTargetAmt(e.target.value)}
              required
              disabled={submitting}
            />
            <Input
              label="Initial Stash ($)"
              type="number"
              value={currentAmt}
              onChange={(e) => setCurrentAmt(e.target.value)}
              required
              disabled={submitting}
            />
          </div>
          <Input
            label="Target Date / Deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            disabled={submitting}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsGoalModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Establish Goal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Contribution Drawer modal */}
      <Modal isOpen={isContributionModalOpen} onClose={() => setIsContributionModalOpen(false)} title={`Fund Goal: ${selectedGoal?.name}`}>
        {selectedGoal && (
          <form onSubmit={handleContributionSubmit} className="space-y-4">
            <Select
              label="Funding Wallet Source"
              options={[
                { value: '', label: '-- Choose --' },
                ...wallets.map((w) => ({ value: w.id, label: `${w.name} ($${Number(w.balance).toFixed(2)})` })),
              ]}
              value={contribWalletId}
              onChange={(e) => setContribWalletId(e.target.value)}
              required
              disabled={submitting}
            />
            <Input
              label="Contribution Amount ($)"
              placeholder="100.00"
              type="number"
              step="0.01"
              value={contribAmount}
              onChange={(e) => setContribAmount(e.target.value)}
              required
              disabled={submitting}
            />
            <Input
              label="Contribution Note"
              value={contribNote}
              onChange={(e) => setContribNote(e.target.value)}
              disabled={submitting}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsContributionModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Execute Deposit
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
