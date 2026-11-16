import {
  WorkflowItem,
  WorkflowDetail,
  ValidationReport,
  FormalTupleSummary,
  BatchExecutionResult,
  TransitionStepResult,
  ExecutionHistoryItem,
  DashboardStats,
} from '../types';

const API_BASE = '/api';

export const api = {
  // Workflows
  async listWorkflows(): Promise<WorkflowItem[]> {
    const res = await fetch(`${API_BASE}/workflows`);
    if (!res.ok) throw new Error('Failed to fetch workflows');
    return res.json();
  },

  async getWorkflow(id: string): Promise<WorkflowDetail> {
    const res = await fetch(`${API_BASE}/workflows/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch workflow ${id}`);
    return res.json();
  },

  async createWorkflow(payload: {
    name: string;
    description?: string;
    category?: string;
    nodes: any[];
    edges: any[];
  }): Promise<WorkflowDetail> {
    const res = await fetch(`${API_BASE}/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create workflow');
    return res.json();
  },

  async updateWorkflow(
    id: string,
    payload: {
      name?: string;
      description?: string;
      category?: string;
      nodes?: any[];
      edges?: any[];
    }
  ): Promise<WorkflowDetail> {
    const res = await fetch(`${API_BASE}/workflows/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to update workflow ${id}`);
    return res.json();
  },

  async deleteWorkflow(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/workflows/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete workflow ${id}`);
  },

  async resetDefaultTemplates(): Promise<WorkflowItem[]> {
    const res = await fetch(`${API_BASE}/workflows/seed/reset`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reset default templates');
    return res.json();
  },

  // FSM Analysis & Validation
  async validateWorkflow(payload: {
    workflow_id?: string;
    nodes?: any[];
    edges?: any[];
    name?: string;
  }): Promise<ValidationReport> {
    const res = await fetch(`${API_BASE}/fsm/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to validate FSM');
    return res.json();
  },

  async getFormalTuple(workflowId: string): Promise<FormalTupleSummary> {
    const res = await fetch(`${API_BASE}/fsm/${workflowId}/formal-tuple`);
    if (!res.ok) throw new Error('Failed to get formal tuple');
    return res.json();
  },

  // Execution
  async executeStep(payload: {
    current_state_id: string;
    input_symbol: string;
    step_number?: number;
    workflow_id?: string;
    fsm?: any;
  }): Promise<{
    success: boolean;
    step_result?: TransitionStepResult;
    error_message?: string;
    is_accepted: boolean;
    available_next_inputs: any[];
  }> {
    const res = await fetch(`${API_BASE}/execution/step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Step execution failed');
    return res.json();
  },

  async executeBatch(payload: {
    workflow_id?: string;
    fsm?: any;
    input_sequence: string[];
    record_history?: boolean;
  }): Promise<BatchExecutionResult> {
    const res = await fetch(`${API_BASE}/execution/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Batch execution failed');
    return res.json();
  },

  // History & Dashboard
  async getExecutionHistory(limit = 50): Promise<ExecutionHistoryItem[]> {
    const res = await fetch(`${API_BASE}/execution/history?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch execution history');
    return res.json();
  },

  async clearExecutionHistory(): Promise<void> {
    const res = await fetch(`${API_BASE}/execution/history`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to clear execution history');
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/execution/dashboard-stats`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch('/health');
      return res.ok;
    } catch {
      return false;
    }
  },
};

