"""
FlowState - FSM Formal Automata Analysis API
Endpoints for formal verification, mathematical 5-tuple extraction,
and transition table computation.
"""
import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.db_models import WorkflowDB
from ..fsm.models import (
    FSMDefinition,
    ValidationReport,
    FormalTupleSummary,
)
from ..fsm.validator import FSMValidator
from ..fsm.converter import reactflow_to_fsm
from ..fsm.engine import FSMEngine
from pydantic import BaseModel

router = APIRouter(prefix="/api/fsm", tags=["Formal FSM Analysis"])


class ValidateGraphRequest(BaseModel):
    workflow_id: Optional[str] = None
    nodes: Optional[List[Dict[str, Any]]] = None
    edges: Optional[List[Dict[str, Any]]] = None
    name: Optional[str] = "Workflow Validation"


@router.post("/validate", response_model=ValidationReport)
def validate_workflow(payload: ValidateGraphRequest, db: Session = Depends(get_db)):
    """
    Runs comprehensive formal Automata Theory verification on the workflow graph.
    Checks:
      - Initial state uniqueness (|q0| = 1)
      - Final/accepting state existence (|F| >= 1)
      - Determinism: |δ(q, a)| <= 1 for all q ∈ Q, a ∈ Σ
      - Reachability from q0 (BFS)
      - Dead state analysis (States with no path to F)
      - Sink states without transitions
    """
    nodes = payload.nodes
    edges = payload.edges
    name = payload.name or "Workflow"

    if nodes is None or edges is None:
        if not payload.workflow_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either (nodes, edges) or a valid workflow_id must be provided."
            )
        record = db.query(WorkflowDB).filter(WorkflowDB.id == payload.workflow_id).first()
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Workflow '{payload.workflow_id}' not found."
            )
        try:
            nodes = json.loads(record.nodes_json)
            edges = json.loads(record.edges_json)
            name = record.name
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to parse stored workflow graph: {str(e)}"
            )

    fsm = reactflow_to_fsm(nodes=nodes, edges=edges, name=name)
    report = FSMValidator.validate(fsm)
    return report


@router.get("/{workflow_id}/formal-tuple", response_model=FormalTupleSummary)
def get_formal_tuple(workflow_id: str, db: Session = Depends(get_db)):
    """
    Extracts the formal 5-tuple M = (Q, Σ, δ, q0, F) and state transition matrix.
    """
    record = db.query(WorkflowDB).filter(WorkflowDB.id == workflow_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow '{workflow_id}' not found."
        )

    nodes = json.loads(record.nodes_json)
    edges = json.loads(record.edges_json)
    fsm = reactflow_to_fsm(nodes=nodes, edges=edges, name=record.name)
    report = FSMValidator.validate(fsm)
    return report.formal_summary


@router.post("/available-inputs")
def get_available_inputs_at_state(payload: ValidateGraphRequest, current_state_id: str):
    """
    Returns valid triggerable input symbols from a specific state.
    """
    if payload.nodes is None or payload.edges is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nodes and edges are required."
        )
    fsm = reactflow_to_fsm(nodes=payload.nodes, edges=payload.edges, name="Query")
    engine = FSMEngine(fsm)
    return engine.get_available_inputs(current_state_id)

