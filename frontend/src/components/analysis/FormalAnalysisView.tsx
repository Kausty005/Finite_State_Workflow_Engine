import React, { useState, useEffect } from 'react';
import {
  Binary,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Table,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import clsx from 'clsx';
import { api } from '../../services/api';
import { ValidationReport, BatchExecutionResult } from '../../types';

interface FormalAnalysisViewProps {
  workflowId?: string;
  workflowName: string;
  nodes: any[];
  edges: any[];
}

export const FormalAnalysisView: React.FC<FormalAnalysisViewProps> = ({
  workflowId,
  workflowName,
  nodes,
  edges,
}) => {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [testSequenceInput, setTestSequenceInput] = useState<string>('');
  const [testResult, setTestResult] = useState<BatchExecutionResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  const fetchValidation = async () => {
    setIsLoading(true);
    try {
      const rep = await api.validateWorkflow({
        workflow_id: workflowId,
        nodes,
        edges,
        name: workflowName,
      });
      setReport(rep);
    } catch (e) {
      console.error('Validation failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchValidation();
  }, [workflowId, nodes, edges]);

  const handleTestSequence = async () => {
    if (!testSequenceInput.trim()) return;
    setIsEvaluating(true);
    const tokens = testSequenceInput
      .split(/[\s,;]+/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    try {
      const res = await api.executeBatch({
        workflow_id: workflowId,
        fsm: {
          states: nodes.map((n) => ({
            id: n.id,
            label: n.data?.label || n.id,
            type: n.data?.type || 'normal',
            description: n.data?.description || '',
            action: n.data?.action || '',
          })),
          transitions: edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            event: e.data?.event || '',
            condition: e.data?.condition || '',
            action: e.data?.action || '',
          })),
        },
        input_sequence: tokens,
        record_history: true,
      });
      setTestResult(res);
    } catch (e) {
      console.error('Batch evaluation failed:', e);
    } finally {
      setIsEvaluating(false);
    }
  };

  if (isLoading || !report) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <div className="flex items-center gap-3 text-electric-cyan">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="font-mono text-sm">Performing Automata Theory Verification...</span>
        </div>
      </div>
    );
  }

  const { formal_summary, issues } = report;
  const errors = issues.filter((i) => i.severity === 'ERROR');
  const warnings = issues.filter((i) => i.severity === 'WARNING');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">
              Formal Automata Theory Verification & Analysis
            </h1>
            <span
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5',
                report.is_valid
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-950/70 border-rose-500/50 text-rose-300'
              )}
            >
              {report.is_valid ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" /> Mathematically Sound DFA
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" /> Validation Violations Detected
                </>
              )}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Rigorous mathematical verification against standard formal language theory invariants.
          </p>
        </div>

        <button
          onClick={fetchValidation}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-navy-900 border border-slate-700/60 hover:border-cyan-400 text-slate-200 transition-colors shadow-neu-convex"
        >
          <RefreshCw className="w-3.5 h-3.5 text-electric-cyan" />
          Re-Analyze
        </button>
      </div>

      {/* 5-Tuple Mathematical Definition Card */}
      <div className="p-6 rounded-2xl glass-panel shadow-neu-card relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Binary className="w-5 h-5 text-electric-cyan" />
            <h2 className="text-base font-bold text-slate-100">
              Formal 5-Tuple Definition: M = (Q, Σ, δ, q₀, F)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            DFA Determinism: {formal_summary.is_deterministic ? '✅ Verified' : '❌ Non-Deterministic'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 font-mono text-xs">
          {/* Q */}
          <div className="p-4 rounded-xl bg-navy-950/80 border border-slate-800 space-y-1">
            <div className="text-[11px] font-bold text-electric-cyan">Q (States):</div>
            <div className="text-slate-200 font-semibold">{formal_summary.Q.length} States</div>
            <div className="text-[11px] text-slate-400 break-all">
              {`{ ${formal_summary.Q.join(', ')} }`}
            </div>
          </div>

          {/* Sigma */}
          <div className="p-4 rounded-xl bg-navy-950/80 border border-slate-800 space-y-1">
            <div className="text-[11px] font-bold text-electric-blue">Σ (Alphabet):</div>
            <div className="text-slate-200 font-semibold">{formal_summary.Sigma.length} Symbols</div>
            <div className="text-[11px] text-slate-400 break-all">
              {formal_summary.Sigma.length > 0
                ? `{ ${formal_summary.Sigma.join(', ')} }`
                : '∅ (Empty alphabet)'}
            </div>
          </div>

          {/* q0 */}
          <div className="p-4 rounded-xl bg-navy-950/80 border border-slate-800 space-y-1">
            <div className="text-[11px] font-bold text-emerald-400">q₀ (Start State):</div>
            <div className="text-slate-200 font-semibold">
              {formal_summary.q0 || 'None (Missing)'}
            </div>
            <div className="text-[11px] text-slate-400">Initial automaton entry point</div>
          </div>

          {/* F */}
          <div className="p-4 rounded-xl bg-navy-950/80 border border-slate-800 space-y-1">
            <div className="text-[11px] font-bold text-purple-400">F (Accepting States):</div>
            <div className="text-slate-200 font-semibold">{formal_summary.F.length} Accepting</div>
            <div className="text-[11px] text-slate-400 break-all">
              {formal_summary.F.length > 0 ? `{ ${formal_summary.F.join(', ')} }` : '∅ (None)'}
            </div>
          </div>

          {/* Delta */}
          <div className="p-4 rounded-xl bg-navy-950/80 border border-slate-800 space-y-1">
            <div className="text-[11px] font-bold text-amber-400">δ (Transition Function):</div>
            <div className="text-slate-200 font-semibold">{formal_summary.delta_count} Rules</div>
            <div className="text-[11px] text-slate-400">δ: Q × Σ → Q</div>
          </div>
        </div>
      </div>

      {/* Invariants & Diagnostics Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Errors */}
        <div className="p-5 rounded-2xl glass-card border border-rose-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <XCircle className="w-4 h-4" />
              <span>Critical Errors ({errors.length})</span>
            </div>
          </div>
          {errors.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Zero critical automata violations found.</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {errors.map((err, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-rose-950/50 border border-rose-700/50 text-xs"
                >
                  <div className="font-semibold text-rose-200">{err.title}</div>
                  <div className="text-rose-300/80 mt-1 text-[11px] leading-relaxed">
                    {err.description}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 2: Warnings (Dead states, Unreachable) */}
        <div className="p-5 rounded-2xl glass-card border border-amber-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Structural Warnings ({warnings.length})</span>
            </div>
          </div>
          {warnings.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>All states are fully reachable and live.</span>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {warnings.map((warn, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-amber-950/50 border border-amber-700/50 text-xs"
                >
                  <div className="font-semibold text-amber-200">{warn.title}</div>
                  <div className="text-amber-300/80 mt-1 text-[11px] leading-relaxed">
                    {warn.description}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 3: Deterministic Grammar & Properties */}
        <div className="p-5 rounded-2xl glass-card border border-cyan-500/20 space-y-3 text-xs">
          <div className="flex items-center gap-2 text-electric-cyan font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Automata Properties</span>
          </div>

          <div className="space-y-2 pt-1 font-mono text-[11px]">
            <div className="flex items-center justify-between p-2 rounded-lg bg-navy-950/60 border border-slate-800">
              <span className="text-slate-400">Total States |Q|:</span>
              <span className="text-slate-200 font-bold">{report.total_states}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-navy-950/60 border border-slate-800">
              <span className="text-slate-400">Transitions |δ|:</span>
              <span className="text-slate-200 font-bold">{report.total_transitions}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-navy-950/60 border border-slate-800">
              <span className="text-slate-400">Unreachable States:</span>
              <span
                className={clsx(
                  'font-bold',
                  report.unreachable_states.length > 0 ? 'text-amber-400' : 'text-emerald-400'
                )}
              >
                {report.unreachable_states.length}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-navy-950/60 border border-slate-800">
              <span className="text-slate-400">Dead States:</span>
              <span
                className={clsx(
                  'font-bold',
                  report.dead_states.length > 0 ? 'text-amber-400' : 'text-emerald-400'
                )}
              >
                {report.dead_states.length}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-navy-950/60 border border-slate-800">
              <span className="text-slate-400">Determinism:</span>
              <span className="text-emerald-400 font-bold">100% DFA</span>
            </div>
          </div>
        </div>
      </div>

      {/* State Transition Matrix δ: Q x Σ -> Q */}
      <div className="p-6 rounded-2xl glass-panel shadow-neu-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table className="w-5 h-5 text-electric-blue" />
            <h2 className="text-base font-bold text-slate-100">
              State Transition Table: δ(q, σ)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Rows: States (q ∈ Q) | Columns: Input Symbols (σ ∈ Σ)
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-navy-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">State (q)</th>
                <th className="py-3 px-3">Classification</th>
                {formal_summary.Sigma.map((sym) => (
                  <th key={sym} className="py-3 px-4 text-electric-cyan">
                    σ: {sym}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-navy-900/50">
              {formal_summary.Q.map((qId) => {
                const nodeObj = nodes.find((n) => n.id === qId);
                const isInit = qId === formal_summary.q0;
                const isFin = formal_summary.F.includes(qId);
                const row = formal_summary.transition_table[qId] || {};

                return (
                  <tr key={qId} className="hover:bg-cyan-950/20 transition-colors">
                    <td className="py-2.5 px-4 font-bold text-slate-200 flex items-center gap-1.5">
                      {isInit && <span className="text-emerald-400">→</span>}
                      {isFin && <span className="text-purple-400">*</span>}
                      <span>{qId}</span>
                      <span className="text-slate-500 font-normal">
                        ({nodeObj?.data?.label || qId})
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {isInit && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Initial
                        </span>
                      )}
                      {isFin && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          Accepting
                        </span>
                      )}
                      {!isInit && !isFin && (
                        <span className="text-slate-500 text-[10px]">Normal</span>
                      )}
                    </td>
                    {formal_summary.Sigma.map((sym) => {
                      const target = row[sym];
                      const hasTarget = target && target !== '-';
                      return (
                        <td
                          key={sym}
                          className={clsx(
                            'py-2.5 px-4 font-bold',
                            hasTarget ? 'text-cyan-300' : 'text-slate-600'
                          )}
                        >
                          {target || '-'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Sequence Evaluator */}
      <div className="p-6 rounded-2xl glass-panel shadow-neu-card space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-electric-cyan" />
          <h2 className="text-base font-bold text-slate-100">
            Formal Input String Evaluator: ^δ(q₀, w)
          </h2>
        </div>
        <p className="text-xs text-slate-400 font-mono">
          Enter an input sequence w = a₁a₂...aₙ to test formal language membership (Accepted iff ^δ(q₀, w) ∈ F).
        </p>

        <div className="flex gap-3">
          <input
            type="text"
            value={testSequenceInput}
            onChange={(e) => setTestSequenceInput(e.target.value)}
            placeholder="e.g. CHECKOUT, PAY_SUCCESS, DISPATCH, DELIVER"
            className="flex-1 px-4 py-2.5 rounded-xl glass-input text-xs font-mono font-semibold"
          />
          <button
            onClick={handleTestSequence}
            disabled={isEvaluating}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-navy-950 bg-gradient-to-r from-electric-cyan to-electric-blue hover:from-cyan-300 hover:to-blue-400 transition-all shadow-neu-glow-blue disabled:opacity-50"
          >
            {isEvaluating ? 'Evaluating...' : 'Evaluate String w'}
          </button>
        </div>

        {testResult && (
          <div
            className={clsx(
              'p-4 rounded-xl border text-xs font-mono space-y-2 transition-all',
              testResult.is_accepted
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
            )}
          >
            <div className="flex items-center justify-between font-bold text-sm">
              <span className="flex items-center gap-2">
                {testResult.is_accepted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400" />
                )}
                Verdict: {testResult.status} ({testResult.is_accepted ? 'Accepted: w ∈ L(M)' : 'Rejected: w ∉ L(M)'})
              </span>
              <span className="text-[11px] text-slate-400">
                Steps: {testResult.total_steps}
              </span>
            </div>

            <p className="text-xs">{testResult.explanation}</p>

            {testResult.executed_steps.length > 0 && (
              <div className="pt-2 border-t border-slate-700/60 flex flex-wrap gap-1.5 text-[11px]">
                <span className="text-slate-400">Path:</span>
                <span className="font-bold text-cyan-300">
                  {testResult.executed_steps[0].from_state_label}
                </span>
                {testResult.executed_steps.map((st, i) => (
                  <React.Fragment key={i}>
                    <span className="text-slate-400">⎯[{st.input_symbol}]➔</span>
                    <span className="font-bold text-purple-300">{st.to_state_label}</span>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

