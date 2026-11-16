import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps,
} from '@xyflow/react';
import clsx from 'clsx';

export const CustomTransitionEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  selected,
  animated,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeData = (data as any) || {};
  const event = edgeData.event || 'ε';
  const condition = edgeData.condition;
  const isActive = edgeData.isActive || false;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        className={clsx(
          'transition-all duration-300',
          isActive && 'stroke-electric-cyan stroke-[3.5px] animate-pulse',
          selected && !isActive && 'stroke-electric-blue stroke-[3px]',
          !selected && !isActive && 'stroke-slate-500/70 hover:stroke-cyan-400 stroke-2'
        )}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div
            className={clsx(
              'flex flex-col items-center justify-center px-2 py-1 rounded-lg transition-all duration-200 cursor-pointer shadow-lg',
              'bg-navy-900/95 backdrop-blur-md border text-center',
              isActive
                ? 'border-electric-cyan bg-cyan-950/90 text-cyan-200 shadow-[0_0_12px_rgba(0,245,212,0.4)] scale-110'
                : selected
                ? 'border-electric-blue bg-blue-950/80 text-blue-200'
                : 'border-slate-700/60 hover:border-cyan-500/50 text-slate-300'
            )}
          >
            <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-electric-cyan">
              <span className="text-[10px] text-slate-400">σ:</span>
              <span>{event}</span>
            </div>

            {condition && (
              <div className="text-[9px] text-slate-400 font-sans mt-0.5 max-w-[120px] truncate">
                [{condition}]
              </div>
            )}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

