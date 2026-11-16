import React from 'react';
import {
  Layers,
  LayoutDashboard,
  Cpu,
  Binary,
  History,
  Workflow,
  Plus,
  ChevronDown,
  Sparkles,
  GitFork,
  Radio,
} from 'lucide-react';
import clsx from 'clsx';
import { WorkflowItem } from '../types';

interface NavbarProps {
  activeTab: 'dashboard' | 'designer' | 'simulator' | 'analysis' | 'history';
  setActiveTab: (tab: 'dashboard' | 'designer' | 'simulator' | 'analysis' | 'history') => void;
  currentWorkflowName?: string;
  workflows: WorkflowItem[];
  onSelectWorkflow: (id: string) => void;
  onCreateNewWorkflow: () => void;
  isBackendConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentWorkflowName,
  workflows,
  onSelectWorkflow,
  onCreateNewWorkflow,
  isBackendConnected,
}) => {
  return (
    <header className="h-16 border-b border-white/[0.07] bg-[#050811]/75 backdrop-blur-2xl sticky top-0 z-50 flex items-center justify-between px-6 select-none transition-all">
      {/* Brand & Formal Engine Badge */}
      <div className="flex items-center gap-3.5">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/15 via-blue-600/10 to-transparent border border-cyan-500/25 shadow-[0_0_12px_rgba(0,210,255,0.15)]">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-tight text-white font-sans">
              FlowState
            </span>
            <span className="text-[9px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/20 font-semibold shadow-inner">
              DFA Engine
            </span>
          </div>

          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono mt-0.5">
            <span className="text-slate-400">M = (Q, Σ, δ, q₀, F)</span>
            <span className="text-slate-600">•</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-sans font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {isBackendConnected ? 'Active' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Floating Segmented Nav Control (Linear / Raycast Style) */}
      <nav className="flex items-center gap-1 bg-[#0a1020]/80 backdrop-blur-xl p-1 rounded-full border border-white/[0.08] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'designer', label: 'Designer', icon: Workflow },
          { id: 'simulator', label: 'Simulator', icon: Cpu },
          { id: 'analysis', label: 'Formal Analysis', icon: Binary },
          { id: 'history', label: 'Audit Log', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={clsx(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-b from-white/[0.12] to-white/[0.04] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] border border-white/[0.12]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              )}
            >
              <Icon
                className={clsx(
                  'w-3.5 h-3.5 transition-colors',
                  isActive ? 'text-cyan-400' : 'text-slate-400'
                )}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Controls: Workflow Switcher & New Workflow Action */}
      <div className="flex items-center gap-3">
        {/* Workflow Switcher Dropdown */}
        <div className="relative group">
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#0a1020]/80 border border-white/[0.08] text-xs cursor-pointer hover:border-cyan-500/30 transition-all shadow-sm">
            <GitFork className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-200 max-w-[150px] truncate font-medium">
              {currentWorkflowName || 'Select Workflow'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-500 group-hover:rotate-180 transition-transform duration-200" />
          </div>

          <div className="absolute right-0 mt-2 w-72 py-2.5 bg-[#0a1020]/95 backdrop-blur-2xl border border-white/[0.1] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 z-50">
            <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center justify-between">
              <span>Workflows & Blueprints</span>
              <span>{workflows.length} Total</span>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-white/[0.04] mt-1 px-1.5">
              {workflows.map((wf) => (
                <button
                  key={wf.id}
                  onClick={() => onSelectWorkflow(wf.id)}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-white/[0.06] flex items-center justify-between group/item transition-all"
                >
                  <div className="truncate pr-2">
                    <div className="font-semibold text-slate-200 group-hover/item:text-cyan-300 truncate">
                      {wf.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {wf.category} • {wf.total_states} states • {wf.total_transitions} transitions
                    </div>
                  </div>
                  {wf.is_template && (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/40 shrink-0">
                      Preset
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* High-Craft New Workflow Button */}
        <button
          onClick={onCreateNewWorkflow}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-cyan-300 bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-purple-500/15 hover:from-cyan-500/30 hover:via-blue-500/25 hover:to-purple-500/25 border border-cyan-500/35 hover:border-cyan-400/60 transition-all shadow-[0_0_15px_rgba(0,210,255,0.12)] active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Workflow</span>
        </button>
      </div>
    </header>
  );
};
