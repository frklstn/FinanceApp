import { createClient } from '@/lib/supabase/server';
import { walletService } from '@/lib/services/workspace/wallet.service';
import { WalletsClient } from '@/components/finance/wallets/WalletsClient';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Dompet | FinanceApp',
  description: 'Kelola semua rekening, e-wallet, dan aset tunai Anda dalam satu tempat.',
};

export default async function WalletsPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect('/login');
  }

  // Fetch data directly on the server
  const initialWallets = await walletService.getWallets(session.user.id);

  // Pass data to Client Component for interactivity
  return <WalletsClient initialWallets={initialWallets} accountId={session.user.id} />;
}