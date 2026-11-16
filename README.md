# FlowState — Finite State Workflow Automation Engine

**FlowState** is a web application and execution platform that unifies **Automata Theory** with enterprise **Workflow Automation**. It allows users to visually design, configure, formally verify, simulate, and execute deterministic finite state machine (DFA) workflows with mathematical correctness.

Built for academic demonstration in **Automata Theory & Formal Languages (AT)** as well as real-world production workflow orchestration.

---

## 🔬 Mathematical Foundation: Formal Automata Theory

The FlowState core execution engine implements a genuine **Deterministic Finite Automaton (DFA)** defined as the 5-tuple:

$$M = (Q, \Sigma, \delta, q_0, F)$$

Where:
- **$Q$**: Finite, non-empty set of states.
- **$\Sigma$**: Finite alphabet of valid input event symbols.
- **$\delta$**: Transition function mapping a state and an input symbol to at most one target state:
  $$\delta: Q \times \Sigma \to Q$$
- **$q_0$**: Unique initial state ($q_0 \in Q$).
- **$F$**: Set of accepting / final states ($F \subseteq Q$).

### Determinism Invariant
For every state $q \in Q$ and input symbol $\sigma \in \Sigma$, there is strictly at most one valid transition ($|\delta(q, \sigma)| \le 1$). Non-deterministic branching is detected and flagged by the validation module.

### Language Acceptance & String Evaluation
An input sequence $w = a_1 a_2 \dots a_n \in \Sigma^*$ is evaluated using the extended transition function $\hat{\delta}$:
$$\hat{\delta}(q, \varepsilon) = q$$
$$\hat{\delta}(q, w a) = \delta(\hat{\delta}(q, w), a)$$

A workflow execution terminates with verdict:
- **`ACCEPTED` (Completed)**: If $\hat{\delta}(q_0, w) \in F$.
- **`REJECTED`**: If string $w$ is consumed but $\hat{\delta}(q_0, w) \notin F$, or if an undefined transition $\delta(q_i, a_j) = \emptyset$ is encountered (Automaton Crash).

---

## 🌟 Key Application Features

### 1. Modern SaaS UI/UX
- **Dark Navy Aesthetics**: Deep slate/navy palette (`#040814`, `#070d1e`, `#0d172e`) accented with Electric Blue, Cyan (`#00f5d4`), and Violet (`#8b5cf6`).
- **3D Neumorphism & Glassmorphism**: Multi-layered inset/drop shadows, glowing borders, frosted blur panels.
- **Automata Visual Conventions**: Double concentric rings for Final States ($F$), start arrow inlet for Initial States ($q_0$), and active neon state pulsation.

### 2. Main Analytics Dashboard
- Metric summary cards: Total Workflows, Successful Executions ($q \in F$), Rejected Runs, Active Workflows, and 100% Determinism Rate.
- Pre-seeded enterprise workflow templates catalog (1-click load into designer or simulator).
- Live execution audit feed showing recent runs with timestamps and durations.

### 3. Interactive Visual Workflow Designer (React Flow)
- **Left Stencil Palette**: Click or drag-and-drop state stencils (`q₀ Start`, `Normal`, `F Final`, `Conditional`) directly onto any coordinate on the canvas.
- **Multi-Directional Handles**: All nodes feature 4 connection handles (Left, Right, Top, Bottom), allowing self-loops, restarts, backward cycles, and complex branching.
- **Inline Double-Click Editing**: Double-click any state's title directly on the canvas to rename it without opening sidebars.
- **Instant Transition Configuration**: Connecting two nodes immediately selects the transition and opens the Properties Sidebar to define the input event symbol $\sigma \in \Sigma$.
- **Automata Visual Invariants**: Concentric double rings for Final/Accepting states ($F$), green start indicator for $q_0$.
- **Toast Notifications & Modals**: Clean SaaS dialogs and toasts for all actions—no disruptive browser `alert()` or `prompt()` popups.
- **Workflow Renaming & JSON Export/Import**: Rename workflows inline and export/import `.json` workflow schemas.

### 4. Real-time Workflow Execution Simulator
- **Playback Controls**: Auto-Run, Pause, Resume, Reset, and Step-by-Step execution forward.
- **Speed Adjustment**: 0.5x, 1x, 2x, 4x simulation speeds.
- **Dynamic Event Dispatcher**: Real-time buttons displaying all valid outgoing symbols $\sigma \in \Sigma$ from the current state.
- **Input String Runner**: Enter custom comma- or space-separated sequences (e.g. `CHECKOUT, PAY_SUCCESS, PACK_ORDER, DISPATCH, CONFIRM_DELIVERY`).
- **Live State Glow & Edge Animation**: Active state pulses with neon cyan aura; animated dash particles travel along the active transition edge.
- **Timeline Log**: Step-by-step history table of transitions traversed with timestamps.
- **Confetti Celebration**: Celebrates successful termination in an accepting state ($q \in F$).

