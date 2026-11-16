import React from 'react';
import {
  Sliders,
  Trash2,
  X,
  Zap,
  Info,
  CheckCircle2,
  PlayCircle,
  GitBranch,
  Circle,
  ArrowRight,
} from 'lucide-react';
import { StateType } from '../../types';

interface PropertiesSidebarProps {
  selectedNode: any | null;
  selectedEdge: any | null;
  onUpdateNodeData: (nodeId: string, newData: any) => void;
  onUpdateEdgeData: (edgeId: string, newData: any) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  onClose: () => void;
}

export const PropertiesSidebar: React.FC<PropertiesSidebarProps> = ({
  selectedNode,
  selectedEdge,
  onUpdateNodeData,
  onUpdateEdgeData,
  onDeleteNode,
  onDeleteEdge,
  onClose,
}) => {
  if (!selectedNode && !selectedEdge) {
    return (
      <aside className="w-80 border-l border-slate-800 bg-[#070b14] p-5 flex flex-col justify-between select-none">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs uppercase tracking-wider font-mono">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Inspector & Properties</span>
          </div>

          <div className="p-4 rounded-xl bg-[#0b1222] border border-slate-800 text-xs text-slate-400 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-medium">
              <Info className="w-3.5 h-3.5" />
              <span>Canvas Guide</span>
            </div>
            <p className="leading-relaxed">
              Click any state node or transition edge on the canvas to configure its formal automata properties.
            </p>
            <div className="space-y-2 pt-2 border-t border-slate-800 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span><strong className="text-slate-200">Initial State (q₀):</strong> Automaton entry point</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span><strong className="text-slate-200">Normal State:</strong> Intermediate processing step</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                <span><strong className="text-slate-200">Final State (F):</strong> Valid accepting terminal state</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span><strong className="text-slate-200">Conditional:</strong> Decision/branching point</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#0b1222] border border-slate-800 text-[11px] text-slate-400 font-mono">
          <div className="text-cyan-400 font-bold mb-1">DFA Guarantee:</div>
          <div>∀ q ∈ Q, σ ∈ Σ : |δ(q, σ)| ≤ 1</div>
          <div className="text-[10px] text-slate-500 mt-1">Deterministic state transitions strictly enforced.</div>
        </div>
      </aside>
    );
  }

  // Selected State Node
  if (selectedNode) {
    const data = selectedNode.data || {};
    const stateType: StateType = data.type || 'normal';

    return (
      <aside className="w-80 border-l border-slate-800 bg-[#070b14] p-5 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-200 font-mono">
                State Properties
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* State ID */}
          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              State Key (q_id)
            </label>
            <input
              type="text"
              value={selectedNode.id}
              disabled
              className="w-full px-3 py-1.5 rounded-lg bg-[#060a14] border border-slate-800 font-mono text-xs text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* State Label */}
          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              State Label
            </label>
            <input
              type="text"
              value={data.label || ''}
              onChange={(e) => onUpdateNodeData(selectedNode.id, { label: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#0b1222] border border-slate-800 text-xs font-semibold text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="e.g. Payment Pending"
            />
          </div>

          {/* State Classification */}
          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
              Automata Classification
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'initial', label: 'Initial (q₀)', icon: PlayCircle, color: 'text-emerald-400' },
                { type: 'normal', label: 'Normal', icon: Circle, color: 'text-cyan-400' },
                { type: 'final', label: 'Final (F)', icon: CheckCircle2, color: 'text-purple-400' },
                { type: 'conditional', label: 'Conditional', icon: GitBranch, color: 'text-amber-400' },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = stateType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => onUpdateNodeData(selectedNode.id, { type: opt.type })}
                    className={`flex items-center gap-1.5 p-2 rounded-xl text-[11px] font-medium border text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/80 text-white'
                        : 'bg-[#0b1222] border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${opt.color}`} />
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={data.description || ''}
              onChange={(e) => onUpdateNodeData(selectedNode.id, { description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#0b1222] border border-slate-800 text-xs text-slate-200 resize-none focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="Operational details or business purpose..."
            />
          </div>

          {/* Entry Action */}
          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              Entry Action / Payload (λ)
            </label>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
              <input
                type="text"
                value={data.action || ''}
                onChange={(e) => onUpdateNodeData(selectedNode.id, { action: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#0b1222] border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="e.g. Lock Inventory"
              />
            </div>
          </div>
        </div>

        {/* Delete button */}
        <div className="pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => onDeleteNode(selectedNode.id)}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs font-semibold hover:bg-rose-900/40 hover:border-rose-700 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete State
          </button>
        </div>
      </aside>
    );
  }

  // Selected Transition Edge
  const edgeData = selectedEdge.data || {};
  return (
    <aside className="w-80 border-l border-slate-800 bg-[#070b14] p-5 flex flex-col justify-between overflow-y-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-xs uppercase tracking-wider text-slate-200 font-mono">
              Transition δ(q, σ)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mapping info */}
        <div className="p-3 rounded-xl bg-[#0b1222] border border-slate-800 text-xs font-mono space-y-1">
          <div className="text-slate-400 text-[10px] uppercase tracking-wider">Formal Mapping</div>
          <div className="text-cyan-300 font-bold flex items-center gap-1.5">
            <span>{selectedEdge.source}</span>
            <span className="text-slate-500">⎯[{edgeData.event || 'σ'}]➔</span>
            <span>{selectedEdge.target}</span>
          </div>
        </div>

        {/* Input Symbol σ */}
        <div>
          <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
            Input Symbol (σ ∈ Σ) <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={edgeData.event || ''}
            onChange={(e) =>
              onUpdateEdgeData(selectedEdge.id, {
                event: e.target.value.toUpperCase().replace(/\s+/g, '_'),
              })
            }
            className="w-full px-3 py-2 rounded-xl bg-[#0b1222] border border-slate-800 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500 transition-colors"
            placeholder="e.g. PAY_SUCCESS"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Deterministic symbol triggering this state change.
          </p>
        </div>

        {/* Guard Condition */}
        <div>
          <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
            Guard Condition / Rule
          </label>
          <input
            type="text"
            value={edgeData.condition || ''}
            onChange={(e) => onUpdateEdgeData(selectedEdge.id, { condition: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-[#0b1222] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
            placeholder="e.g. Cart items in stock"
          />
        </div>

        {/* Action Trigger */}
        <div>
          <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
            Transition Action
          </label>
          <input
            type="text"
            value={edgeData.action || ''}
            onChange={(e) => onUpdateEdgeData(selectedEdge.id, { action: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-[#0b1222] border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
            placeholder="e.g. Capture Payment"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={() => onDeleteEdge(selectedEdge.id)}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs font-semibold hover:bg-rose-900/40 hover:border-rose-700 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete Transition
        </button>
      </div>
    </aside>
  );
};
