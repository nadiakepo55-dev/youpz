import { useEffect, useState, useCallback } from 'react';
import { supabase, Wallet, Transaction, Debt } from './lib/supabase';
import type { User } from '@supabase/supabase-js';
import AuthPage from './components/AuthPage';
import WalletCard from './components/WalletCard';
import TransactionModal from './components/TransactionModal';
import DebtModal from './components/DebtModal';
import TopUpModal from './components/TopUpModal';
import TransactionList from './components/TransactionList';
import DebtList from './components/DebtList';
import {
  LayoutDashboard, ArrowLeftRight, HandCoins,
  Plus, LogOut, TrendingDown
} from 'lucide-react';
import { formatCurrency } from './lib/format';

type Tab = 'dashboard' | 'transactions' | 'debts';
type Modal = 'transaction' | 'debt' | 'topup' | null;

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [activeModal, setActiveModal] = useState<Modal>(null);

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchData = useCallback(async () => {
    if (!user) return;

    const [walletRes, txRes, debtRes] = await Promise.all([
      supabase.from('wallet').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('debts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);

    setWallet(walletRes.data ?? null);
    setTransactions(txRes.data ?? []);
    setDebts(debtRes.data ?? []);
  }, [user]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  function handleModalSuccess() {
    setActiveModal(null);
    fetchData();
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  const balance = wallet?.balance ?? 0;
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const recentTransactions = transactions.slice(0, 5);
  const activeDebts = debts.filter((d) => !d.is_settled);

  const NAV_TABS = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions' as Tab, label: 'Transaksi', icon: ArrowLeftRight },
    { id: 'debts' as Tab, label: 'Utang/Piutang', icon: HandCoins },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/60">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">DompetKu</h1>
            <p className="text-xs text-slate-500 truncate max-w-[200px]">{user.email}</p>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-lg mx-auto px-4 pb-32">
        {activeTab === 'dashboard' && (
          <div className="pt-5 space-y-6">
            <WalletCard
              balance={balance}
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              onTopUp={() => setActiveModal('topup')}
            />

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveModal('transaction')}
                className="flex items-center gap-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/30 rounded-xl p-4 transition-all"
              >
                <div className="bg-emerald-500/10 rounded-xl p-2.5">
                  <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-left">
                  <p className="text-white text-sm font-medium">Catat</p>
                  <p className="text-slate-500 text-xs">Pemasukan/Pengeluaran</p>
                </div>
              </button>
              <button
                onClick={() => setActiveModal('debt')}
                className="flex items-center gap-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-orange-500/30 rounded-xl p-4 transition-all"
              >
                <div className="bg-orange-500/10 rounded-xl p-2.5">
                  <HandCoins className="w-5 h-5 text-orange-400" />
                </div>
                <div className="text-left">
                  <p className="text-white text-sm font-medium">Tambah</p>
                  <p className="text-slate-500 text-xs">Utang / Piutang</p>
                </div>
              </button>
            </div>

            {/* Recent Transactions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-white font-semibold">Transaksi Terbaru</h2>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="text-emerald-400 text-xs hover:text-emerald-300 transition-colors"
                >
                  Lihat semua
                </button>
              </div>
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700/30">
                  <TrendingDown className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Belum ada transaksi</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/30 rounded-xl px-4 py-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${
                        tx.type === 'income' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                      }`}>
                        {tx.type === 'income' ? '📥' : '📤'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{tx.category}</p>
                        {tx.description && <p className="text-slate-500 text-xs truncate">{tx.description}</p>}
                      </div>
                      <p className={`font-semibold text-sm ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Debts Summary */}
            {activeDebts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-white font-semibold">Utang/Piutang Aktif</h2>
                  <button
                    onClick={() => setActiveTab('debts')}
                    className="text-emerald-400 text-xs hover:text-emerald-300 transition-colors"
                  >
                    Lihat semua
                  </button>
                </div>
                <div className="space-y-2">
                  {activeDebts.slice(0, 3).map((debt) => (
                    <div key={debt.id} className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/30 rounded-xl px-4 py-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 font-bold ${
                        debt.type === 'debt' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {debt.type === 'debt' ? 'U' : 'P'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{debt.person_name}</p>
                        <p className="text-slate-500 text-xs">{debt.type === 'debt' ? 'Utang ke' : 'Piutang dari'} {debt.person_name}</p>
                      </div>
                      <p className={`font-semibold text-sm ${debt.type === 'debt' ? 'text-orange-400' : 'text-blue-400'}`}>
                        {formatCurrency(debt.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="pt-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Riwayat Transaksi</h2>
              <button
                onClick={() => setActiveModal('transaction')}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all"
              >
                <Plus className="w-4 h-4" />
                Tambah
              </button>
            </div>
            <TransactionList
              transactions={transactions}
              userId={user.id}
              onRefresh={fetchData}
            />
          </div>
        )}

        {activeTab === 'debts' && (
          <div className="pt-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Utang & Piutang</h2>
              <button
                onClick={() => setActiveModal('debt')}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all"
              >
                <Plus className="w-4 h-4" />
                Tambah
              </button>
            </div>
            <DebtList debts={debts} onRefresh={fetchData} />
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-md border-t border-slate-800/60">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-around">
          {NAV_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                activeTab === id ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${activeTab === id ? 'scale-110' : ''}`} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* FAB */}
      {activeTab === 'dashboard' && (
        <button
          onClick={() => setActiveModal('transaction')}
          className="fixed bottom-20 right-4 w-14 h-14 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-40"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Modals */}
      {activeModal === 'transaction' && (
        <TransactionModal userId={user.id} onClose={() => setActiveModal(null)} onSuccess={handleModalSuccess} />
      )}
      {activeModal === 'debt' && (
        <DebtModal userId={user.id} onClose={() => setActiveModal(null)} onSuccess={handleModalSuccess} />
      )}
      {activeModal === 'topup' && (
        <TopUpModal
          userId={user.id}
          currentBalance={balance}
          onClose={() => setActiveModal(null)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