### 5. Validation & Formal Automata Theory Analysis Module
- Automatic detection of:
  - Missing or multiple initial states.
  - Missing accepting states.
  - Non-deterministic conflicts (duplicate transitions on same input symbol).
  - Unreachable states (via BFS reachability analysis from $q_0$).
  - Dead states / Sink states (states from which no accepting state in $F$ can be reached).
  - Undefined transition endpoints.
- **Formal 5-Tuple Display**: Formally rendered sets $Q$, $\Sigma$, $q_0$, $F$, and $\delta$.
- **Interactive State Transition Matrix**: Full matrix rendering $\delta(q, \sigma)$ with row indicators ($\to$ for start, $*$ for accepting).

### 6. Persistent Execution Audit History
- Stored persistently in SQLite via SQLAlchemy.
- Filterable and searchable log containing Execution ID, Workflow Name, Status, Input Sequence, Transition Trace, Step Count, Duration, and Error Messages.
- Inspection modal to review the full transition path taken.

---

## 📦 Ready-to-Run Pre-Seeded Templates

FlowState arrives with 3 complete, fully functional workflow templates:
1. **E-Commerce Order Processing**:
   - `Order Placed (q₀)` $\xrightarrow{\text{CHECKOUT}}$ `Payment Pending`
   - `Payment Pending` $\xrightarrow{\text{PAY\_SUCCESS}}$ `Payment Successful` $\xrightarrow{\text{PACK\_ORDER}}$ `Order Processing` $\xrightarrow{\text{DISPATCH}}$ `Shipped` $\xrightarrow{\text{CONFIRM\_DELIVERY}}$ `Delivered (F)`
   - Alternate failure branch: `Payment Pending` $\xrightarrow{\text{PAY\_FAIL}}$ `Payment Failed` $\xrightarrow{\text{ABORT\_ORDER}}$ `Order Cancelled (F)`
2. **CI/CD Automated Deployment Pipeline**:
   - Build, lint, test suite, staging deployment, and production rollout with failure branches.
3. **Academic Evaluation & Moderation Automaton**:
   - Course marks drafting, department scrutiny committee review, dean cryptographic approval, and grade publishing.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| **Frontend Framework** | React 19 + Vite |
| **Canvas & Graph Engine** | React Flow (`@xyflow/react`) |
| **Styling & Neumorphism** | Tailwind CSS + Custom CSS Variables |
| **Animations & Effects** | Framer Motion + Canvas Confetti |
| **Icons** | Lucide React |
| **Backend API** | Python 3.14 + FastAPI + Uvicorn |
| **Automata Engine** | Custom Pure-Python DFSM Engine |
| **Database** | SQLite + SQLAlchemy ORM |
| **Testing** | Pytest |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python**: 3.10+ (tested on Python 3.14)
- **Node.js**: 18+ (tested on Node v24)
- **npm**: 9+

### 1-Click Launch (Windows)
Double-click `run.bat` or run:
```powershell
.\run.ps1
```

### Manual Launch

#### 1. Backend Service
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The FastAPI backend will start at: `http://127.0.0.1:8000`
Interactive Swagger Docs: `http://127.0.0.1:8000/docs`

#### 2. Frontend Application
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open your browser and navigate to: **`http://localhost:5173`**

---

## 🧪 Running Automata Engine Tests
To run the mathematical test suite:
```bash
cd backend
python -m pytest tests/
```
All 7 unit tests will execute, validating acceptance, rejection, determinism enforcement, reachability analysis, and dead state detection.

---

## 🎓 Academic Demonstration Guide

1. **Dashboard**: Observe the overview metrics, templates, and determinism guarantee.
2. **Visual Designer**: Click on states to inspect their properties in the sidebar. Add new states or connect states by dragging handles. Notice the deterministic input symbol assignment.
3. **Formal FSM Analysis**: Open the analysis tab to view the formal 5-tuple $M = (Q, \Sigma, \delta, q_0, F)$ and the state transition matrix. Test the input string `CHECKOUT, PAY_SUCCESS, PACK_ORDER, DISPATCH, CONFIRM_DELIVERY` to observe formal acceptance.
4. **Execution Simulator**:
   - Click **"Full Success Path"** preset, then hit **"Auto Run"**.
   - Watch the active glowing state advance step-by-step with animated edge traversal.
   - Test the alternative path with **"Payment Failed Branch"** to demonstrate state branching.
   - Enter an invalid transition like `CHECKOUT, DELIVER` to witness deterministic crash handling with formal explanation.
5. **Execution History**: Inspect the generated trace in the persistent SQLite audit history table.

