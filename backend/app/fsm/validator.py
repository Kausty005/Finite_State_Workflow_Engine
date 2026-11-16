"""
FlowState - Formal Automata Theory Validator
Performs rigorous structural & mathematical validation on M = (Q, Σ, δ, q0, F)
"""
from typing import Dict, List, Set, Tuple, Any, Optional
from collections import deque, defaultdict
from .models import (
    FSMDefinition,
    StateModel,
    TransitionModel,
    StateType,
    ValidationReport,
    ValidationIssue,
    ValidationSeverity,
    FormalTupleSummary,
)


class FSMValidator:
    """
    Automata Theory Validator for Deterministic Finite State Automata (DFA).
    Validates:
      1. Initial State Existence & Uniqueness: |q0| = 1
      2. Accepting/Final States: |F| >= 1
      3. Determinism: For every state q in Q and symbol a in Sigma, |delta(q, a)| <= 1
      4. Reachability: Every state q in Q is reachable from q0
      5. Liveness / Dead State Analysis: Every non-final state can reach at least one final state
      6. Integrity: All transitions reference valid source and target states in Q
      7. Non-final sink state detection: States with no outgoing transitions that are not in F
    """

    @classmethod
    def validate(cls, fsm: FSMDefinition) -> ValidationReport:
        issues: List[ValidationIssue] = []

        # 1. Build State Lookup and sets
        state_map: Dict[str, StateModel] = {s.id: s for s in fsm.states}
        Q: List[str] = [s.id for s in fsm.states]
        Q_set: Set[str] = set(Q)

        # 2. Identify Initial State(s)
        initial_states = [s for s in fsm.states if s.type == StateType.INITIAL]
        initial_state_id: Optional[str] = None

        if len(initial_states) == 0:
            issues.append(
                ValidationIssue(
                    code="ERR_NO_INITIAL_STATE",
                    severity=ValidationSeverity.ERROR,
                    title="Missing Initial State (q₀)",
                    description="The FSM does not have an initial state designated. A valid automaton must start from exactly one initial state q₀.",
                )
            )
        elif len(initial_states) > 1:
            issues.append(
                ValidationIssue(
                    code="ERR_MULTIPLE_INITIAL_STATES",
                    severity=ValidationSeverity.ERROR,
                    title="Multiple Initial States Found",
                    description=f"Found {len(initial_states)} initial states: {', '.join(s.label for s in initial_states)}. A deterministic FSM must possess strictly one initial state q₀.",
                    affected_elements=[s.id for s in initial_states],
                )
            )
            initial_state_id = initial_states[0].id
        else:
            initial_state_id = initial_states[0].id

        # 3. Identify Accepting/Final State(s)
        accepting_states = [s for s in fsm.states if s.type == StateType.FINAL]
        accepting_state_ids = [s.id for s in accepting_states]
        F_set: Set[str] = set(accepting_state_ids)

        if len(accepting_states) == 0:
            issues.append(
                ValidationIssue(
                    code="WARN_NO_ACCEPTING_STATE",
                    severity=ValidationSeverity.WARNING,
                    title="No Accepting/Final State (F)",
                    description="The FSM has no accepting/final states defined. Any execution will terminate in a non-accepting state, meaning no workflow goal can be formally reached.",
                )
            )

        # 4. Validate Transitions and Build Adjacency
        # Input alphabet Sigma
        Sigma_set: Set[str] = set()
        adj_forward: Dict[str, List[Tuple[str, str, str]]] = defaultdict(list) # source -> [(target, event, trans_id)]
        adj_reverse: Dict[str, List[str]] = defaultdict(list)                 # target -> [source]
        
        # Check transition validity & determinism
        transition_symbol_map: Dict[Tuple[str, str], List[str]] = defaultdict(list) # (source, event) -> [trans_ids]

        for trans in fsm.transitions:
            # Clean symbol
            event_sym = trans.event.strip()
            if not event_sym:
                issues.append(
                    ValidationIssue(
                        code="ERR_EMPTY_EVENT_SYMBOL",
                        severity=ValidationSeverity.ERROR,
                        title="Empty Input Symbol",
                        description=f"Transition from '{trans.source}' to '{trans.target}' has an empty or whitespace-only input symbol.",
                        transition_id=trans.id,
                        affected_elements=[trans.id],
                    )
                )
                event_sym = "ε"
            else:
                Sigma_set.add(event_sym)

            # Check valid source & target
            src_valid = trans.source in Q_set
            tgt_valid = trans.target in Q_set

            if not src_valid or not tgt_valid:
                issues.append(
                    ValidationIssue(
                        code="ERR_INVALID_TRANSITION_ENDPOINT",
                        severity=ValidationSeverity.ERROR,
                        title="Invalid Transition Reference",
                        description=f"Transition references non-existent state ID(s): source={trans.source} (valid: {src_valid}), target={trans.target} (valid: {tgt_valid}).",
                        transition_id=trans.id,
                        affected_elements=[trans.id],
                    )
                )
                continue

            adj_forward[trans.source].append((trans.target, event_sym, trans.id))
            adj_reverse[trans.target].append(trans.source)
            transition_symbol_map[(trans.source, event_sym)].append(trans.id)

        # 5. Check Determinism: |δ(q, a)| <= 1
        non_deterministic_conflicts: List[Dict[str, Any]] = []
        for (src_id, sym), trans_ids in transition_symbol_map.items():
            if len(trans_ids) > 1:
                src_label = state_map[src_id].label if src_id in state_map else src_id
                conflict_item = {
                    "state_id": src_id,
                    "state_label": src_label,
                    "symbol": sym,
                    "transition_ids": trans_ids,
                    "count": len(trans_ids),
                }
                non_deterministic_conflicts.append(conflict_item)
                issues.append(
                    ValidationIssue(
                        code="ERR_NON_DETERMINISTIC_TRANSITION",
                        severity=ValidationSeverity.ERROR,
                        title="Non-Deterministic Transition Detected",
                        description=f"State '{src_label}' has {len(trans_ids)} outgoing transitions for the identical input symbol '{sym}'. In a Deterministic Finite Automaton (DFA), δ(q, σ) must map to at most one target state.",
                        state_id=src_id,
                        affected_elements=trans_ids + [src_id],
                    )
                )

        # 6. Reachability Analysis (from q0)
        reachable_states: Set[str] = set()
        if initial_state_id and initial_state_id in Q_set:
            queue = deque([initial_state_id])
            reachable_states.add(initial_state_id)
            while queue:
                curr = queue.popleft()
                for nxt, _, _ in adj_forward[curr]:
                    if nxt not in reachable_states:
                        reachable_states.add(nxt)
                        queue.append(nxt)

        unreachable_states: List[str] = [sid for sid in Q if sid not in reachable_states]
        if unreachable_states and initial_state_id:
            for uid in unreachable_states:
                ulabel = state_map[uid].label if uid in state_map else uid
                issues.append(
                    ValidationIssue(
                        code="WARN_UNREACHABLE_STATE",
                        severity=ValidationSeverity.WARNING,
                        title=f"Unreachable State: {ulabel}",
                        description=f"State '{ulabel}' (ID: {uid}) cannot be reached from initial state '{state_map[initial_state_id].label if initial_state_id in state_map else initial_state_id}'. It will never participate in any valid execution.",
                        state_id=uid,
                        affected_elements=[uid],
                    )
                )

        # 7. Dead State / Liveness Analysis (Can state reach any accepting state F?)
        can_reach_final: Set[str] = set()
        if F_set:
            rev_queue = deque(list(F_set))
            can_reach_final.update(F_set)
            while rev_queue:
                curr = rev_queue.popleft()
                for predecessor in adj_reverse[curr]:
                    if predecessor not in can_reach_final:
                        can_reach_final.add(predecessor)
                        rev_queue.append(predecessor)

        # A dead state is a reachable state that cannot reach any accepting state
        dead_states: List[str] = [
            sid for sid in reachable_states 
            if sid not in can_reach_final and sid not in F_set
        ]
        if dead_states and F_set:
            for did in dead_states:
                dlabel = state_map[did].label if did in state_map else did
                issues.append(
                    ValidationIssue(
                        code="WARN_DEAD_STATE",
                        severity=ValidationSeverity.WARNING,
                        title=f"Dead State Detected: {dlabel}",
                        description=f"State '{dlabel}' is reachable from the start state, but has no path to reach any accepting state in F. Executions entering this state can never succeed.",
                        state_id=did,
                        affected_elements=[did],
                    )
                )

        # 8. Check for Non-Final States without Outgoing Transitions (Sinks)
        for s in fsm.states:
            if s.type != StateType.FINAL:
                outgoing = adj_forward.get(s.id, [])
                if len(outgoing) == 0:
                    issues.append(
                        ValidationIssue(
                            code="WARN_NO_OUTGOING_TRANSITIONS",
                            severity=ValidationSeverity.WARNING,
                            title=f"Sink Non-Final State: {s.label}",
                            description=f"State '{s.label}' is not marked as accepting/final, but has no outgoing transitions defined. Workflow execution reaching this state will stall.",
                            state_id=s.id,
                            affected_elements=[s.id],
                        )
                    )

        # 9. Build Formal 5-Tuple Summary & State Transition Table
        # δ: Q x Σ -> Q
        transition_table: Dict[str, Dict[str, str]] = {}
        for q_id in Q:
            transition_table[q_id] = {}
            for sym in sorted(list(Sigma_set)):
                transition_table[q_id][sym] = "-"

        for trans in fsm.transitions:
            if trans.source in Q_set and trans.target in Q_set:
                sym = trans.event.strip()
                if sym in Sigma_set:
                    # In DFA, record target
                    transition_table[trans.source][sym] = trans.target

        is_deterministic = len(non_deterministic_conflicts) == 0
        has_critical_errors = any(issue.severity == ValidationSeverity.ERROR for issue in issues)

        formal_summary = FormalTupleSummary(
            Q=Q,
            Sigma=sorted(list(Sigma_set)),
            q0=initial_state_id,
            F=accepting_state_ids,
            delta_count=len(fsm.transitions),
            transition_table=transition_table,
            is_deterministic=is_deterministic,
            is_valid=not has_critical_errors,
        )

        return ValidationReport(
            is_valid=not has_critical_errors,
            can_execute=initial_state_id is not None and not has_critical_errors,
            total_states=len(fsm.states),
            total_transitions=len(fsm.transitions),
            alphabet=sorted(list(Sigma_set)),
            initial_state_id=initial_state_id,
            accepting_state_ids=accepting_state_ids,
            unreachable_states=unreachable_states,
            dead_states=dead_states,
            non_deterministic_conflicts=non_deterministic_conflicts,
            issues=issues,
            formal_summary=formal_summary,
        )

