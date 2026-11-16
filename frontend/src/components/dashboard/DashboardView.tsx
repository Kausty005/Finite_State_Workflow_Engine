import React, { useState, useEffect } from 'react';
import {
  Layers,
  CheckCircle2,
  XCircle,
  Activity,
  Plus,
  Play,
  Workflow,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  FolderGit2,
} from 'lucide-react';
import clsx from 'clsx';
import { api } from '../../services/api';
import { DashboardStats, WorkflowItem } from '../../types';

interface DashboardViewProps {
  workflows: WorkflowItem[];
  onOpenWorkflow: (id: string, targetTab?: 'designer' | 'simulator') => void;
  onCreateNewWorkflow: () => void;
  onRefreshWorkflows: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  workflows,
  onOpenWorkflow,
  onCreateNewWorkflow,
  onRefreshWorkflows,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load dashboard stats:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 select-none">
      {/* Top Banner */}
      <div className="relative overflow-hidden p-7 rounded-2xl glass-panel shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-slate-900/80 text-cyan-400 border border-slate-700/60 font-semibold">
                Automata Theory Engine
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-[11px] font-mono text-slate-400">Formal DFA Platform</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Deterministic Finite State Automata
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Design, formally verify, simulate, and execute deterministic state machines with
              mathematical correctness based on M = (Q, Σ, δ, q₀, F).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onCreateNewWorkflow}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[#060a14] bg-cyan-400 hover:bg-cyan-300 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Workflow</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Workflows */}
        <div className="p-5 rounded-xl glass-card space-y-2.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase font-mono tracking-wider">
              Total Workflows
            </span>
            <Workflow className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {stats?.total_workflows ?? workflows.length}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>{stats?.templates_count ?? 3} templates active</span>
          </div>
        </div>

        {/* Accepted Executions */}
        <div className="p-5 rounded-xl glass-card space-y-2.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase font-mono tracking-wider">
              Accepted Runs (q ∈ F)
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {stats?.successful_executions ?? 0}
          </div>
          <div className="text-[11px] text-emerald-400/80 flex items-center gap-1 font-mono">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Formal language accepted</span>
          </div>
        </div>

        {/* Rejected Executions */}
        <div className="p-5 rounded-xl glass-card space-y-2.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase font-mono tracking-wider">
              Rejected Runs
            </span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {stats?.failed_executions ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            <span>Invalid input or crash</span>
          </div>
        </div>

        {/* Total Simulations */}
        <div className="p-5 rounded-xl glass-card space-y-2.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase font-mono tracking-wider">
              Total Executions
            </span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {stats?.total_executions ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            <span>Persistent audit logs</span>
          </div>
        </div>

        {/* Determinism */}
        <div className="p-5 rounded-xl glass-card space-y-2.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase font-mono tracking-wider">
              Determinism
            </span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400 font-mono">
            100.0%
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            <span>Strict DFA validation</span>
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflows Catalog */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">
                Workflows & Production Templates
              </h2>
            </div>
            <button
              onClick={onRefreshWorkflows}
              className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
            >
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflows.map((wf) => (
              <div
                key={wf.id}
                className="p-5 rounded-xl glass-card flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900/80 text-cyan-400 border border-slate-700/60">
                      {wf.category || 'General'}
                    </span>
                    {wf.is_template && (
                      <span className="text-[10px] font-mono text-purple-400 px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/40">
                        Template
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors mb-1">
                    {wf.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {wf.description || 'Finite state automaton configuration.'}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-[11px] font-mono text-slate-500">
                    <span>{wf.total_states} States</span>
                    <span>•</span>
                    <span>{wf.total_transitions} Transitions</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onOpenWorkflow(wf.id, 'designer')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-xs font-semibold text-slate-200 transition-colors"
                  >
                    <Workflow className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Open Designer</span>
                  </button>

                  <button
                    onClick={() => onOpenWorkflow(wf.id, 'simulator')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/50 text-xs font-semibold text-purple-300 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Simulate</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">
              Recent Automata Executions
            </h2>
          </div>

          <div className="p-4 rounded-xl glass-panel space-y-3">
            {stats?.recent_activities && stats.recent_activities.length > 0 ? (
              <div className="space-y-2.5">
                {stats.recent_activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-lg bg-[#060a14]/80 border border-slate-800/80 text-xs font-mono flex items-center justify-between hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-200 truncate max-w-[150px]">
                        {act.workflow_name}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {act.time} • {act.duration_ms}ms
                      </div>
                    </div>
                    <span
                      className={clsx(
                        'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                        act.is_accepted
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                          : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                      )}
                    >
                      {act.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500 italic">
                No executions recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
