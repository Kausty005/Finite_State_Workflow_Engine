"""
Unit tests for FlowState Formal Automata Theory FSM Engine & Validator
Tests:
- Deterministic Finite Automaton execution (M = (Q, Σ, δ, q0, F))
- Valid sequence acceptance
- Invalid sequence rejection (premature end or non-accepting state)
- Undefined transition crash / rejection
- Non-deterministic conflict detection
- Reachability analysis
- Dead state detection
"""
import pytest
from app.fsm.models import (
    FSMDefinition,
    StateModel,
    TransitionModel,
    StateType,
    ExecutionStatus,
)
from app.fsm.engine import FSMEngine
from app.fsm.validator import FSMValidator


@pytest.fixture
def ecommerce_fsm():
    # Order Placed (q0) -> Payment Pending (q1) -> Payment Success (q2) -> Shipped (q3) -> Delivered (q4, Final)
    # Branch: Payment Pending (q1) -> Payment Failed (q5) -> Cancelled (q6, Final)
    states = [
        StateModel(id="q0", label="Order Placed", type=StateType.INITIAL),
        StateModel(id="q1", label="Payment Pending", type=StateType.NORMAL),
        StateModel(id="q2", label="Payment Success", type=StateType.CONDITIONAL),
        StateModel(id="q3", label="Shipped", type=StateType.NORMAL),
        StateModel(id="q4", label="Delivered", type=StateType.FINAL),
        StateModel(id="q5", label="Payment Failed", type=StateType.CONDITIONAL),
        StateModel(id="q6", label="Cancelled", type=StateType.FINAL),
    ]
    transitions = [
        TransitionModel(id="t1", source="q0", target="q1", event="CHECKOUT"),
        TransitionModel(id="t2", source="q1", target="q2", event="PAY_SUCCESS"),
        TransitionModel(id="t3", source="q1", target="q5", event="PAY_FAIL"),
        TransitionModel(id="t4", source="q2", target="q3", event="DISPATCH"),
        TransitionModel(id="t5", source="q3", target="q4", event="DELIVER"),
        TransitionModel(id="t6", source="q5", target="q6", event="ABORT"),
    ]
    return FSMDefinition(states=states, transitions=transitions, name="E-Commerce FSM")


def test_fsm_successful_acceptance(ecommerce_fsm):
    engine = FSMEngine(ecommerce_fsm)
    input_seq = ["CHECKOUT", "PAY_SUCCESS", "DISPATCH", "DELIVER"]
    result = engine.execute_sequence(input_seq)

    assert result.status == ExecutionStatus.COMPLETED
    assert result.is_accepted is True
    assert result.final_state == "q4"
    assert result.total_steps == 4
    assert len(result.executed_steps) == 4


def test_fsm_alternative_path_acceptance(ecommerce_fsm):
    engine = FSMEngine(ecommerce_fsm)
    input_seq = ["CHECKOUT", "PAY_FAIL", "ABORT"]
    result = engine.execute_sequence(input_seq)

    assert result.status == ExecutionStatus.COMPLETED
    assert result.is_accepted is True
    assert result.final_state == "q6"
    assert result.total_steps == 3


def test_fsm_undefined_transition_rejection(ecommerce_fsm):
    engine = FSMEngine(ecommerce_fsm)
    # Attempting to DISPATCH right after CHECKOUT is undefined in state q1
    input_seq = ["CHECKOUT", "DISPATCH"]
    result = engine.execute_sequence(input_seq)

    assert result.status == ExecutionStatus.REJECTED
    assert result.is_accepted is False
    assert result.current_state == "q1"
    assert result.total_steps == 1
    assert "Undefined transition" in result.error_message


def test_fsm_incomplete_sequence_rejection(ecommerce_fsm):
    engine = FSMEngine(ecommerce_fsm)
    # String ends in non-final state q3 ("Shipped")
    input_seq = ["CHECKOUT", "PAY_SUCCESS", "DISPATCH"]
    result = engine.execute_sequence(input_seq)

    assert result.status == ExecutionStatus.REJECTED
    assert result.is_accepted is False
    assert result.current_state == "q3"
    assert "not an accepting state" in result.error_message


def test_validator_detects_nondeterminism():
    states = [
        StateModel(id="q0", label="Start", type=StateType.INITIAL),
        StateModel(id="q1", label="Branch A", type=StateType.NORMAL),
        StateModel(id="q2", label="Branch B", type=StateType.NORMAL),
    ]
    # Two transitions out of q0 on the same symbol "GO"
    transitions = [
        TransitionModel(id="t1", source="q0", target="q1", event="GO"),
        TransitionModel(id="t2", source="q0", target="q2", event="GO"),
    ]
    fsm = FSMDefinition(states=states, transitions=transitions)
    report = FSMValidator.validate(fsm)

    assert report.is_valid is False
    assert len(report.non_deterministic_conflicts) == 1
    conflict = report.non_deterministic_conflicts[0]
    assert conflict["state_id"] == "q0"
    assert conflict["symbol"] == "GO"
    assert any(i.code == "ERR_NON_DETERMINISTIC_TRANSITION" for i in report.issues)


def test_validator_detects_unreachable_state():
    states = [
        StateModel(id="q0", label="Start", type=StateType.INITIAL),
        StateModel(id="q1", label="Final", type=StateType.FINAL),
        StateModel(id="q_isolated", label="Orphan State", type=StateType.NORMAL),
    ]
    transitions = [
        TransitionModel(id="t1", source="q0", target="q1", event="FINISH"),
    ]
    fsm = FSMDefinition(states=states, transitions=transitions)
    report = FSMValidator.validate(fsm)

    assert "q_isolated" in report.unreachable_states
    assert any(i.code == "WARN_UNREACHABLE_STATE" for i in report.issues)


def test_validator_detects_dead_state():
    states = [
        StateModel(id="q0", label="Start", type=StateType.INITIAL),
        StateModel(id="q1", label="Trap State", type=StateType.NORMAL),
        StateModel(id="q2", label="Final", type=StateType.FINAL),
    ]
    transitions = [
        TransitionModel(id="t1", source="q0", target="q1", event="ENTER_TRAP"),
        TransitionModel(id="t2", source="q0", target="q2", event="FINISH"),
        # q1 loops to itself and can never reach q2
        TransitionModel(id="t3", source="q1", target="q1", event="LOOP"),
    ]
    fsm = FSMDefinition(states=states, transitions=transitions)
    report = FSMValidator.validate(fsm)

    assert "q1" in report.dead_states
    assert any(i.code == "WARN_DEAD_STATE" for i in report.issues)

