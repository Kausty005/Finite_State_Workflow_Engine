import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Node, Edge } from '@xyflow/react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/dashboard/DashboardView';
import { DesignerCanvas } from './components/designer/DesignerCanvas';
import { ExecutionSimulator } from './components/simulator/ExecutionSimulator';
import { FormalAnalysisView } from './components/analysis/FormalAnalysisView';
import { ExecutionHistoryView } from './components/history/ExecutionHistoryView';
import { CreateWorkflowModal } from './components/common/CreateWorkflowModal';
import { MosaicBackground } from './components/common/MosaicBackground';
import { ToastProvider, useToast } from './components/common/Toast';
import { api } from './services/api';
import { WorkflowItem, WorkflowDetail, ValidationReport } from './types';

function AppContent() {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'designer' | 'simulator' | 'analysis' | 'history'
  >('dashboard');

  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowDetail | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const toast = useToast();

  const currentWorkflowRef = useRef<WorkflowDetail | null>(null);
  currentWorkflowRef.current = currentWorkflow;

  // Load list of workflows
  const loadWorkflows = useCallback(async () => {
    try {
      let list = await api.listWorkflows();
      if (list.length === 0) {
        list = await api.resetDefaultTemplates();
      }
      setWorkflows(list);
      setIsBackendConnected(true);

      if (!currentWorkflowRef.current && list.length > 0) {
        loadWorkflow(list[0].id);
      }
    } catch (e) {
      console.error('Failed to load workflows:', e);
      setIsBackendConnected(false);
    }
  }, []);

  // Load specific workflow by ID
  const loadWorkflow = async (id: string, targetTab?: 'designer' | 'simulator') => {
    try {
      const wf = await api.getWorkflow(id);
      setCurrentWorkflow(wf);
      setNodes(wf.nodes || []);
      setEdges(wf.edges || []);
      if (targetTab) {
        setActiveTab(targetTab);
      }
    } catch (e) {
      console.error(`Failed to load workflow ${id}:`, e);
      toast.error(`Failed to load workflow ID ${id}`);
    }
  };

  // Handle workflow creation via modal
  const handleCreateWorkflow = async (payload: {
    name: string;
    description: string;
    category: string;
    templateId?: string;
  }) => {
    try {
      let initialNodes: any[] = [];
      let initialEdges: any[] = [];

      if (payload.templateId) {
        const tpl = await api.getWorkflow(payload.templateId);
        initialNodes = tpl.nodes;
        initialEdges = tpl.edges;
      } else {
        // Professional blank canvas scaffold
        initialNodes = [
          {
            id: 'q0',
            type: 'initialNode',
            position: { x: 100, y: 200 },
            data: { id: 'q0', label: 'Start', type: 'initial', description: 'Automaton entry point' },
          },
          {
            id: 'q1',
            type: 'normalNode',
            position: { x: 380, y: 200 },
            data: { id: 'q1', label: 'Processing', type: 'normal', description: 'Intermediate operation' },
          },
          {
            id: 'q2',
            type: 'finalNode',
            position: { x: 660, y: 200 },
            data: { id: 'q2', label: 'Complete', type: 'final', description: 'Accepting terminal state' },
          },
        ];
        initialEdges = [
          {
            id: 'e_q0_q1',
            source: 'q0',
            target: 'q1',
            type: 'customTransition',
            animated: true,
            data: { event: 'INITIATE', condition: 'Input received' },
          },
          {
            id: 'e_q1_q2',
            source: 'q1',
            target: 'q2',
            type: 'customTransition',
            animated: true,
            data: { event: 'COMPLETE', condition: 'Success criteria met' },
          },
        ];
      }

      const created = await api.createWorkflow({
        name: payload.name,
        description: payload.description,
        category: payload.category,
        nodes: initialNodes,
        edges: initialEdges,
      });

      await loadWorkflows();
      await loadWorkflow(created.id, 'designer');
      toast.success(`Workflow "${payload.name}" created`, 'Workflow Ready');
    } catch (e: any) {
      toast.error(`Creation failed: ${e.message}`);
    }
  };

  // Rename workflow in state & database
  const handleRenameWorkflow = async (newName: string) => {
    if (!currentWorkflow || !newName.trim()) return;
    setCurrentWorkflow({ ...currentWorkflow, name: newName });
    try {
      await api.updateWorkflow(currentWorkflow.id, { name: newName });
    } catch (e) {
      console.error('Rename failed:', e);
    }
  };

  // Save current workflow
  const saveWorkflow = async () => {
    if (!currentWorkflow) return;
    setIsSaving(true);
    try {
      const updated = await api.updateWorkflow(currentWorkflow.id, {
        nodes,
        edges,
      });
      setCurrentWorkflow(updated);
      await loadWorkflows();
      toast.success(
        `Saved ${nodes.length} states and ${edges.length} transitions to database`,
        'Workflow Saved'
      );
    } catch (e: any) {
      toast.error(`Save failed: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Validate FSM
  const validateFSM = async (): Promise<ValidationReport | null> => {
    setIsValidating(true);
    try {
      const rep = await api.validateWorkflow({
        workflow_id: currentWorkflow?.id,
        nodes,
        edges,
        name: currentWorkflow?.name,
      });
      setActiveTab('analysis');
      if (rep.is_valid) {
        toast.success('DFA properties verified with 100% determinism', 'Validation Passed');
      } else {
        toast.warning(
          `Found ${rep.issues.filter((i) => i.severity === 'ERROR').length} formal violations`,
          'Verification Warning'
        );
      }
      return rep;
    } catch (e: any) {
      toast.error(`Validation failed: ${e.message}`);
      return null;
    } finally {
      setIsValidating(false);
    }
  };

  // Health check polling
  useEffect(() => {
    loadWorkflows();
    const interval = setInterval(async () => {
      const healthy = await api.checkHealth();
      setIsBackendConnected(healthy);
    }, 15000);
    return () => clearInterval(interval);
  }, [loadWorkflows]);

  return (
    <div className="min-h-screen bg-[#060a14] text-slate-100 flex flex-col font-sans relative selection:bg-cyan-500 selection:text-black">
      {/* Original Dark Navy/Cyan Mosaic Background (Calm & Organic, No Silver/White Flashing) */}
      <MosaicBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentWorkflowName={currentWorkflow?.name}
          workflows={workflows}
          onSelectWorkflow={(id) => loadWorkflow(id)}
          onCreateNewWorkflow={() => setIsCreateModalOpen(true)}
          isBackendConnected={isBackendConnected}
        />

        <main className="flex-1 flex flex-col overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              workflows={workflows}
              onOpenWorkflow={(id, targetTab) => loadWorkflow(id, targetTab)}
              onCreateNewWorkflow={() => setIsCreateModalOpen(true)}
              onRefreshWorkflows={loadWorkflows}
            />
          )}

          {activeTab === 'designer' && (
            <DesignerCanvas
              workflowName={currentWorkflow?.name || 'Workflow'}
              onRenameWorkflow={handleRenameWorkflow}
              nodes={nodes}
              edges={edges}
              setNodes={setNodes}
              setEdges={setEdges}
              onSaveWorkflow={saveWorkflow}
              onValidateFSM={validateFSM}
              onSimulate={() => setActiveTab('simulator')}
              isSaving={isSaving}
              isValidating={isValidating}
            />
          )}

          {activeTab === 'simulator' && (
            <ExecutionSimulator
              workflowId={currentWorkflow?.id}
              workflowName={currentWorkflow?.name || 'Workflow'}
              initialNodes={nodes}
              initialEdges={edges}
            />
          )}

          {activeTab === 'analysis' && (
            <FormalAnalysisView
              workflowId={currentWorkflow?.id}
              workflowName={currentWorkflow?.name || 'Workflow'}
              nodes={nodes}
              edges={edges}
            />
          )}

          {activeTab === 'history' && <ExecutionHistoryView />}
        </main>
      </div>

      {/* Professional Create Workflow Modal */}
      <CreateWorkflowModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        templates={workflows.filter((w) => w.is_template)}
        onCreate={handleCreateWorkflow}
      />
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
