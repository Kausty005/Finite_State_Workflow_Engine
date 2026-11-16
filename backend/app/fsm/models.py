"""
FlowState - Formal Automata Theory Core Models
Represents: M = (Q, Σ, δ, q0, F)
"""
from typing import Dict, List, Optional, Any, Set
from pydantic import BaseModel, Field
from enum import Enum


class StateType(str, Enum):
    INITIAL = "initial"
    NORMAL = "normal"
    FINAL = "final"
    CONDITIONAL = "conditional"


class ExecutionStatus(str, Enum):
    IDLE = "IDLE"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"  # Reached final/accepting state
    REJECTED = "REJECTED"    # Input sequence exhausted without reaching final state or invalid transition
    FAILED = "FAILED"        # Error during execution


class StateModel(BaseModel):
    id: str
    label: str
    type: StateType = StateType.NORMAL
    description: Optional[str] = ""
    action: Optional[str] = None  # Optional side-effect/payload executed upon entry
    position: Optional[Dict[str, float]] = None


class TransitionModel(BaseModel):
    id: str
    source: str
    target: str
    event: str = Field(..., description="Input symbol σ ∈ Σ triggering this transition")
    condition: Optional[str] = Field(None, description="Guard condition or human-readable description")
    action: Optional[str] = Field(None, description="Action or output associated with transition")


class FSMDefinition(BaseModel):
    """
    Formal 5-tuple: M = (Q, Σ, δ, q0, F)
    """
    states: List[StateModel]
    transitions: List[TransitionModel]
    name: Optional[str] = "Untitled Workflow"
    description: Optional[str] = ""


class FormalTupleSummary(BaseModel):
    Q: List[str]            # Set of states
    Sigma: List[str]        # Alphabet of input symbols
    q0: Optional[str]       # Initial state
    F: List[str]            # Set of accepting states
    delta_count: int        # Number of transitions in δ
    transition_table: Dict[str, Dict[str, str]] # q -> { symbol -> next_q }
    is_deterministic: bool
    is_valid: bool


class TransitionStepResult(BaseModel):
    step_number: int
    from_state: str
    from_state_label: str
    input_symbol: str
    to_state: str
    to_state_label: str
    transition_id: str
    condition: Optional[str] = None
    action: Optional[str] = None
    is_final: bool
    timestamp: Optional[str] = None


class BatchExecutionResult(BaseModel):
    status: ExecutionStatus
    is_accepted: bool
    initial_state: str
    final_state: Optional[str]
    current_state: str
    input_sequence: List[str]
    executed_steps: List[TransitionStepResult]
    error_message: Optional[str] = None
    total_steps: int
    explanation: str


class ValidationSeverity(str, Enum):
    ERROR = "ERROR"
    WARNING = "WARNING"
    INFO = "INFO"


class ValidationIssue(BaseModel):
    code: str
    severity: ValidationSeverity
    title: str
    description: str
    state_id: Optional[str] = None
    transition_id: Optional[str] = None
    affected_elements: List[str] = []


class ValidationReport(BaseModel):
    is_valid: bool
    can_execute: bool
    total_states: int
    total_transitions: int
    alphabet: List[str]
    initial_state_id: Optional[str]
    accepting_state_ids: List[str]
    unreachable_states: List[str]
    dead_states: List[str]
    non_deterministic_conflicts: List[Dict[str, Any]]
    issues: List[ValidationIssue]
    formal_summary: FormalTupleSummary

