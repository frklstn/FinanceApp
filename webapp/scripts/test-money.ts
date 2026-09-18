import assert from 'node:assert';
import { walletService } from '../src/lib/services/server/wallet.service';
import { transactionService } from '../src/lib/services/server/transaction.service';
import { workspaceService } from '../src/lib/services/server/workspace';
import { savingsService } from '../src/lib/services/server/savings.service';
import { debtService } from '../src/lib/services/server/debt.service';
import { query } from '../src/lib/db/server';

const WS = '0a3eb44e-a50e-40f5-9495-30dd7a3138fc';
const OTHER_WS = '00000000-0000-0000-0000-0000000000ff';
const USER = '4a80b3b1-864a-4510-92bc-43e8554550aa';

const bal = async (id: string) =>
  Number((await query('SELECT balance FROM wallets WHERE id = $1', [id])).rows[0].balance);

async function main() {
  const a = await walletService.createWallet(WS, '__test_A', 'cash', 1000, '#a8532f', 'wallet', 'IDR');
  const b = await walletService.createWallet(WS, '__test_B', 'bank', 500, '#b45309', 'wallet', 'IDR');
  const created: string[] = [];

  try {
    // income menambah saldo
    const inc = await transactionService.createTransaction(WS, { wallet_id: a.id, amount: 200, type: 'income' });
    created.push(inc.id);
    assert.strictEqual(await bal(a.id), 1200, 'income harus menambah saldo');

    // expense mengurangi saldo
    const exp = await transactionService.createTransaction(WS, { wallet_id: a.id, amount: 300, type: 'expense' });
    created.push(exp.id);
    assert.strictEqual(await bal(a.id), 900, 'expense harus mengurangi saldo');

    // transfer memindah saldo antar dompet
    const trf = await transactionService.createTransaction(WS, {
      wallet_id: a.id, destination_wallet_id: b.id, amount: 400, type: 'transfer',
    });
    created.push(trf.id);
    assert.strictEqual(await bal(a.id), 500, 'transfer harus mengurangi dompet asal');
    assert.strictEqual(await bal(b.id), 900, 'transfer harus menambah dompet tujuan');

    // hapus transaksi mengembalikan saldo
    await transactionService.deleteTransaction(trf.id, WS);
    created.pop();
    assert.strictEqual(await bal(a.id), 900, 'hapus transfer harus mengembalikan dompet asal');
    assert.strictEqual(await bal(b.id), 500, 'hapus transfer harus mengembalikan dompet tujuan');

    // tolak jumlah <= 0
    await assert.rejects(
      () => transactionService.createTransaction(WS, { wallet_id: a.id, amount: 0, type: 'income' }),
      /lebih dari 0/, 'jumlah 0 harus ditolak'
    );

    // tolak transfer ke dompet yang sama
    await assert.rejects(
      () => transactionService.createTransaction(WS, { wallet_id: a.id, destination_wallet_id: a.id, amount: 10, type: 'transfer' }),
      /tidak boleh sama/, 'transfer ke diri sendiri harus ditolak'
    );

    // AUTHZ: workspace lain tidak boleh memakai dompet ini
    await assert.rejects(
      () => transactionService.createTransaction(OTHER_WS, { wallet_id: a.id, amount: 10, type: 'income' }),
      /tidak ditemukan/, 'workspace lain harus ditolak'
    );

    // AUTHZ: hapus transaksi dari workspace lain harus gagal
    await assert.rejects(
      () => transactionService.deleteTransaction(created[0], OTHER_WS),
      /tidak ditemukan/, 'hapus lintas-workspace harus ditolak'
    );

    // AUTHZ: update & delete dompet di-scope workspace
    assert.strictEqual(
      await walletService.updateWallet(a.id, OTHER_WS, { name: 'diretas' }), null,
      'update dompet lintas-workspace harus null'
    );
    await walletService.deleteWallet(a.id, OTHER_WS);
    assert.strictEqual(
      (await query('SELECT 1 FROM wallets WHERE id = $1', [a.id])).rows.length, 1,
      'delete dompet lintas-workspace tidak boleh menghapus'
    );

    // UBAH TRANSAKSI: efek lama dibatalkan, efek baru diterapkan.
    const ubah = await transactionService.createTransaction(WS, { wallet_id: a.id, amount: 100, type: 'expense' });
    created.push(ubah.id);
    assert.strictEqual(await bal(a.id), 800, 'expense 100 dari 900');

    // Naikkan nominal: 800 + 100 (batal) - 250 (baru) = 650
    await transactionService.updateTransaction(ubah.id, WS, { wallet_id: a.id, amount: 250, type: 'expense' });
    assert.strictEqual(await bal(a.id), 650, 'ubah nominal harus menyesuaikan saldo');

    // Ganti jenis jadi income: 650 + 250 (batal) + 250 (baru) = 1150
    await transactionService.updateTransaction(ubah.id, WS, { wallet_id: a.id, amount: 250, type: 'income' });
    assert.strictEqual(await bal(a.id), 1150, 'ganti jenis harus menyesuaikan saldo');

    // Pindah dompet: 1150 - 250 (batal di A), B 500 + 250 = 750
    await transactionService.updateTransaction(ubah.id, WS, { wallet_id: b.id, amount: 250, type: 'income' });
    assert.strictEqual(await bal(a.id), 900, 'dompet lama harus dikembalikan');
    assert.strictEqual(await bal(b.id), 750, 'dompet baru harus menerima');

    // AUTHZ: ubah dari workspace lain harus ditolak
    await assert.rejects(
      () => transactionService.updateTransaction(ubah.id, OTHER_WS, { wallet_id: b.id, amount: 1, type: 'income' }),
      /tidak ditemukan/, 'ubah lintas-workspace harus ditolak'
    );

    await transactionService.deleteTransaction(ubah.id, WS);
    created.pop();
    assert.strictEqual(await bal(b.id), 500, 'hapus harus mengembalikan saldo B');

    // FILTER & PAGINASI: count harus total, bukan panjang halaman.
    const semua = await transactionService.getTransactions(WS, { limit: 1 });
    assert.strictEqual(semua.data.length, 1, 'limit 1 harus mengembalikan 1 baris');
    assert.ok(semua.count >= 2, 'count harus jumlah keseluruhan, bukan panjang halaman');

    const cariNota = await transactionService.getTransactions(WS, { search: 'tidak-ada-nota-begini' });
    assert.strictEqual(cariNota.count, 0, 'pencarian tanpa hasil harus 0');

    // TABUNGAN: kontribusi memindahkan dana dari dompet ke target.
    // Target 500: dompet A ada 900 di titik ini, cukup untuk 300 + 200.
    const goal = await savingsService.createSavingsGoal(WS, '__uji_target', 500, 0, null);
    try {
      await savingsService.addContribution(WS, goal.id, 300, a.id);
      assert.strictEqual(await bal(a.id), 600, 'kontribusi harus mengurangi saldo dompet');

      const g1 = (await query('SELECT current_amount, is_completed FROM savings_goals WHERE id = $1', [goal.id])).rows[0];
      assert.strictEqual(Number(g1.current_amount), 300, 'target harus bertambah');
      assert.strictEqual(g1.is_completed, false, 'belum tercapai');

      // Melebihi saldo ditolak
      await assert.rejects(
        () => savingsService.addContribution(WS, goal.id, 999999, a.id),
        /tidak cukup/, 'kontribusi melebihi saldo harus ditolak'
      );
      // Workspace lain ditolak
      await assert.rejects(
        () => savingsService.addContribution(OTHER_WS, goal.id, 10, a.id),
        /tidak ditemukan/, 'kontribusi lintas-workspace harus ditolak'
      );

      // Lunas menandai is_completed
      await savingsService.addContribution(WS, goal.id, 200, a.id);
      const g2 = (await query('SELECT is_completed FROM savings_goals WHERE id = $1', [goal.id])).rows[0];
      assert.strictEqual(g2.is_completed, true, 'target tercapai harus ditandai selesai');
    } finally {
      await query('DELETE FROM savings_goals WHERE id = $1', [goal.id]);
    }

    // UTANG: pembayaran mengurangi sisa & saldo, lunas ditandai.
    await query('UPDATE wallets SET balance = 1000 WHERE id = $1', [a.id]);
    await debtService.createDebt(WS, '__uji_utang', 'owe', 500, null, null, 'IDR');
    const utang = (await query("SELECT id FROM debts WHERE name = '__uji_utang'")).rows[0];
    try {
      await debtService.recordPayment(WS, utang.id, 200, a.id, 'cicil');
      assert.strictEqual(await bal(a.id), 800, 'bayar utang harus mengurangi saldo');

      const d1 = (await query('SELECT remaining_amount, status FROM debts WHERE id = $1', [utang.id])).rows[0];
      assert.strictEqual(Number(d1.remaining_amount), 300, 'sisa utang harus berkurang');
      assert.strictEqual(d1.status, 'active', 'belum lunas');

      // Melebihi sisa ditolak
      await assert.rejects(
        () => debtService.recordPayment(WS, utang.id, 99999, a.id, 'x'),
        /melebihi sisa/, 'bayar melebihi sisa harus ditolak'
      );
      // Workspace lain ditolak
      await assert.rejects(
        () => debtService.recordPayment(OTHER_WS, utang.id, 10, a.id, 'x'),
        /tidak ditemukan/, 'bayar lintas-workspace harus ditolak'
      );

      await debtService.recordPayment(WS, utang.id, 300, a.id, 'lunas');
      const d2 = (await query('SELECT status FROM debts WHERE id = $1', [utang.id])).rows[0];
      assert.strictEqual(d2.status, 'settled', 'utang lunas harus ditandai settled');
    } finally {
      await query('DELETE FROM debt_payments WHERE debt_id = $1', [utang.id]);
      await query('DELETE FROM debts WHERE id = $1', [utang.id]);
    }

    // PINJOL: buat, ubah, hapus — plus scope workspace.
    const loan = await debtService.createLoanTracker(WS, {
      app_name: '__uji_pinjol', category: 'pinjol', amount_applied: 1_000_000,
      amount_received: 900_000, total_repayment: 1_200_000, monthly_payment: 200_000,
      tenure_months: 6, due_day: 15, start_date: '2026-07-01',
    });
    try {
      assert.strictEqual(Number(loan.amount_applied), 1_000_000, 'amount_applied harus tersimpan');
      assert.strictEqual(
        Number(loan.total_remaining_balance), 1_200_000,
        'sisa awal harus sama dengan total tagihan'
      );

      const list = await debtService.getLoanTrackers(WS);
      assert.ok(list.some((l) => l.id === loan.id), 'pinjol harus muncul di daftar');

      const ubahLoan = await debtService.updateLoanTracker(loan.id, WS, {
        app_name: '__uji_pinjol_ubah', category: 'paylater', amount_applied: null,
        amount_received: 900_000, total_repayment: 1_400_000, monthly_payment: 200_000,
        tenure_months: 7, due_day: 20, start_date: '2026-07-01', status: 'active',
      });
      assert.strictEqual(ubahLoan?.app_name, '__uji_pinjol_ubah', 'perubahan harus tersimpan');

      // Workspace lain ditolak
      assert.strictEqual(
        await debtService.updateLoanTracker(loan.id, OTHER_WS, {
          app_name: 'x', category: 'pinjol', amount_received: 1, total_repayment: 1,
          monthly_payment: 1, tenure_months: 1, due_day: 1, start_date: '2026-07-01',
        }), null,
        'ubah pinjol lintas-workspace harus null'
      );
      await debtService.deleteLoanTracker(loan.id, OTHER_WS);
      assert.strictEqual(
        (await query('SELECT 1 FROM loan_trackers WHERE id = $1', [loan.id])).rows.length, 1,
        'hapus pinjol lintas-workspace tidak boleh menghapus'
      );
    } finally {
      await query('DELETE FROM loan_trackers WHERE id = $1', [loan.id]);
    }

    // SUSPENSI: akun aktif dapat scope, akun tersuspensi tidak dapat apa-apa.
    assert.strictEqual(
      await workspaceService.getActiveAccountForUser(USER), WS,
      'akun aktif harus dapat workspace'
    );
    await query('UPDATE profiles SET is_suspended = true WHERE id = $1', [USER]);
    try {
      assert.strictEqual(
        await workspaceService.getActiveAccountForUser(USER), null,
        'akun tersuspensi tidak boleh dapat workspace'
      );
    } finally {
      await query('UPDATE profiles SET is_suspended = false WHERE id = $1', [USER]);
    }
    assert.strictEqual(
      await workspaceService.getActiveAccountForUser(USER), WS,
      'setelah suspensi dicabut harus dapat workspace lagi'
    );

    console.log('SEMUA CEK LULUS');
  } finally {
    for (const id of created) await query('DELETE FROM transactions WHERE id = $1', [id]);
    await query('DELETE FROM transactions WHERE wallet_id = ANY($1) OR destination_wallet_id = ANY($1)', [[a.id, b.id]]);
    await query('DELETE FROM wallets WHERE id = ANY($1)', [[a.id, b.id]]);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error('GAGAL:', e.message); process.exit(1); });
