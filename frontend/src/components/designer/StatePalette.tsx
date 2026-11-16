import React from 'react';
import { PlayCircle, Circle, CheckCircle2, GitBranch, Plus, MousePointerClick, Move } from 'lucide-react';
import { StateType } from '../../types';

interface StatePaletteProps {
  onAddNode: (type: StateType) => void;
}

export const StatePalette: React.FC<StatePaletteProps> = ({ onAddNode }) => {
  const onDragStart = (event: React.DragEvent, nodeType: StateType) => {
    event.dataTransfer.setData('application/reactflow-type', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const stencils: Array<{
    type: StateType;
    label: string;
    sublabel: string;
    icon: any;
    color: string;
    border: string;
    bg: string;
  }> = [
    {
      type: 'initial',
      label: 'Initial State',
      sublabel: 'q₀ Start node',
      icon: PlayCircle,
      color: 'text-emerald-400',
      border: 'border-emerald-500/30 hover:border-emerald-500/70',
      bg: 'bg-emerald-950/20 hover:bg-emerald-950/40',
    },
    {
      type: 'normal',
      label: 'Normal State',
      sublabel: 'Intermediate step',
      icon: Circle,
      color: 'text-cyan-400',
      border: 'border-slate-800 hover:border-cyan-500/60',
      bg: 'bg-slate-900/60 hover:bg-slate-900',
    },
    {
      type: 'final',
      label: 'Final State',
      sublabel: 'F Accepting node',
      icon: CheckCircle2,
      color: 'text-purple-400',
      border: 'border-purple-500/30 hover:border-purple-500/70',
      bg: 'bg-purple-950/20 hover:bg-purple-950/40',
    },
    {
      type: 'conditional',
      label: 'Conditional',
      sublabel: 'Branching decision',
      icon: GitBranch,
      color: 'text-amber-400',
      border: 'border-amber-500/30 hover:border-amber-500/70',
      bg: 'bg-amber-950/20 hover:bg-amber-950/40',
    },
  ];

  return (
    <aside className="w-56 border-r border-slate-800 bg-[#070b14] p-3.5 flex flex-col justify-between select-none">
      <div>
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-3 px-1">
          <span>State Stencils</span>
          <Move className="w-3 h-3 text-slate-500" />
        </div>

        <p className="text-[10px] text-slate-500 px-1 mb-3">
          Click or drag onto canvas to place new state node:
        </p>

        <div className="space-y-2">
          {stencils.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => onDragStart(e, item.type)}
                onClick={() => onAddNode(item.type)}
                className={`p-2.5 rounded-xl border ${item.border} ${item.bg} cursor-grab active:cursor-grabbing transition-all text-left group shadow-sm`}
                title={`Click or drag to add ${item.label}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${item.color} shrink-0`} />
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                      {item.label}
                    </span>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5 ml-6">
                  {item.sublabel}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Helpful Hint */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[10px] text-slate-400 space-y-1.5">
        <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
          <MousePointerClick className="w-3.5 h-3.5" />
          <span>Quick Connection</span>
        </div>
        <p className="leading-relaxed">
          Drag from any handle dot (Left, Right, Top, Bottom) to connect states with directed transitions.
        </p>
      </div>
    </aside>
  );
};

