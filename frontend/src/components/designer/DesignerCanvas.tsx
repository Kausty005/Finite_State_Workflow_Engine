import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  MarkerType,
  ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { CustomStateNode } from '../nodes/CustomStateNode';
import { CustomTransitionEdge } from '../edges/CustomTransitionEdge';
import { Toolbar } from './Toolbar';
import { StatePalette } from './StatePalette';
import { PropertiesSidebar } from './PropertiesSidebar';
import { StateType, ValidationReport } from '../../types';
import { useToast } from '../common/Toast';

interface DesignerCanvasProps {
  workflowName: string;
  onRenameWorkflow: (newName: string) => void;
  nodes: Node[];
  edges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onSaveWorkflow: () => Promise<void>;
  onValidateFSM: () => Promise<ValidationReport | null>;
  onSimulate: () => void;
  isSaving: boolean;
  isValidating: boolean;
}

export const DesignerCanvas: React.FC<DesignerCanvasProps> = ({
  workflowName,
  onRenameWorkflow,
  nodes,
  edges,
  setNodes,
  setEdges,
  onSaveWorkflow,
  onValidateFSM,
  onSimulate,
  isSaving,
  isValidating,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const toast = useToast();

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

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  // Generate unique state ID
  const generateUniqueId = useCallback(
    (type: StateType): string => {
      const existingIds = new Set(nodes.map((n) => n.id));
      if (type === 'initial' && !existingIds.has('q0')) {
        return 'q0';
      }
      let counter = nodes.length;
      while (existingIds.has(`q${counter}`)) {
        counter++;
      }
      return `q${counter}`;
    },
    [nodes]
  );

  // Create Node Core
  const createNode = useCallback(
    (type: StateType, position: { x: number; y: number }): Node => {
      const id = generateUniqueId(type);
      const nodeTypeMap = {
        initial: 'initialNode',
        normal: 'normalNode',
        final: 'finalNode',
        conditional: 'conditionalNode',
      };

      const defaultLabels = {
        initial: 'Start',
        normal: `State ${id}`,
        final: 'Completed',
        conditional: 'Decision',
      };

      return {
        id,
        type: nodeTypeMap[type],
        position,
        data: {
          id,
          label: defaultLabels[type],
          type,
          description: '',
          action: '',
        },
      };
    },
    [generateUniqueId]
  );

  // Add node via click
  const handleAddNode = useCallback(
    (type: StateType) => {
      const nextIndex = nodes.length;
      const position = {
        x: 140 + (nextIndex % 4) * 260,
        y: 120 + Math.floor(nextIndex / 4) * 160,
      };
      const newNode = createNode(type, position);
      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(newNode.id);
      setSelectedEdgeId(null);
      toast.info(`Added ${type} state "${newNode.id}"`, 'State Added');
    },
    [createNode, nodes.length, setNodes, toast]
  );

  // Drag and drop onto canvas
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow-type') as StateType;
      if (!type || !reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = createNode(type, position);
      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(newNode.id);
      setSelectedEdgeId(null);
      toast.info(`Placed ${type} state "${newNode.id}"`, 'State Created');
    },
    [createNode, reactFlowInstance, setNodes, toast]
  );

  // Connect edge
  const onConnect = useCallback(
    (connection: Connection) => {
      const edgeCount = edges.length + 1;
      const defaultSymbol = `EVENT_${edgeCount}`;
      const edgeId = `e_${connection.source}_${connection.target}_${Date.now()}`;

      const newEdge: Edge = {
        ...connection,
        id: edgeId,
        type: 'customTransition',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: '#00d2ff',
        },
        data: {
          event: defaultSymbol,
          condition: '',
          action: '',
        },
      };

      setEdges((eds) => addEdge(newEdge, eds));
      setSelectedEdgeId(edgeId);
      setSelectedNodeId(null);
      toast.success(
        `Transition δ(${connection.source}, ${defaultSymbol}) → ${connection.target} created`,
        'Connected'
      );
    },
    [edges.length, setEdges, toast]
  );

  // Update selected state node
  const handleUpdateNodeData = useCallback(
    (nodeId: string, newData: any) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === nodeId) {
            const updatedData = { ...n.data, ...newData };
            const typeChanged = newData.type && newData.type !== n.data.type;
            const updatedType = typeChanged
              ? newData.type === 'initial'
                ? 'initialNode'
                : newData.type === 'final'
                ? 'finalNode'
                : newData.type === 'conditional'
                ? 'conditionalNode'
                : 'normalNode'
              : n.type;

            return {
              ...n,
              type: updatedType,
              data: updatedData,
            };
          }
          return n;
        })
      );
    },
    [setNodes]
  );

  // Update selected transition edge
  const handleUpdateEdgeData = useCallback(
    (edgeId: string, newData: any) => {
      setEdges((eds) =>
        eds.map((e) => {
          if (e.id === edgeId) {
            return {
              ...e,
              data: { ...e.data, ...newData },
            };
          }
          return e;
        })
      );
    },
    [setEdges]
  );

  // Delete node
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNodeId(null);
      toast.warning(`Deleted state "${nodeId}"`);
    },
    [setNodes, setEdges, toast]
  );

  // Delete edge
  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((eds) => eds.filter((e) => e.id !== edgeId));
      setSelectedEdgeId(null);
      toast.warning(`Deleted transition`);
    },
    [setEdges, toast]
  );

  // Clear canvas
  const handleClear = useCallback(() => {
    if (window.confirm('Clear all states and transitions from canvas?')) {
      setNodes([]);
      setEdges([]);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      toast.warning('Canvas cleared');
    }
  }, [setNodes, setEdges, toast]);

  // Auto Layout
  const handleAutoLayout = useCallback(() => {
    setNodes((nds) => {
      const visited = new Set<string>();
      const layers: string[][] = [];

      const initialNodeIds = nds
        .filter((n) => n.data?.type === 'initial' || n.type === 'initialNode')
        .map((n) => n.id);

      let currentLayer = initialNodeIds.length > 0 ? initialNodeIds : [nds[0]?.id].filter(Boolean);
      currentLayer.forEach((id) => visited.add(id));
      if (currentLayer.length > 0) layers.push(currentLayer);

      while (currentLayer.length > 0) {
        const nextLayer: string[] = [];
        for (const nid of currentLayer) {
          const outgoing = edges.filter((e) => e.source === nid).map((e) => e.target);
          for (const targetId of outgoing) {
            if (!visited.has(targetId)) {
              visited.add(targetId);
              nextLayer.push(targetId);
            }
          }
        }
        if (nextLayer.length > 0) {
          layers.push(nextLayer);
        }
        currentLayer = nextLayer;
      }

      const remaining = nds.filter((n) => !visited.has(n.id)).map((n) => n.id);
      if (remaining.length > 0) layers.push(remaining);

      return nds.map((n) => {
        let layerIdx = layers.findIndex((layer) => layer.includes(n.id));
        if (layerIdx === -1) layerIdx = 0;
        const indexInLayer = layers[layerIdx]?.indexOf(n.id) || 0;
        return {
          ...n,
          position: {
            x: 80 + layerIdx * 280,
            y: 120 + indexInLayer * 160,
          },
        };
      });
    });
    toast.success('Hierarchical layout organized', 'Auto Layout');
  }, [edges, setNodes, toast]);

  // Export JSON
  const handleExport = useCallback(() => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify({ name: workflowName, nodes, edges }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${workflowName.toLowerCase().replace(/\s+/g, '_')}_fsm.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Workflow configuration downloaded', 'Export JSON');
  }, [nodes, edges, workflowName, toast]);

  // Import JSON
  const handleImport = useCallback(
    (jsonData: string) => {
      try {
        const parsed = JSON.parse(jsonData);
        if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
          setNodes(parsed.nodes);
          setEdges(parsed.edges);
          if (parsed.name) {
            onRenameWorkflow(parsed.name);
          }
          toast.success(
            `Imported ${parsed.nodes.length} states and ${parsed.edges.length} transitions`,
            'Import Success'
          );
        } else {
          toast.error('Invalid workflow file schema');
        }
      } catch (e: any) {
        toast.error(`Parse failed: ${e.message}`);
      }
    },
    [onRenameWorkflow, setEdges, setNodes, toast]
  );

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  const selectedEdge = useMemo(
    () => edges.find((e) => e.id === selectedEdgeId) || null,
    [edges, selectedEdgeId]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Action Toolbar */}
      <Toolbar
        workflowName={workflowName}
        onRenameWorkflow={onRenameWorkflow}
        onSave={onSaveWorkflow}
        onValidate={onValidateFSM}
        onAutoLayout={handleAutoLayout}
        onClear={handleClear}
        onExport={handleExport}
        onImport={handleImport}
        onSimulate={onSimulate}
        isSaving={isSaving}
        isValidating={isValidating}
        totalStates={nodes.length}
        totalTransitions={edges.length}
      />

      {/* Main Designer Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Stencil Palette */}
        <StatePalette onAddNode={handleAddNode} />

        {/* Center Canvas */}
        <div ref={reactFlowWrapper} className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeClick={(_, node) => {
              setSelectedNodeId(node.id);
              setSelectedEdgeId(null);
            }}
            onEdgeClick={(_, edge) => {
              setSelectedEdgeId(edge.id);
              setSelectedNodeId(null);
            }}
            onPaneClick={() => {
              setSelectedNodeId(null);
              setSelectedEdgeId(null);
            }}
            fitView
            defaultEdgeOptions={{
              type: 'customTransition',
              animated: true,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 16,
                height: 16,
                color: '#00d2ff',
              },
            }}
          >
            <Background color="#121b30" gap={18} size={1} />
            <Controls className="!bg-[#090e1a] !border-slate-800 !fill-slate-400" />
          </ReactFlow>
        </div>

        {/* Right Properties Inspector */}
        <PropertiesSidebar
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onUpdateNodeData={handleUpdateNodeData}
          onUpdateEdgeData={handleUpdateEdgeData}
          onDeleteNode={handleDeleteNode}
          onDeleteEdge={handleDeleteEdge}
          onClose={() => {
            setSelectedNodeId(null);
            setSelectedEdgeId(null);
          }}
        />
      </div>
    </div>
  );
};
