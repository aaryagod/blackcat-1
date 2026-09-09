from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import init_db, get_db_connection
from app.auth import seed_default_users
from app.data.synthetic_generator import generate_synthetic_soc_data
from app.analytics.explainability import run_supervisory_analytics

from app.routes.auth_routes import router as auth_router
from app.routes.entity_routes import router as entity_router
from app.routes.findings_routes import router as findings_router
from app.routes.analytics_routes import router as analytics_router
from app.routes.ingest_routes import router as ingest_router
from app.routes.report_routes import router as report_router
from app.routes.audit_routes import router as audit_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB & Seed baseline on startup
    init_db()
    seed_default_users()
    
    # Check if database has entities; if not, generate synthetic data and run analytics
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM entities")
    count = cursor.fetchone()[0]
    conn.close()
    
    if count == 0:
        print("[SAT-SA] Seeding initial realistic multi-CSE synthetic datasets...")
        generate_synthetic_soc_data()
        print("[SAT-SA] Executing initial supervisory analytics pipeline...")
        run_supervisory_analytics()
        print("[SAT-SA] System ready with explainable supervisory findings.")
        
    yield

app = FastAPI(
    title="SIH-26157 SAT-SA API",
    description="Supervisory Analytics Tool for SOC Assessment (NCIIPC / Critical Sector Entities)",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router)
app.include_router(entity_router)
app.include_router(findings_router)
app.include_router(analytics_router)
app.include_router(ingest_router)
app.include_router(report_router)
app.include_router(audit_router)

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "online",
        "system": "SAT-SA Supervisory Analytics Engine",
        "version": "1.0.0",
        "mode": "Offline Local / Air-Gapped Supervisory Deployment"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
