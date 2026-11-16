import React, { useState, useEffect } from 'react';
import {
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Eye,
  Clock,
  Layers,
  X,
  ArrowRight,
} from 'lucide-react';
import clsx from 'clsx';
import { api } from '../../services/api';
import { ExecutionHistoryItem } from '../../types';

export const ExecutionHistoryView: React.FC = () => {
  const [history, setHistory] = useState<ExecutionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedRecord, setSelectedRecord] = useState<ExecutionHistoryItem | null>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const records = await api.getExecutionHistory(50);
      setHistory(records);
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleClearHistory = async () => {
    if (window.confirm('Clear all execution history records?')) {
      await api.clearExecutionHistory();
      setHistory([]);
      setSelectedRecord(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">
              Execution Audit Log & Trace History
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-950/80 text-electric-cyan border border-cyan-800/40">
              {history.length} records
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Full deterministic execution trace history stored persistently in SQLite.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchHistory}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-navy-900 border border-slate-700 hover:border-cyan-400 text-slate-200 transition-colors shadow-neu-convex"
          >
            <RefreshCw className="w-3.5 h-3.5 text-electric-cyan" />
            <span>Refresh</span>
          </button>

          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-950/50 border border-rose-800/50 hover:bg-rose-900 transition-colors shadow-neu-pressed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* History Table */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[350px]">
          <RefreshCw className="w-5 h-5 text-electric-cyan animate-spin" />
        </div>
      ) : history.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-panel shadow-neu-card text-slate-400 space-y-2">
          <History className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="text-sm font-semibold text-slate-300">No Executions Recorded Yet</div>
          <div className="text-xs text-slate-500">
            Run an input sequence in the Execution Simulator to log deterministic traces here.
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-surface-border glass-panel shadow-neu-card">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-navy-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Workflow Name</th>
                <th className="py-3.5 px-4">Input Sequence (w)</th>
                <th className="py-3.5 px-4">Steps</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-navy-900/40">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-cyan-950/20 transition-colors">
                  <td className="py-3 px-4">
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                        item.is_accepted
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                      )}
                    >
                      {item.is_accepted ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3 h-3 text-rose-400" />
                      )}
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-200">
                    {item.workflow_name}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    <div className="max-w-[280px] truncate">
                      {item.input_sequence.length > 0
                        ? item.input_sequence.join(' → ')
                        : 'ε (Empty string)'}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{item.total_steps}</td>
                  <td className="py-3 px-4 text-slate-400">{item.duration_ms} ms</td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {new Date(item.executed_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedRecord(item)}
                      className="p-1.5 rounded-lg bg-navy-950 border border-slate-700 text-electric-cyan hover:border-cyan-400 hover:bg-cyan-950/50 transition-colors"
                      title="Inspect full execution trace"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Inspector Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-2xl bg-navy-900 border border-surface-border rounded-2xl shadow-neu-card p-6 space-y-5 max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Execution Trace Inspector
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  ID: {selectedRecord.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Verdict summary */}
            <div
              className={clsx(
                'p-4 rounded-xl border text-xs font-mono space-y-1',
                selectedRecord.is_accepted
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
              )}
            >
              <div className="font-bold text-sm flex items-center gap-2">
                {selectedRecord.is_accepted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )}
                Result: {selectedRecord.status} (
                {selectedRecord.is_accepted ? 'Accepted: w ∈ L(M)' : 'Rejected'})
              </div>
              <p className="text-[11px] leading-relaxed">
                {selectedRecord.explanation || selectedRecord.error_message || 'Sequence executed.'}
              </p>
            </div>

            {/* Input Sequence */}
            <div>
              <div className="text-[11px] uppercase font-mono text-slate-400 mb-1.5">
                Input Sequence Evaluated
              </div>
              <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-navy-950 border border-slate-800 font-mono text-xs">
                {selectedRecord.input_sequence.map((sym, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50 text-electric-cyan font-bold"
                  >
                    {sym}
                  </span>
                ))}
              </div>
            </div>

            {/* Transition Trace */}
            <div>
              <div className="text-[11px] uppercase font-mono text-slate-400 mb-2">
                Discrete Transition Trace: δ(q, σ) → q'
              </div>
              <div className="space-y-2">
                {selectedRecord.transition_trace.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-navy-950 border border-slate-800 text-xs font-mono flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-bold">#{step.step_number}</span>
                      <span className="text-cyan-400 font-semibold">{step.from_state_label}</span>
                      <span className="text-slate-500">⎯[{step.input_symbol}]➔</span>
                      <span className="text-purple-300 font-semibold">{step.to_state_label}</span>
                    </div>
                    {step.is_final && (
                      <span className="text-[10px] font-bold text-purple-400 px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/50">
                        Final State (F)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

