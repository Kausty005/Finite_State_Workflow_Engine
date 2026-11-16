import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  FastForward,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Terminal,
  Activity,
  Zap,
} from 'lucide-react';
import {
  ReactFlow,
  Controls,
  Background,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import confetti from 'canvas-confetti';
import clsx from 'clsx';

import { CustomStateNode } from '../nodes/CustomStateNode';
import { CustomTransitionEdge } from '../edges/CustomTransitionEdge';
import { api } from '../../services/api';
import { TransitionStepResult, ExecutionStatus } from '../../types';

interface ExecutionSimulatorProps {
  workflowId?: string;
  workflowName: string;
  initialNodes: Node[];
  initialEdges: Edge[];
}

export const ExecutionSimulator: React.FC<ExecutionSimulatorProps> = ({
  workflowId,
  workflowName,
  initialNodes,
  initialEdges,
}) => {
  // Simulator state
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const [currentStateId, setCurrentStateId] = useState<string | null>(null);
  const [activeEdgeId, setActiveEdgeId] = useState<string | null>(null);
  const [status, setStatus] = useState<ExecutionStatus>('IDLE');
  const [executedSteps, setExecutedSteps] = useState<TransitionStepResult[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to begin execution.');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-play state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1000); // ms per step

  // Input sequence controls
  const [customSequenceStr, setCustomSequenceStr] = useState<string>('');
  const [sequenceQueue, setSequenceQueue] = useState<string[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(0);

  // Timer reference for auto-play
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize incoming props
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    resetSimulation();
  }, [initialNodes, initialEdges]);

  // Identify initial state q0
  const initialNode = useMemo(() => {
    return (
      nodes.find((n) => n.data?.type === 'initial' || n.type === 'initialNode') ||
      nodes[0] ||
      null
    );
  }, [nodes]);

  // Reset simulator
  const resetSimulation = useCallback(() => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
    setIsPlaying(false);
    setStatus('IDLE');
    setExecutedSteps([]);
    setErrorMessage(null);
    setActiveEdgeId(null);
    setQueueIndex(0);

    const startId = initialNode ? initialNode.id : null;
    setCurrentStateId(startId);

    if (startId) {
      const startLabel = initialNode?.data?.label || startId;
      setStatusMessage(`Initialized at starting state q₀: "${startLabel}".`);
    } else {
      setStatusMessage('Warning: No initial state q₀ found in workflow.');
    }

    // Reset visual nodes & edges
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isActive: n.id === startId,
        },
      }))
    );

    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        data: {
          ...e.data,
          isActive: false,
        },
      }))
    );
  }, [initialNode]);

  // Available outgoing transitions from currentStateId
  const availableTransitions = useMemo(() => {
    if (!currentStateId) return [];
    return edges
      .filter((e) => e.source === currentStateId)
      .map((e) => {
        const targetNode = nodes.find((n) => n.id === e.target);
        return {
          edgeId: e.id,
          event: (e.data?.event as string) || 'EVENT',
          condition: e.data?.condition as string,
          action: e.data?.action as string,
          targetId: e.target,
          targetLabel: (targetNode?.data?.label as string) || e.target,
          isFinal:
            targetNode?.data?.type === 'final' || targetNode?.type === 'finalNode',
        };
      });
  }, [currentStateId, edges, nodes]);

  // Execute single transition on an input symbol
  const fireInputSymbol = useCallback(
    async (symbol: string): Promise<boolean> => {
      if (!currentStateId) {
        setErrorMessage('Cannot fire transition: No active state.');
        return false;
      }

      setStatus('RUNNING');
      setErrorMessage(null);

      // Find edge for visual animation
      const matchingEdge = edges.find(
        (e) =>
          e.source === currentStateId &&
          ((e.data?.event as string) || '').toUpperCase() === symbol.toUpperCase()
      );

      // Call API step endpoint
      try {
        const res = await api.executeStep({
          current_state_id: currentStateId,
          input_symbol: symbol,
          step_number: executedSteps.length + 1,
          workflow_id: workflowId,
          fsm: {
            states: nodes.map((n) => ({
              id: n.id,
              label: (n.data?.label as string) || n.id,
              type: (n.data?.type as any) || 'normal',
              description: (n.data?.description as string) || '',
              action: (n.data?.action as string) || '',
            })),
            transitions: edges.map((e) => ({
              id: e.id,
              source: e.source,
              target: e.target,
              event: (e.data?.event as string) || '',
              condition: (e.data?.condition as string) || '',
              action: (e.data?.action as string) || '',
            })),
          },
        });

        if (!res.success || !res.step_result) {
          setStatus('REJECTED');
          setErrorMessage(res.error_message || `Transition rejected on symbol '${symbol}'`);
          setStatusMessage(
            `Automaton crashed: Undefined transition δ(${currentStateId}, '${symbol}'). Execution rejected.`
          );
          setIsPlaying(false);
          return false;
        }

        const step = res.step_result;
        setExecutedSteps((prev) => [...prev, step]);
        setCurrentStateId(step.to_state);

        // Animate edge
        if (matchingEdge) {
          setActiveEdgeId(matchingEdge.id);
          setTimeout(() => setActiveEdgeId(null), Math.min(playSpeed * 0.8, 800));
        }

        // Update node active states on canvas
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            data: {
              ...n.data,
              isActive: n.id === step.to_state,
            },
          }))
        );

        // Update edge active visual state
        setEdges((eds) =>
          eds.map((e) => ({
            ...e,
            data: {
              ...e.data,
              isActive: e.id === matchingEdge?.id,
            },
          }))
        );

        // Check if entered accepting state
        if (step.is_final) {
          setStatus('COMPLETED');
          setStatusMessage(
            `Workflow COMPLETED: Reached accepting state "${step.to_state_label}" (q ∈ F)!`
          );
          setIsPlaying(false);
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#00d2ff', '#00f5d4', '#8b5cf6', '#10b981'],
          });
        } else {
          setStatusMessage(
            `Transitioned: [${step.from_state_label}] ⎯[${symbol}]➔ [${step.to_state_label}]`
          );
        }

        return true;
      } catch (err: any) {
        setStatus('FAILED');
        setErrorMessage(err.message || 'Error communicating with backend execution engine.');
        setIsPlaying(false);
        return false;
      }
    },
    [currentStateId, edges, executedSteps.length, nodes, playSpeed, workflowId]
  );

  // Step Forward in queue or first available transition
  const handleStepForward = useCallback(async () => {
    if (sequenceQueue.length > 0 && queueIndex < sequenceQueue.length) {
      const sym = sequenceQueue[queueIndex];
      setQueueIndex((idx) => idx + 1);
      await fireInputSymbol(sym);
    } else if (availableTransitions.length > 0) {
      // Pick first valid transition
      await fireInputSymbol(availableTransitions[0].event);
    } else {
      setStatusMessage('No further outgoing transitions from this state.');
    }
  }, [availableTransitions, fireInputSymbol, queueIndex, sequenceQueue]);

  // Load custom sequence
  const handleLoadSequence = () => {
    const raw = customSequenceStr.trim();
    if (!raw) return;
    const tokens = raw
      .split(/[\s,;]+/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    setSequenceQueue(tokens);
    setQueueIndex(0);
    setStatusMessage(`Loaded input sequence of ${tokens.length} symbols: ${tokens.join(' → ')}`);
  };

  // Quick preset test sequences
  const handleLoadPreset = (symbols: string[]) => {
    setCustomSequenceStr(symbols.join(', '));
    setSequenceQueue(symbols);
    setQueueIndex(0);
    resetSimulation();
    setStatusMessage(`Loaded preset sequence: ${symbols.join(' → ')}`);
  };

  // Auto-play effect loop
  useEffect(() => {
    if (isPlaying) {
      autoPlayTimerRef.current = setInterval(async () => {
        if (sequenceQueue.length > 0) {
          if (queueIndex < sequenceQueue.length) {
            const sym = sequenceQueue[queueIndex];
            setQueueIndex((i) => i + 1);
            const ok = await fireInputSymbol(sym);
            if (!ok) {
              setIsPlaying(false);
            }
          } else {
            setIsPlaying(false);
            setStatusMessage('Completed entire custom input sequence.');
          }
        } else if (availableTransitions.length > 0) {
          // Auto advance along available transitions
          const ok = await fireInputSymbol(availableTransitions[0].event);
          if (!ok) {
            setIsPlaying(false);
          }
        } else {
          setIsPlaying(false);
          setStatusMessage('Auto-run halted: No further transitions.');
        }
      }, playSpeed);
    } else {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
    }

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [isPlaying, sequenceQueue, queueIndex, availableTransitions, fireInputSymbol, playSpeed]);

  const nodeTypes = useMemo(
    () => ({
      initialNode: CustomStateNode,
      normalNode: CustomStateNode,
      finalNode: CustomStateNode,
      conditionalNode: CustomStateNode,
    }),
    []
  );

  const edgeTypes = useMemo(
    () => ({
      customTransition: CustomTransitionEdge,
    }),
    []
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Simulator Control Bar */}
      <div className="h-16 border-b border-slate-800/80 glass-panel px-6 flex items-center justify-between gap-4 select-none">
        {/* Left: Playback Controls */}
        <div className="flex items-center gap-2">
          {!isPlaying ? (
            <button
              onClick={() => {
                if (status === 'COMPLETED' || status === 'REJECTED') {
                  resetSimulation();
                }
                setIsPlaying(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#060a14] bg-emerald-400 hover:bg-emerald-300 transition-all shadow-md active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Auto Run</span>
            </button>
          ) : (
            <button
              onClick={() => setIsPlaying(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 transition-all shadow-md active:scale-95"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={handleStepForward}
            disabled={isPlaying}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-900/80 border border-slate-700 hover:border-cyan-400 hover:text-white transition-all shadow-sm disabled:opacity-50 active:scale-95"
            title="Step forward one transition"
          >
            <StepForward className="w-4 h-4 text-cyan-400" />
            <span>Step</span>
          </button>

          <button
            onClick={resetSimulation}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-900/80 border border-slate-800 hover:text-slate-200 transition-all active:scale-95"
            title="Reset to initial state q₀"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <div className="h-5 w-px bg-slate-800 mx-2" />

          {/* Speed Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <FastForward className="w-3.5 h-3.5 text-cyan-400" />
            <span>Speed:</span>
            {[
              { label: '0.5x', ms: 1600 },
              { label: '1x', ms: 1000 },
              { label: '2x', ms: 500 },
              { label: '4x', ms: 250 },
            ].map((spd) => (
              <button
                key={spd.label}
                onClick={() => setPlaySpeed(spd.ms)}
                className={clsx(
                  'px-2 py-0.5 rounded text-[11px] font-bold transition-all',
                  playSpeed === spd.ms
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                )}
              >
                {spd.label}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Live Status Banner */}
        <div className="flex items-center gap-2">
          <div
            className={clsx(
              'flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all duration-300',
              status === 'IDLE' && 'bg-slate-900/60 text-slate-400 border-slate-800',
              status === 'RUNNING' &&
                'bg-cyan-950/80 text-cyan-300 border-cyan-500/40 animate-pulse',
              status === 'COMPLETED' &&
                'bg-emerald-950/80 text-emerald-300 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
              status === 'REJECTED' &&
                'bg-rose-950/80 text-rose-300 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.3)]',
              status === 'FAILED' && 'bg-red-950/80 text-red-300 border-red-500/60'
            )}
          >
            {status === 'COMPLETED' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {status === 'REJECTED' && <XCircle className="w-4 h-4 text-rose-400" />}
            {status === 'RUNNING' && <Activity className="w-4 h-4 text-cyan-300 animate-spin" />}
            {status === 'IDLE' && <Sparkles className="w-4 h-4 text-slate-500" />}
            <span>Status: {status}</span>
          </div>

          <span className="text-xs text-slate-400 max-w-md truncate font-mono">
            {statusMessage}
          </span>
        </div>

        {/* Right: Quick E-Commerce Preset buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono text-slate-400">Presets:</span>
          <button
            onClick={() =>
              handleLoadPreset(['CHECKOUT', 'PAY_SUCCESS', 'PACK_ORDER', 'DISPATCH', 'CONFIRM_DELIVERY'])
            }
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 hover:bg-cyan-900/50 transition-colors"
          >
            Full Success Path
          </button>
          <button
            onClick={() => handleLoadPreset(['CHECKOUT', 'PAY_FAIL', 'ABORT_ORDER'])}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-rose-950/40 border border-rose-800/40 text-rose-300 hover:bg-rose-900/50 transition-colors"
          >
            Payment Failed Branch
          </button>
        </div>
      </div>

      {/* Main Area: Split between Interactive Canvas & Simulator Console */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Interactive Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            defaultEdgeOptions={{
              type: 'customTransition',
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 18,
                height: 18,
                color: '#00d2ff',
              },
            }}
          >
            <Background color="#15244d" gap={20} size={1.2} />
            <Controls className="!bg-navy-900 !border-slate-800 !fill-slate-300" />
          </ReactFlow>

          {/* Current State floating badge overlay */}
          <div className="absolute top-4 left-4 z-10 p-3 rounded-2xl glass-panel shadow-neu-card flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-electric-cyan animate-ping" />
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                Active FSM State
              </div>
              <div className="text-sm font-extrabold text-electric-cyan font-mono">
                {currentStateId || 'None'}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Simulation Controls & Event Dispatcher Sidebar */}
        <aside className="w-96 border-l border-slate-800/80 glass-panel p-5 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-6">
            {/* Section 1: Next Transition Trigger Buttons */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>Valid Next Input Events (δ)</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/50 text-slate-400 border border-slate-800">
                  {availableTransitions.length} options
                </span>
              </div>

              {availableTransitions.length === 0 ? (
                <div className="p-3.5 rounded-xl glass-card text-xs text-slate-400 text-center">
                  No outgoing transitions from current state{' '}
                  <span className="font-mono text-cyan-300">"{currentStateId}"</span>.
                </div>
              ) : (
                <div className="space-y-2">
                  {availableTransitions.map((t) => (
                    <button
                      key={t.edgeId}
                      onClick={() => fireInputSymbol(t.event)}
                      className="w-full flex items-center justify-between p-3 rounded-xl glass-card hover:border-cyan-400/60 transition-all group text-left"
                    >
                      <div>
                        <div className="font-mono text-xs font-extrabold text-cyan-300 flex items-center gap-1.5">
                          <span className="text-slate-500">σ:</span>
                          <span>{t.event}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <span>Target:</span>
                          <span className="text-slate-200 font-semibold">{t.targetLabel}</span>
                          {t.isFinal && (
                            <span className="text-purple-400 text-[9px] font-bold">[Final]</span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Custom Input Sequence Simulator */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 mb-2 font-mono uppercase tracking-wider">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Input String Simulator (w ∈ Σ*)</span>
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  value={customSequenceStr}
                  onChange={(e) => setCustomSequenceStr(e.target.value)}
                  placeholder="e.g. CHECKOUT, PAY_SUCCESS, DISPATCH"
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono font-semibold"
                />
                <button
                  onClick={handleLoadSequence}
                  className="w-full py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-xs font-medium text-slate-200 transition-colors shadow-sm"
                >
                  Load Sequence Queue
                </button>
              </div>

              {/* Sequence queue visualization */}
              {sequenceQueue.length > 0 && (
                <div className="mt-2.5 p-2.5 rounded-xl glass-card text-xs">
                  <div className="text-[10px] uppercase font-mono text-slate-400 mb-1.5">
                    Symbol Queue ({queueIndex}/{sequenceQueue.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {sequenceQueue.map((sym, idx) => (
                      <span
                        key={idx}
                        className={clsx(
                          'px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors',
                          idx < queueIndex
                            ? 'bg-slate-800 text-slate-500 line-through'
                            : idx === queueIndex
                            ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/60'
                            : 'bg-black/40 text-slate-300 border border-slate-800'
                        )}
                      >
                        {sym}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Transition History Log & Timeline */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Execution Timeline</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {executedSteps.length} steps executed
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {executedSteps.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400 italic glass-card">
                    No state transitions recorded yet.
                  </div>
                ) : (
                  executedSteps.map((step) => (
                    <div
                      key={step.step_number}
                      className="p-2.5 rounded-xl glass-card text-[11px] font-mono"
                    >
                      <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                        <span>Step #{step.step_number}</span>
                        {step.is_final && (
                          <span className="text-purple-400 font-bold">Accepting State (F)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-slate-200">
                        <span className="text-cyan-400 font-bold">{step.from_state_label}</span>
                        <span className="text-slate-500">⎯[{step.input_symbol}]➔</span>
                        <span className="text-purple-300 font-bold">{step.to_state_label}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="mt-4 p-3 rounded-xl bg-rose-950/80 border border-rose-600/50 text-xs text-rose-200 flex items-start gap-2 shadow-lg">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Transition Rejection</strong>
                {errorMessage}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

