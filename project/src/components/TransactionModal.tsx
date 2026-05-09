import { useState } from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase, TransactionType } from '../lib/supabase';

const INCOME_CATEGORIES = ['Gaji', 'Freelance', 'Bisnis', 'Investasi', 'Hadiah', 'Lainnya'];
const EXPENSE_CATEGORIES = [
  'Makanan & Minuman', 'Transportasi', 'Belanja', 'Kesehatan',
  'Hiburan', 'Tagihan', 'Pendidikan', 'Lainnya',
];

interface Props {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransactionModal({ userId, onClose, onSuccess }: Props) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) { setError('Pilih kategori'); return; }
    const numAmount = parseFloat(amount.replace(/\D/g, ''));
    if (!numAmount || numAmount <= 0) { setError('Masukkan jumlah yang valid'); return; }

    setError('');
    setLoading(true);
    try {
      const { error: txError } = await supabase.from('transactions').insert({
        user_id: userId,
        type,
        amount: numAmount,
        category,
        description,
        date,
      });
      if (txError) throw txError;

      // Update wallet balance
      const { data: wallet } = await supabase
        .from('wallet')
        .select('id, balance')
        .eq('user_id', userId)
        .maybeSingle();

      if (wallet) {
        const newBalance = type === 'income'
          ? wallet.balance + numAmount
          : wallet.balance - numAmount;
        await supabase.from('wallet').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', wallet.id);
      } else {
        const initBalance = type === 'income' ? numAmount : -numAmount;
        await supabase.from('wallet').insert({ user_id: userId, balance: initBalance });
      }

      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan transaksi');
    } finally {
      setLoading(false);
    }
  }

  function formatAmountInput(val: string) {
    const digits = val.replace(/\D/g, '');
    return digits ? parseInt(digits).toLocaleString('id-ID') : '';
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
          <h2 className="text-white font-semibold text-lg">Tambah Transaksi</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex bg-slate-700/40 rounded-xl p-1">
            <button
              type="button"
              onClick={() => { setType('income'); setCategory(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                type === 'income' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => { setType('expense'); setCategory(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                type === 'expense' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              Pengeluaran
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Jumlah (Rp)</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(formatAmountInput(e.target.value))}
              placeholder="0"
              required
              className="w-full bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Kategori</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-3 rounded-lg text-xs font-medium transition-all border ${
                    category === cat
                      ? type === 'income'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-red-500/20 border-red-500 text-red-400'
                      : 'bg-slate-700/30 border-slate-600/50 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Keterangan</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opsional"
              className="w-full bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-slate-700/50 border border-slate-600/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full font-semibold py-3 rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
              type === 'income'
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20'
                : 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/20'
            }`}
          >
            {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
          </button>
        </form>
      </div>
    </div>
  );
}
