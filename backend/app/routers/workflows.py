"""
FlowState - Workflows API Router
CRUD, Templates, Persistence
"""
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.db_models import WorkflowDB
from ..schemas.schemas import (
    WorkflowCreateRequest,
    WorkflowUpdateRequest,
    WorkflowResponse,
    WorkflowListItem,
)
from ..seed_data import SEED_TEMPLATES

router = APIRouter(prefix="/api/workflows", tags=["Workflows"])


@router.get("", response_model=List[WorkflowListItem])
def list_workflows(db: Session = Depends(get_db)):
    """List all saved workflows and templates."""
    records = db.query(WorkflowDB).order_by(WorkflowDB.updated_at.desc()).all()
    results = []
    for r in records:
        results.append(
            WorkflowListItem(
                id=r.id,
                name=r.name,
                description=r.description or "",
                category=r.category or "General",
                is_template=r.is_template,
                total_states=r.total_states,
                total_transitions=r.total_transitions,
                created_at=r.created_at,
                updated_at=r.updated_at,
            )
        )
    return results


@router.get("/{workflow_id}", response_model=WorkflowResponse)
def get_workflow(workflow_id: str, db: Session = Depends(get_db)):
    """Retrieve full workflow definition including nodes & edges."""
    record = db.query(WorkflowDB).filter(WorkflowDB.id == workflow_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow with ID '{workflow_id}' not found."
        )

    try:
        nodes = json.loads(record.nodes_json)
    except Exception:
        nodes = []

    try:
        edges = json.loads(record.edges_json)
    except Exception:
        edges = []

    return WorkflowResponse(
        id=record.id,
        name=record.name,
        description=record.description or "",
        category=record.category or "General",
        is_template=record.is_template,
        nodes=nodes,
        edges=edges,
        total_states=record.total_states,
        total_transitions=record.total_transitions,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


@router.post("", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
def create_workflow(payload: WorkflowCreateRequest, db: Session = Depends(get_db)):
    """Create and persist a new workflow."""
    nodes_json = json.dumps(payload.nodes)
    edges_json = json.dumps(payload.edges)
    
    new_record = WorkflowDB(
        name=payload.name,
        description=payload.description or "",
        category=payload.category or "General",
        is_template=payload.is_template or False,
        nodes_json=nodes_json,
        edges_json=edges_json,
        total_states=len(payload.nodes),
        total_transitions=len(payload.edges),
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return WorkflowResponse(
        id=new_record.id,
        name=new_record.name,
        description=new_record.description or "",
        category=new_record.category or "General",
        is_template=new_record.is_template,
        nodes=payload.nodes,
        edges=payload.edges,
        total_states=new_record.total_states,
        total_transitions=new_record.total_transitions,
        created_at=new_record.created_at,
        updated_at=new_record.updated_at,
    )


@router.put("/{workflow_id}", response_model=WorkflowResponse)
def update_workflow(workflow_id: str, payload: WorkflowUpdateRequest, db: Session = Depends(get_db)):
    """Update existing workflow details, canvas nodes or edges."""
    record = db.query(WorkflowDB).filter(WorkflowDB.id == workflow_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow with ID '{workflow_id}' not found."
        )

    if payload.name is not None:
        record.name = payload.name
    if payload.description is not None:
        record.description = payload.description
    if payload.category is not None:
        record.category = payload.category
    
    if payload.nodes is not None:
        record.nodes_json = json.dumps(payload.nodes)
        record.total_states = len(payload.nodes)
    
    if payload.edges is not None:
        record.edges_json = json.dumps(payload.edges)
        record.total_transitions = len(payload.edges)

    db.commit()
    db.refresh(record)

    nodes = json.loads(record.nodes_json)
    edges = json.loads(record.edges_json)

    return WorkflowResponse(
        id=record.id,
        name=record.name,
        description=record.description or "",
        category=record.category or "General",
        is_template=record.is_template,
        nodes=nodes,
        edges=edges,
        total_states=record.total_states,
        total_transitions=record.total_transitions,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workflow(workflow_id: str, db: Session = Depends(get_db)):
    """Delete a workflow."""
    record = db.query(WorkflowDB).filter(WorkflowDB.id == workflow_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow with ID '{workflow_id}' not found."
        )
    db.delete(record)
    db.commit()
    return None


@router.post("/seed/reset", response_model=List[WorkflowListItem])
def seed_default_templates(db: Session = Depends(get_db)):
    """Re-seeds default academic & industry workflow templates."""
    for tpl in SEED_TEMPLATES:
        existing = db.query(WorkflowDB).filter(WorkflowDB.id == tpl["id"]).first()
        if not existing:
            new_tpl = WorkflowDB(
                id=tpl["id"],
                name=tpl["name"],
                description=tpl["description"],
                category=tpl["category"],
                is_template=True,
                nodes_json=json.dumps(tpl["nodes"]),
                edges_json=json.dumps(tpl["edges"]),
                total_states=len(tpl["nodes"]),
                total_transitions=len(tpl["edges"]),
            )
            db.add(new_tpl)
        else:
            existing.name = tpl["name"]
            existing.description = tpl["description"]
            existing.category = tpl["category"]
            existing.nodes_json = json.dumps(tpl["nodes"])
            existing.edges_json = json.dumps(tpl["edges"])
            existing.total_states = len(tpl["nodes"])
            existing.total_transitions = len(tpl["edges"])
    db.commit()

    return list_workflows(db)

