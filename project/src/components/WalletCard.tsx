import { Wallet, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../lib/format';

interface Props {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  onTopUp: () => void;
}

export default function WalletCard({ balance, totalIncome, totalExpense, onTopUp }: Props) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 shadow-xl shadow-emerald-900/30">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-24 -translate-x-16" />

      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 rounded-xl p-2">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-white/80 text-sm font-medium">Saldo Dompet</span>
          </div>
          <button
            onClick={onTopUp}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Top Up
          </button>
        </div>

        <div className="mb-6">
          <p className="text-white/60 text-xs mb-1">Total Saldo</p>
          <p className="text-white text-4xl font-bold tracking-tight">{formatCurrency(balance)}</p>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-200" />
              <span className="text-white/70 text-xs">Pemasukan</span>
            </div>
            <p className="text-white font-semibold text-sm">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="w-3.5 h-3.5 text-red-300" />
              <span className="text-white/70 text-xs">Pengeluaran</span>
            </div>
            <p className="text-white font-semibold text-sm">{formatCurrency(totalExpense)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
