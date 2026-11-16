import React, { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { PlayCircle, CheckCircle2, GitBranch, Circle, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { StateType } from '../../types';

interface StateNodeData {
  id: string;
  label: string;
  type?: StateType;
  description?: string;
  action?: string;
  isActive?: boolean;
}

export const CustomStateNode: React.FC<NodeProps> = memo(({ id, data, selected }) => {
  const nodeData = data as unknown as StateNodeData;
  const stateType: StateType = nodeData.type || 'normal';
  const isActive = nodeData.isActive || false;

  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(nodeData.label || id);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLabelValue(nodeData.label || id);
  }, [nodeData.label, id]);

  useEffect(() => {
    if (isEditingLabel) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditingLabel]);

  const handleLabelSubmit = () => {
    setIsEditingLabel(false);
    if (nodeData) {
      nodeData.label = labelValue.trim() || id;
    }
  };

  const isInitial = stateType === 'initial';
  const isFinal = stateType === 'final';
  const isConditional = stateType === 'conditional';

  return (
    <div
      className={clsx(
        'relative group min-w-[190px] max-w-[240px] rounded-xl transition-all duration-200 select-none p-3.5',
        // Solid professional dark background
        'bg-[#0b1222] border text-slate-100 shadow-lg',
        // Clean semantic borders
        isInitial && !isActive && 'border-emerald-500/40 hover:border-emerald-500/80',
        isFinal && !isActive && 'border-purple-500/50 hover:border-purple-400',
        isConditional && !isActive && 'border-amber-500/40 hover:border-amber-400',
        !isInitial && !isFinal && !isConditional && !isActive && 'border-slate-800 hover:border-slate-700',
        // Selected state
        selected && !isActive && 'border-cyan-400 ring-1 ring-cyan-400/50 shadow-cyan-950/50 shadow-xl',
        // Active in simulation
        isActive && 'border-cyan-400 ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#060a14] bg-[#0c1933]'
      )}
    >
      {/* Automata Double Border for Final/Accepting State */}
      {isFinal && (
        <div
          className={clsx(
            'absolute -inset-1 rounded-[15px] border border-purple-500/30 pointer-events-none',
            isActive && 'border-cyan-400/60 animate-pulse'
          )}
        />
      )}

      {/* Target Connection Handles (Left and Top) */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="!w-2.5 !h-2.5 !-left-1.5 !bg-cyan-400 !border-2 !border-[#060a14] hover:!w-3 hover:!h-3 transition-all"
        title="Incoming transition handle"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        className="!w-2.5 !h-2.5 !-top-1.5 !bg-cyan-400 !border-2 !border-[#060a14] hover:!w-3 hover:!h-3 transition-all"
        title="Incoming transition handle (Top)"
      />

      {/* Source Connection Handles (Right and Bottom) */}
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className="!w-2.5 !h-2.5 !-right-1.5 !bg-blue-400 !border-2 !border-[#060a14] hover:!w-3 hover:!h-3 transition-all"
        title="Outgoing transition handle"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        className="!w-2.5 !h-2.5 !-bottom-1.5 !bg-blue-400 !border-2 !border-[#060a14] hover:!w-3 hover:!h-3 transition-all"
        title="Outgoing transition handle (Bottom)"
      />

      {/* Node Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          {isInitial && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-800/50">
              <PlayCircle className="w-3 h-3 text-emerald-400" /> q₀ Start
            </span>
          )}
          {isFinal && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-950/80 text-purple-300 border border-purple-800/50">
              <CheckCircle2 className="w-3 h-3 text-purple-400" /> F Final
            </span>
          )}
          {isConditional && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-800/50">
              <GitBranch className="w-3 h-3 text-amber-400" /> Branch
            </span>
          )}
          {!isInitial && !isFinal && !isConditional && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-wider bg-slate-900 text-slate-400 border border-slate-800">
              <Circle className="w-2.5 h-2.5 text-slate-500" /> State
            </span>
          )}
        </div>

        {/* State ID pill */}
        <span className="text-[10px] font-mono font-semibold text-slate-400 px-1.5 py-0.5 rounded bg-black/40 border border-slate-800">
          {id}
        </span>
      </div>

      {/* State Label with inline double-click editing */}
      {isEditingLabel ? (
        <input
          ref={inputRef}
          type="text"
          value={labelValue}
          onChange={(e) => setLabelValue(e.target.value)}
          onBlur={handleLabelSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleLabelSubmit();
            if (e.key === 'Escape') setIsEditingLabel(false);
          }}
          className="w-full px-1.5 py-0.5 bg-black/70 border border-cyan-400 rounded text-xs font-semibold text-slate-100 focus:outline-none"
        />
      ) : (
        <div
          onDoubleClick={() => setIsEditingLabel(true)}
          title="Double click to edit label"
          className="font-semibold text-xs text-slate-100 hover:text-cyan-300 transition-colors leading-snug cursor-text"
        >
          {nodeData.label || id}
        </div>
      )}

      {/* State Description */}
      {nodeData.description && (
        <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mt-1">
          {nodeData.description}
        </div>
      )}

      {/* Entry Action Badge */}
      {nodeData.action && (
        <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center gap-1 text-[10px] text-slate-400 font-mono">
          <span className="text-cyan-400 font-bold">λ:</span>
          <span className="truncate">{nodeData.action}</span>
        </div>
      )}

      {/* Active Simulation Status Indicator */}
      {isActive && (
        <div className="mt-2.5 flex items-center justify-center gap-1.5 py-1 px-2 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-[10px] font-mono font-bold tracking-wider uppercase animate-pulse">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          ACTIVE STATE
        </div>
      )}
    </div>
  );
});

CustomStateNode.displayName = 'CustomStateNode';
