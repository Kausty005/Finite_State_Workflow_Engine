export type StateType = 'initial' | 'normal' | 'final' | 'conditional';

export type ExecutionStatus = 'IDLE' | 'RUNNING' | 'COMPLETED' | 'REJECTED' | 'FAILED';

export interface StateData {
  id: string;
  label: string;
  type: StateType;
  description?: string;
  action?: string;
}

export interface TransitionData {
  event: string;
  condition?: string;
  action?: string;
}

export interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  category: string;
  is_template: boolean;
  total_states: number;
  total_transitions: number;
  created_at: string;
  updated_at: string;
}

export interface WorkflowDetail extends WorkflowItem {
  nodes: any[];
  edges: any[];
}

export interface TransitionStepResult {
  step_number: number;
  from_state: string;
  from_state_label: string;
  input_symbol: string;
  to_state: string;
  to_state_label: string;
  transition_id: string;
  condition?: string;
  action?: string;
  is_final: boolean;
  timestamp: string;
}

export interface BatchExecutionResult {
  status: ExecutionStatus;
  is_accepted: boolean;
  initial_state: string;
  final_state?: string;
  current_state: string;
  input_sequence: string[];
  executed_steps: TransitionStepResult[];
  error_message?: string;
  total_steps: number;
  explanation: string;
}

export interface ValidationIssue {
  code: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  state_id?: string;
  transition_id?: string;
  affected_elements: string[];
}

export interface FormalTupleSummary {
  Q: string[];
  Sigma: string[];
  q0?: string;
  F: string[];
  delta_count: number;
  transition_table: Record<string, Record<string, string>>;
  is_deterministic: boolean;
  is_valid: boolean;
}

export interface ValidationReport {
  is_valid: boolean;
  can_execute: boolean;
  total_states: number;
  total_transitions: number;
  alphabet: string[];
  initial_state_id?: string;
  accepting_state_ids: string[];
  unreachable_states: string[];
  dead_states: string[];
  non_deterministic_conflicts: Array<{
    state_id: string;
    state_label: string;
    symbol: string;
    transition_ids: string[];
    count: number;
  }>;
  issues: ValidationIssue[];
  formal_summary: FormalTupleSummary;
}

export interface ExecutionHistoryItem {
  id: string;
  workflow_id: string;
  workflow_name: string;
  status: string;
  is_accepted: boolean;
  initial_state_id?: string;
  final_state_id?: string;
  input_sequence: string[];
  transition_trace: TransitionStepResult[];
  total_steps: number;
  duration_ms: number;
  error_message?: string;
  explanation?: string;
  executed_at: string;
}

export interface DashboardStats {
  total_workflows: number;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  active_workflows: number;
  determinism_rate: number;
  recent_activities: Array<{
    id: string;
    workflow_name: string;
    status: string;
    is_accepted: boolean;
    total_steps: number;
    duration_ms: number;
    time: string;
  }>;
  templates_count: number;
}

