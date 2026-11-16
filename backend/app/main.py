"""
FlowState - Finite State Workflow Automation Engine
Backend API Service (FastAPI + SQLAlchemy SQLite)
"""
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine, SessionLocal
from .models.db_models import WorkflowDB, ExecutionHistoryDB
from .routers import workflows, fsm, execution
from .seed_data import SEED_TEMPLATES


def seed_initial_templates():
    """Seeds default templates into the database on startup if not present."""
    db = SessionLocal()
    try:
        count = db.query(WorkflowDB).filter(WorkflowDB.is_template == True).count()
        if count == 0:
            print("🌱 FlowState: Seeding default academic and industry workflow templates...")
            for tpl in SEED_TEMPLATES:
                workflow = WorkflowDB(
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
                db.add(workflow)
            db.commit()
            print("✅ FlowState: Default templates seeded successfully.")
    except Exception as e:
        print(f"⚠️ Error seeding templates: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed
    Base.metadata.create_all(bind=engine)
    seed_initial_templates()
    yield
    # Shutdown


app = FastAPI(
    title="FlowState API",
    description="Finite State Workflow Automation Engine based on formal Automata Theory M = (Q, Σ, δ, q0, F)",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(workflows.router)
app.include_router(fsm.router)
app.include_router(execution.router)


@app.get("/")
def read_root():
    return {
        "engine": "FlowState — Finite State Workflow Automation Engine",
        "formalism": "M = (Q, Σ, δ, q0, F)",
        "status": "operational",
        "version": "1.0.0",
        "docs_url": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}

