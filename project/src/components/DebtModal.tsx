import { useState } from 'react';
import { X, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { supabase, DebtType } from '../lib/supabase';

interface Props {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DebtModal({ userId, onClose, onSuccess }: Props) {
  const [type, setType] = useState<DebtType>('debt');
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(/\D/g, ''));
    if (!numAmount || numAmount <= 0) { setError('Masukkan jumlah yang valid'); return; }

    setError('');
    setLoading(true);
    try {
      const { error: dbError } = await supabase.from('debts').insert({
        user_id: userId,
        type,
        person_name: personName,
        amount: numAmount,
        description,
        due_date: dueDate || null,
        is_settled: false,
      });
      if (dbError) throw dbError;
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data');
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
          <h2 className="text-white font-semibold text-lg">Tambah Utang/Piutang</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex bg-slate-700/40 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setType('debt')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                type === 'debt' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              Utang
            </button>
            <button
              type="button"
              onClick={() => setType('receivable')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                type === 'receivable' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Piutang
            </button>
          </div>

          <div className="bg-slate-700/30 rounded-xl p-3 text-xs text-slate-400">
            {type === 'debt'
              ? 'Utang: kamu meminjam uang dari orang lain'
              : 'Piutang: orang lain meminjam uang darimu'}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              {type === 'debt' ? 'Nama Pemberi Pinjaman' : 'Nama Peminjam'}
            </label>
            <input
              type="text"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="Nama orang"
              required
              className="w-full bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
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
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Jatuh Tempo (Opsional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
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
              type === 'debt'
                ? 'bg-orange-500 hover:bg-orange-400 text-white shadow-orange-500/20'
                : 'bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/20'
            }`}
          >
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </form>
      </div>
    </div>
  );
}
