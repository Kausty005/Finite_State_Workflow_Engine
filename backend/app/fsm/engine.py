"""
FlowState - Formal Automata Theory Execution Engine
Implements mathematically rigorous Deterministic Finite Automaton (DFA) execution:
  M = (Q, Σ, δ, q0, F)
"""
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timezone
from .models import (
    FSMDefinition,
    StateModel,
    TransitionModel,
    StateType,
    ExecutionStatus,
    TransitionStepResult,
    BatchExecutionResult,
)
from .validator import FSMValidator


class FSMEngine:
    """
    Genuine Deterministic Finite State Machine Execution Engine.
    """

    def __init__(self, fsm: FSMDefinition):
        self.fsm = fsm
        self.states_map: Dict[str, StateModel] = {s.id: s for s in fsm.states}
        
        # Identify initial state q0
        initials = [s for s in fsm.states if s.type == StateType.INITIAL]
        self.initial_state_id: Optional[str] = initials[0].id if initials else None
        
        # Set of accepting states F
        self.accepting_states: Set[str] = {s.id for s in fsm.states if s.type == StateType.FINAL}

        # Build transition lookup: (source_id, event_symbol) -> TransitionModel
        self.transition_lookup: Dict[Tuple[str, str], TransitionModel] = {}
        for t in fsm.transitions:
            key = (t.source, t.event.strip())
            # In DFA, first registered wins or validated before
            if key not in self.transition_lookup:
                self.transition_lookup[key] = t

        # Full adjacency map for quick queries: source_id -> List[TransitionModel]
        self.outgoing_transitions: Dict[str, List[TransitionModel]] = {s.id: [] for s in fsm.states}
        for t in fsm.transitions:
            if t.source in self.outgoing_transitions:
                self.outgoing_transitions[t.source].append(t)

    def get_available_inputs(self, state_id: str) -> List[Dict[str, Any]]:
        """
        Returns list of valid transitions and input symbols triggerable from state_id.
        Useful for interactive UI simulator buttons.
        """
        if state_id not in self.states_map:
            return []
        
        results = []
        for t in self.outgoing_transitions.get(state_id, []):
            target_state = self.states_map.get(t.target)
            results.append({
                "transition_id": t.id,
                "event": t.event.strip(),
                "condition": t.condition,
                "action": t.action,
                "target_id": t.target,
                "target_label": target_state.label if target_state else t.target,
                "is_target_final": target_state.type == StateType.FINAL if target_state else False,
            })
        return results

    def step(
        self,
        current_state_id: str,
        input_symbol: str,
        step_number: int = 1
    ) -> Tuple[bool, Optional[TransitionStepResult], Optional[str]]:
        """
        Execute a single deterministic transition: δ(current_state_id, input_symbol) -> next_state_id
        Returns: (success, step_result, error_message)
        """
        symbol = input_symbol.strip()
        if not symbol:
            return False, None, "Input symbol cannot be empty."

        curr_state = self.states_map.get(current_state_id)
        if not curr_state:
            return False, None, f"State '{current_state_id}' does not exist in Q."

        # Check transition existence in δ
        trans_key = (current_state_id, symbol)
        transition = self.transition_lookup.get(trans_key)

        if not transition:
            available = [f"'{t.event}'" for t in self.outgoing_transitions.get(current_state_id, [])]
            avail_str = f" Valid inputs from this state: {', '.join(available)}." if available else " No transitions leave this state."
            return (
                False,
                None,
                f"Undefined transition δ({curr_state.label}, '{symbol}').{avail_str}"
            )

        target_state = self.states_map.get(transition.target)
        if not target_state:
            return (
                False,
                None,
                f"Transition points to unknown target state '{transition.target}'."
            )

        is_final = target_state.type == StateType.FINAL
        step_result = TransitionStepResult(
            step_number=step_number,
            from_state=current_state_id,
            from_state_label=curr_state.label,
            input_symbol=symbol,
            to_state=target_state.id,
            to_state_label=target_state.label,
            transition_id=transition.id,
            condition=transition.condition,
            action=transition.action,
            is_final=is_final,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        return True, step_result, None

    def execute_sequence(self, input_sequence: List[str]) -> BatchExecutionResult:
        """
        Evaluates input string w = a1 a2 ... an on DFA M = (Q, Σ, δ, q0, F)
        Extended transition function ^δ(q0, w).
        """
        if not self.initial_state_id:
            return BatchExecutionResult(
                status=ExecutionStatus.FAILED,
                is_accepted=False,
                initial_state="UNKNOWN",
                final_state=None,
                current_state="UNKNOWN",
                input_sequence=input_sequence,
                executed_steps=[],
                error_message="Cannot execute workflow: No initial state q₀ defined.",
                total_steps=0,
                explanation="Execution aborted because the automaton lacks a designated initial state q₀."
            )

        current_state_id = self.initial_state_id
        executed_steps: List[TransitionStepResult] = []

        # Empty string / zero input symbols case
        if not input_sequence:
            is_accepted = current_state_id in self.accepting_states
            curr_label = self.states_map[current_state_id].label
            return BatchExecutionResult(
                status=ExecutionStatus.COMPLETED if is_accepted else ExecutionStatus.REJECTED,
                is_accepted=is_accepted,
                initial_state=current_state_id,
                final_state=current_state_id if is_accepted else None,
                current_state=current_state_id,
                input_sequence=[],
                executed_steps=[],
                error_message=None if is_accepted else f"Empty input: Initial state '{curr_label}' is not an accepting state.",
                total_steps=0,
                explanation=f"Empty input string evaluated: Initial state '{curr_label}' is {'in F (Accepted)' if is_accepted else 'not in F (Rejected)'}."
            )

        for idx, raw_symbol in enumerate(input_sequence):
            sym = raw_symbol.strip()
            success, step_res, err = self.step(current_state_id, sym, step_number=idx + 1)
            
            if not success:
                curr_label = self.states_map.get(current_state_id, StateModel(id=current_state_id, label=current_state_id)).label
                return BatchExecutionResult(
                    status=ExecutionStatus.REJECTED,
                    is_accepted=False,
                    initial_state=self.initial_state_id,
                    final_state=None,
                    current_state=current_state_id,
                    input_sequence=input_sequence,
                    executed_steps=executed_steps,
                    error_message=f"Transition rejected at step {idx + 1} with input symbol '{sym}': {err}",
                    total_steps=len(executed_steps),
                    explanation=f"Execution halted at state '{curr_label}' on symbol '{sym}'. In formal automata theory, the automaton crashed into an undefined transition state (δ({curr_label}, '{sym}') = ∅)."
                )

            executed_steps.append(step_res)
            current_state_id = step_res.to_state

        # Evaluation at end of input sequence
        curr_state_obj = self.states_map.get(current_state_id)
        is_accepted = current_state_id in self.accepting_states
        final_label = curr_state_obj.label if curr_state_obj else current_state_id

        if is_accepted:
            status = ExecutionStatus.COMPLETED
            explanation = f"Sequence accepted: The automaton processed all {len(input_sequence)} input symbols and halted in accepting state '{final_label}' (q ∈ F)."
            err_msg = None
        else:
            status = ExecutionStatus.REJECTED
            explanation = f"Sequence rejected: All {len(input_sequence)} input symbols were consumed, but final state '{final_label}' is not in accepting set F."
            err_msg = f"Final state '{final_label}' is not an accepting state."

        return BatchExecutionResult(
            status=status,
            is_accepted=is_accepted,
            initial_state=self.initial_state_id,
            final_state=current_state_id if is_accepted else None,
            current_state=current_state_id,
            input_sequence=input_sequence,
            executed_steps=executed_steps,
            error_message=err_msg,
            total_steps=len(executed_steps),
            explanation=explanation
        )
