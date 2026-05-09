import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  userId: string;
  currentBalance: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TopUpModal({ userId, currentBalance, onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(/\D/g, ''));
    if (!numAmount || numAmount <= 0) { setError('Masukkan jumlah yang valid'); return; }

    setError('');
    setLoading(true);
    try {
      const { data: wallet } = await supabase
        .from('wallet')
        .select('id, balance')
        .eq('user_id', userId)
        .maybeSingle();

      if (wallet) {
        await supabase.from('wallet').update({
          balance: wallet.balance + numAmount,
          updated_at: new Date().toISOString(),
        }).eq('id', wallet.id);
      } else {
        await supabase.from('wallet').insert({ user_id: userId, balance: numAmount });
      }

      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'income',
        amount: numAmount,
        category: 'Top Up',
        description: 'Top up saldo dompet',
        date: new Date().toISOString().split('T')[0],
      });

      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal top up');
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
          <h2 className="text-white font-semibold text-lg">Top Up Saldo</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Jumlah Top Up (Rp)</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(formatAmountInput(e.target.value))}
              placeholder="0"
              required
              className="w-full bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </div>

          <div>
            <p className="text-sm text-slate-400 mb-2">Pilih nominal cepat:</p>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(q.toLocaleString('id-ID'))}
                  className="bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 text-slate-300 text-xs font-medium py-2.5 rounded-xl transition-all"
                >
                  {q >= 1000000 ? `${q / 1000000}jt` : `${q / 1000}rb`}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {loading ? 'Memproses...' : 'Top Up Sekarang'}
          </button>
        </form>
      </div>
    </div>
  );
}
