"""
FlowState - Comprehensive Automated Test Suite
Covers:
1. Mathematical FSM Engine (DFA M = (Q, Σ, δ, q0, F))
2. Validation & Formal Automata Theory Diagnostics
3. Edge Cases: Loops, Branching, Dead States, Non-determinism
4. Full FastAPI REST API Integration Tests
5. Database Persistence & Execution History
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.fsm.models import (
    FSMDefinition,
    StateModel,
    TransitionModel,
    StateType,
    ExecutionStatus,
    ValidationSeverity,
)
from app.fsm.engine import FSMEngine
from app.fsm.validator import FSMValidator
from app.database import Base, engine, SessionLocal
from app.models.db_models import WorkflowDB, ExecutionHistoryDB


@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c


# ==========================================
# 1. MATHEMATICAL FSM ENGINE TESTS
# ==========================================

def test_engine_linear_execution_accept():
    """Verify standard linear flow q0 -> q1 -> q2 (Final) accepts valid string."""
    states = [
        StateModel(id="q0", label="Start", type=StateType.INITIAL),
        StateModel(id="q1", label="Step 1", type=StateType.NORMAL),
        StateModel(id="q2", label="Goal", type=StateType.FINAL),
    ]
    transitions = [
        TransitionModel(id="t1", source="q0", target="q1", event="A"),
        TransitionModel(id="t2", source="q1", target="q2", event="B"),
    ]
    fsm = FSMDefinition(states=states, transitions=transitions)
    engine = FSMEngine(fsm)

    res = engine.execute_sequence(["A", "B"])
    assert res.status == ExecutionStatus.COMPLETED
    assert res.is_accepted is True
    assert res.final_state == "q2"
    assert res.total_steps == 2


def test_engine_branching_paths():
    """Verify branching to success vs failure."""
    states = [
        StateModel(id="q0", label="Auth", type=StateType.INITIAL),
        StateModel(id="q1", label="Success", type=StateType.FINAL),
        StateModel(id="q2", label="Denied", type=StateType.FINAL),
    ]
    transitions = [
        TransitionModel(id="t1", source="q0", target="q1", event="LOGIN_OK"),
        TransitionModel(id="t2", source="q0", target="q2", event="LOGIN_FAIL"),
    ]
    fsm = FSMDefinition(states=states, transitions=transitions)
    engine = FSMEngine(fsm)

    res1 = engine.execute_sequence(["LOGIN_OK"])
    assert res1.is_accepted is True
    assert res1.final_state == "q1"

    res2 = engine.execute_sequence(["LOGIN_FAIL"])
    assert res2.is_accepted is True
    assert res2.final_state == "q2"


def test_engine_loopback_and_cycles():
    """Verify loopback transitions back to initial state or previous state."""
    states = [
        StateModel(id="q0", label="Start", type=StateType.INITIAL),
        StateModel(id="q1", label="Processing", type=StateType.NORMAL),
        StateModel(id="q2", label="Complete", type=StateType.FINAL),
    ]
    transitions = [
        TransitionModel(id="t1", source="q0", target="q1", event="BEGIN"),
        TransitionModel(id="t2", source="q1", target="q0", event="RETRY"),
        TransitionModel(id="t3", source="q1", target="q2", event="DONE"),
    ]
    fsm = FSMDefinition(states=states, transitions=transitions)
    engine = FSMEngine(fsm)

    # Sequence with cycle: q0 -> q1 -> q0 -> q1 -> q2
    res = engine.execute_sequence(["BEGIN", "RETRY", "BEGIN", "DONE"])
    assert res.is_accepted is True
    assert res.final_state == "q2"
    assert res.total_steps == 4


def test_engine_undefined_transition_crash():
    """Verify that automaton crashes and rejects on undefined transition symbol."""
    states = [
        StateModel(id="q0", label="Start", type=StateType.INITIAL),
        StateModel(id="q1", label="End", type=StateType.FINAL),
    ]
    transitions = [
        TransitionModel(id="t1", source="q0", target="q1", event="PROCEED"),
    ]
    fsm = FSMDefinition(states=states, transitions=transitions)
    engine = FSMEngine(fsm)

    res = engine.execute_sequence(["INVALID_EVENT"])
    assert res.status == ExecutionStatus.REJECTED
    assert res.is_accepted is False
    assert res.total_steps == 0
    assert "Undefined transition" in res.error_message


def test_engine_empty_string_evaluation():
    """Verify epsilon/empty input string behavior."""
    states_non_accept = [
        StateModel(id="q0", label="Start", type=StateType.INITIAL),
        StateModel(id="q1", label="Final", type=StateType.FINAL),
    ]
    fsm1 = FSMDefinition(states=states_non_accept, transitions=[])
    engine1 = FSMEngine(fsm1)
    res1 = engine1.execute_sequence([])
    assert res1.is_accepted is False  # q0 is not in F

    states_accept = [
        StateModel(id="q0", label="Start & Final", type=StateType.FINAL),
    ]
    # Here q0 is both initial and final
    fsm2 = FSMDefinition(states=[
        StateModel(id="q0", label="Start & Final", type=StateType.INITIAL)
    ], transitions=[])
    fsm2.states[0].type = StateType.FINAL
    # Engine checks accepting states
    engine2 = FSMEngine(fsm2)
    engine2.initial_state_id = "q0"
    engine2.accepting_states = {"q0"}
    res2 = engine2.execute_sequence([])
    assert res2.is_accepted is True


# ==========================================
# 2. VALIDATION & DIAGNOSTICS TESTS
# ==========================================

def test_validation_nondeterminism_detection():
    """DFA cannot have multiple transitions on same symbol from same state."""
    states = [
        StateModel(id="q0", label="Start", type=StateType.INITIAL),
        StateModel(id="q1", label="A", type=StateType.NORMAL),
        StateModel(id="q2", label="B", type=StateType.FINAL),
    ]
    transitions = [
        TransitionModel(id="t1", source="q0", target="q1", event="NEXT"),
        TransitionModel(id="t2", source="q0", target="q2", event="NEXT"),
    ]
    fsm = FSMDefinition(states=states, transitions=transitions)
    report = FSMValidator.validate(fsm)

    assert report.is_valid is False
    assert len(report.non_deterministic_conflicts) == 1
    assert any(i.code == "ERR_NON_DETERMINISTIC_TRANSITION" for i in report.issues)


def test_validation_missing_initial_state():
    states = [
        StateModel(id="q0", label="Normal 1", type=StateType.NORMAL),
        StateModel(id="q1", label="Final", type=StateType.FINAL),
    ]
    transitions = [
        TransitionModel(id="t1", source="q0", target="q1", event="STEP"),
    ]
    fsm = FSMDefinition(states=states, transitions=transitions)
    report = FSMValidator.validate(fsm)

    assert report.is_valid is False
    assert any(i.code == "ERR_NO_INITIAL_STATE" for i in report.issues)


def test_validation_unreachable_and_dead_states():
    states = [
        StateModel(id="q0", label="Start", type=StateType.INITIAL),
        StateModel(id="q1", label="Final", type=StateType.FINAL),
        StateModel(id="q_isolated", label="Unreachable", type=StateType.NORMAL),
        StateModel(id="q_dead", label="Dead End", type=StateType.NORMAL),
    ]
    transitions = [
        TransitionModel(id="t1", source="q0", target="q1", event="FINISH"),
        TransitionModel(id="t2", source="q0", target="q_dead", event="TRAP"),
        # q_dead loops to itself and can never reach q1
        TransitionModel(id="t3", source="q_dead", target="q_dead", event="LOOP"),
    ]
    fsm = FSMDefinition(states=states, transitions=transitions)
    report = FSMValidator.validate(fsm)

    assert "q_isolated" in report.unreachable_states
    assert "q_dead" in report.dead_states
    assert any(i.code == "WARN_UNREACHABLE_STATE" for i in report.issues)
    assert any(i.code == "WARN_DEAD_STATE" for i in report.issues)


# ==========================================
# 3. FASTAPI REST API TESTS
# ==========================================

def test_api_root_and_health(client):
    res_root = client.get("/")
    assert res_root.status_code == 200
    assert res_root.json()["status"] == "operational"

    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "healthy"


def test_api_workflow_crud(client):
    # 1. Create workflow
    payload = {
        "name": "Integration Test Pipeline",
        "description": "Testing full REST workflow cycle",
        "category": "Testing",
        "nodes": [
            {"id": "q0", "type": "initialNode", "position": {"x": 0, "y": 0}, "data": {"label": "Init", "type": "initial"}},
            {"id": "q1", "type": "finalNode", "position": {"x": 200, "y": 0}, "data": {"label": "Complete", "type": "final"}},
        ],
        "edges": [
            {"id": "e1", "source": "q0", "target": "q1", "data": {"event": "EXECUTE"}},
        ]
    }
    create_res = client.post("/api/workflows", json=payload)
    assert create_res.status_code == 201
    created_data = create_res.json()
    wf_id = created_data["id"]
    assert created_data["total_states"] == 2
    assert created_data["total_transitions"] == 1

    # 2. Get workflow
    get_res = client.get(f"/api/workflows/{wf_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Integration Test Pipeline"

    # 3. Update workflow
    update_res = client.put(f"/api/workflows/{wf_id}", json={"name": "Renamed Pipeline"})
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Renamed Pipeline"

    # 4. Batch execute on created workflow
    batch_res = client.post("/api/execution/batch", json={
        "workflow_id": wf_id,
        "input_sequence": ["EXECUTE"],
        "record_history": True,
    })
    assert batch_res.status_code == 200
    batch_data = batch_res.json()
    assert batch_data["is_accepted"] is True
    assert batch_data["final_state"] == "q1"

    # 5. Check execution history recorded
    hist_res = client.get("/api/execution/history?limit=10")
    assert hist_res.status_code == 200
    histories = hist_res.json()
    assert any(h["workflow_id"] == wf_id for h in histories)

    # 6. Delete workflow
    del_res = client.delete(f"/api/workflows/{wf_id}")
    assert del_res.status_code == 204


def test_api_fsm_validation(client):
    payload = {
        "name": "Validation Test",
        "nodes": [
            {"id": "q0", "type": "initialNode", "data": {"label": "Start", "type": "initial"}},
            {"id": "q1", "type": "finalNode", "data": {"label": "End", "type": "final"}},
        ],
        "edges": [
            {"id": "e1", "source": "q0", "target": "q1", "data": {"event": "GO"}},
        ]
    }
    res = client.post("/api/fsm/validate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["is_valid"] is True
    assert data["total_states"] == 2
    assert data["total_transitions"] == 1
    assert data["formal_summary"]["is_deterministic"] is True

