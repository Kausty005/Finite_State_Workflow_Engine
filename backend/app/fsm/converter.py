"""
FlowState - React Flow to Automata Theory FSM Converter
Converts graph nodes & directed edges into formal 5-tuple M = (Q, Σ, δ, q0, F)
"""
from typing import List, Dict, Any, Optional
from .models import FSMDefinition, StateModel, TransitionModel, StateType


def reactflow_to_fsm(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]], name: str = "", description: str = "") -> FSMDefinition:
    """
    Parses React Flow nodes and edges into formal FSM definition.
    """
    states: List[StateModel] = []
    transitions: List[TransitionModel] = []

    for node in nodes:
        node_id = str(node.get("id"))
        node_type_raw = node.get("type", "normalNode")
        data = node.get("data", {})
        
        # Determine formal state type
        explicit_type = data.get("type")
        if explicit_type:
            try:
                st_type = StateType(explicit_type)
            except ValueError:
                st_type = StateType.NORMAL
        else:
            if "initial" in node_type_raw.lower():
                st_type = StateType.INITIAL
            elif "final" in node_type_raw.lower() or "accepting" in node_type_raw.lower():
                st_type = StateType.FINAL
            elif "conditional" in node_type_raw.lower():
                st_type = StateType.CONDITIONAL
            else:
                st_type = StateType.NORMAL

        label = data.get("label") or node.get("label") or f"State {node_id}"
        description_text = data.get("description", "")
        action = data.get("action", None)
        position = node.get("position", {"x": 0, "y": 0})

        states.append(
            StateModel(
                id=node_id,
                label=str(label),
                type=st_type,
                description=description_text,
                action=action,
                position=position
            )
        )

    for edge in edges:
        edge_id = str(edge.get("id"))
        source = str(edge.get("source"))
        target = str(edge.get("target"))
        data = edge.get("data", {})
        
        # Event symbol σ ∈ Σ
        event = data.get("event") or edge.get("label") or data.get("label") or f"evt_{edge_id}"
        condition = data.get("condition", None)
        action = data.get("action", None)

        transitions.append(
            TransitionModel(
                id=edge_id,
                source=source,
                target=target,
                event=str(event).strip(),
                condition=condition,
                action=action
            )
        )

    return FSMDefinition(
        states=states,
        transitions=transitions,
        name=name,
        description=description
    )

