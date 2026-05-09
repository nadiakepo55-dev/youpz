import { useState } from 'react';
import { Trash2, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { Transaction } from '../lib/supabase';
import { formatCurrency, formatDate } from '../lib/format';
import { supabase } from '../lib/supabase';

interface Props {
  transactions: Transaction[];
  onRefresh: () => void;
  userId: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  'Gaji': '💼', 'Freelance': '💻', 'Bisnis': '🏢', 'Investasi': '📈',
  'Hadiah': '🎁', 'Top Up': '💳', 'Makanan & Minuman': '🍜', 'Transportasi': '🚗',
  'Belanja': '🛍️', 'Kesehatan': '❤️', 'Hiburan': '🎮', 'Tagihan': '📄',
  'Pendidikan': '📚', 'Lainnya': '📦',
};

export default function TransactionList({ transactions, onRefresh, userId }: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  const filtered = transactions.filter((t) => {
    const matchSearch = t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || t.type === filter;
    return matchSearch && matchFilter;
  });

  // Group by date
  const grouped = filtered.reduce<Record<string, Transaction[]>>((acc, t) => {
    const key = t.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  async function handleDelete(tx: Transaction) {
    if (!confirm('Hapus transaksi ini?')) return;
    await supabase.from('transactions').delete().eq('id', tx.id);

    const { data: wallet } = await supabase
      .from('wallet').select('id, balance').eq('user_id', userId).maybeSingle();
    if (wallet) {
      const delta = tx.type === 'income' ? -tx.amount : tx.amount;
      await supabase.from('wallet').update({
        balance: wallet.balance + delta,
        updated_at: new Date().toISOString(),
      }).eq('id', wallet.id);
    }
    onRefresh();
  }

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari transaksi..."
            className="w-full bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
          />
        </div>
        <div className="flex bg-slate-800/60 border border-slate-700/50 rounded-xl p-1">
          {(['all', 'income', 'expense'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f
                  ? f === 'income' ? 'bg-emerald-500 text-white'
                  : f === 'expense' ? 'bg-red-500 text-white'
                  : 'bg-slate-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f === 'all' ? 'Semua' : f === 'income' ? 'Masuk' : 'Keluar'}
            </button>
          ))}
        </div>
      </div>

      {sortedDates.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-4xl mb-3">📋</p>
          <p>Belum ada transaksi</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((date) => (
            <div key={date}>
              <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
                {formatDate(date)}
              </p>
              <div className="space-y-2">
                {grouped[date].map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/30 rounded-xl px-4 py-3 hover:border-slate-600/50 transition-all group"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                      tx.type === 'income' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                    }`}>
                      {CATEGORY_ICONS[tx.category] || (tx.type === 'income' ? '📥' : '📤')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{tx.category}</p>
                      {tx.description && (
                        <p className="text-slate-500 text-xs truncate">{tx.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`font-semibold text-sm ${
                          tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          {tx.type === 'income'
                            ? <TrendingUp className="w-3 h-3 text-emerald-500" />
                            : <TrendingDown className="w-3 h-3 text-red-500" />}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(tx)}
                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
