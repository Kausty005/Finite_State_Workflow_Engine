"""
FlowState - SQLAlchemy Database Models
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Integer, Boolean
from ..database import Base

def utc_now():
    return datetime.now(timezone.utc)


class WorkflowDB(Base):
    __tablename__ = "workflows"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    category = Column(String(100), default="General")
    is_template = Column(Boolean, default=False)
    
    # Store JSON strings of React Flow nodes & edges + formal state meta
    nodes_json = Column(Text, nullable=False, default="[]")
    edges_json = Column(Text, nullable=False, default="[]")
    
    # Metadata
    total_states = Column(Integer, default=0)
    total_transitions = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class ExecutionHistoryDB(Base):
    __tablename__ = "execution_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workflow_id = Column(String(36), nullable=False, index=True)
    workflow_name = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False) # COMPLETED, REJECTED, FAILED
    is_accepted = Column(Boolean, default=False)
    
    initial_state_id = Column(String(100), nullable=True)
    final_state_id = Column(String(100), nullable=True)
    
    # JSON serialized input & transitions sequence
    input_sequence_json = Column(Text, default="[]")
    transition_trace_json = Column(Text, default="[]")
    
    total_steps = Column(Integer, default=0)
    duration_ms = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    
    executed_at = Column(DateTime, default=utc_now)
