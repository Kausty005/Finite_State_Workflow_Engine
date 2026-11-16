"""
FlowState - Pydantic Request/Response Schemas
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from ..fsm.models import (
    StateType,
    ExecutionStatus,
    FSMDefinition,
    StateModel,
    TransitionModel,
    ValidationReport,
    FormalTupleSummary,
    BatchExecutionResult,
    TransitionStepResult,
)


class WorkflowCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = ""
    category: Optional[str] = "General"
    is_template: Optional[bool] = False
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []


class WorkflowUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    nodes: Optional[List[Dict[str, Any]]] = None
    edges: Optional[List[Dict[str, Any]]] = None


class WorkflowResponse(BaseModel):
    id: str
    name: str
    description: str
    category: str
    is_template: bool
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    total_states: int
    total_transitions: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WorkflowListItem(BaseModel):
    id: str
    name: str
    description: str
    category: str
    is_template: bool
    total_states: int
    total_transitions: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ExecuteStepRequest(BaseModel):
    current_state_id: str
    input_symbol: str
    step_number: Optional[int] = 1
    fsm: Optional[FSMDefinition] = None
    workflow_id: Optional[str] = None


class ExecuteStepResponse(BaseModel):
    success: bool
    step_result: Optional[TransitionStepResult] = None
    error_message: Optional[str] = None
    is_accepted: bool = False
    available_next_inputs: List[Dict[str, Any]] = []


class ExecuteBatchRequest(BaseModel):
    workflow_id: Optional[str] = None
    fsm: Optional[FSMDefinition] = None
    input_sequence: List[str] = Field(default_factory=list)
    record_history: bool = True


class ExecutionHistoryItem(BaseModel):
    id: str
    workflow_id: str
    workflow_name: str
    status: str
    is_accepted: bool
    initial_state_id: Optional[str]
    final_state_id: Optional[str]
    input_sequence: List[str]
    transition_trace: List[Dict[str, Any]]
    total_steps: int
    duration_ms: int
    error_message: Optional[str]
    explanation: Optional[str]
    executed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DashboardStatsResponse(BaseModel):
    total_workflows: int
    total_executions: int
    successful_executions: int
    failed_executions: int
    active_workflows: int
    determinism_rate: float
    recent_activities: List[Dict[str, Any]]
    templates_count: int

