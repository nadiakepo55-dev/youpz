import { useState } from 'react';
import { CheckCircle, Trash2, ArrowDownLeft, ArrowUpRight, Clock } from 'lucide-react';
import { Debt } from '../lib/supabase';
import { formatCurrency, formatDate } from '../lib/format';
import { supabase } from '../lib/supabase';

interface Props {
  debts: Debt[];
  onRefresh: () => void;
}

export default function DebtList({ debts, onRefresh }: Props) {
  const [activeTab, setActiveTab] = useState<'active' | 'settled'>('active');
  const [filter, setFilter] = useState<'all' | 'debt' | 'receivable'>('all');

  const activeDebts = debts.filter((d) => !d.is_settled);
  const settledDebts = debts.filter((d) => d.is_settled);
  const list = activeTab === 'active' ? activeDebts : settledDebts;

  const filtered = list.filter((d) => filter === 'all' || d.type === filter);

  const totalDebt = activeDebts.filter((d) => d.type === 'debt').reduce((s, d) => s + d.amount, 0);
  const totalReceivable = activeDebts.filter((d) => d.type === 'receivable').reduce((s, d) => s + d.amount, 0);

  async function markSettled(debt: Debt) {
    await supabase.from('debts').update({ is_settled: true }).eq('id', debt.id);
    onRefresh();
  }

  async function handleDelete(debt: Debt) {
    if (!confirm('Hapus data ini?')) return;
    await supabase.from('debts').delete().eq('id', debt.id);
    onRefresh();
  }

  function isOverdue(due: string | null) {
    if (!due) return false;
    return new Date(due) < new Date();
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownLeft className="w-4 h-4 text-orange-400" />
            <span className="text-orange-400 text-xs font-medium">Total Utang</span>
          </div>
          <p className="text-white font-bold">{formatCurrency(totalDebt)}</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 text-xs font-medium">Total Piutang</span>
          </div>
          <p className="text-white font-bold">{formatCurrency(totalReceivable)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex bg-slate-800/60 border border-slate-700/50 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'active' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Aktif ({activeDebts.length})
          </button>
          <button
            onClick={() => setActiveTab('settled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'settled' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Lunas ({settledDebts.length})
          </button>
        </div>

        <div className="flex bg-slate-800/60 border border-slate-700/50 rounded-xl p-1">
          {(['all', 'debt', 'receivable'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f
                  ? f === 'debt' ? 'bg-orange-500 text-white'
                  : f === 'receivable' ? 'bg-blue-500 text-white'
                  : 'bg-slate-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f === 'all' ? 'Semua' : f === 'debt' ? 'Utang' : 'Piutang'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-4xl mb-3">{activeTab === 'active' ? '🤝' : '✅'}</p>
          <p>{activeTab === 'active' ? 'Tidak ada utang/piutang aktif' : 'Belum ada yang lunas'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((debt) => (
            <div
              key={debt.id}
              className={`bg-slate-800/60 border rounded-xl p-4 hover:border-slate-600/50 transition-all group ${
                debt.is_settled
                  ? 'border-slate-700/20 opacity-60'
                  : isOverdue(debt.due_date)
                  ? 'border-red-500/30'
                  : 'border-slate-700/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  debt.type === 'debt' ? 'bg-orange-500/10' : 'bg-blue-500/10'
                }`}>
                  {debt.type === 'debt'
                    ? <ArrowDownLeft className="w-5 h-5 text-orange-400" />
                    : <ArrowUpRight className="w-5 h-5 text-blue-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium text-sm">{debt.person_name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      debt.type === 'debt'
                        ? 'bg-orange-500/10 text-orange-400'
                        : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {debt.type === 'debt' ? 'Utang' : 'Piutang'}
                    </span>
                  </div>
                  {debt.description && (
                    <p className="text-slate-500 text-xs mt-0.5 truncate">{debt.description}</p>
                  )}
                  {debt.due_date && (
                    <div className={`flex items-center gap-1 mt-1 ${
                      isOverdue(debt.due_date) && !debt.is_settled ? 'text-red-400' : 'text-slate-500'
                    }`}>
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">
                        {isOverdue(debt.due_date) && !debt.is_settled ? 'Jatuh tempo: ' : 'Due: '}
                        {formatDate(debt.due_date)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className={`font-bold text-sm ${
                    debt.type === 'debt' ? 'text-orange-400' : 'text-blue-400'
                  }`}>
                    {formatCurrency(debt.amount)}
                  </p>
                  {!debt.is_settled && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => markSettled(debt)}
                        className="text-slate-600 hover:text-emerald-400 transition-colors"
                        title="Tandai lunas"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(debt)}
                        className="text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {debt.is_settled && (
                    <span className="text-emerald-400 text-xs font-medium">Lunas</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
