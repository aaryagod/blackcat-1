from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import Dict, Any, Optional
import io
import pandas as pd
from app.models import User
from app.auth import get_current_user, require_role
from app.data.synthetic_generator import generate_synthetic_soc_data
from app.analytics.explainability import run_supervisory_analytics
from app.audit import record_audit_event
from app.database import get_db_connection

router = APIRouter(prefix="/api/ingest", tags=["Data Ingestion & Submission Validation"])

@router.post("/reset-synthetic", response_model=Dict[str, Any])
def reset_to_synthetic_baseline(
    current_user: User = Depends(require_role(["examiner", "lead_auditor", "super_admin"]))
):
    """
    Generates fresh synthetic baseline SOC data with ground-truth anomalies and runs full analytics.
    """
    generate_synthetic_soc_data()
    analytics_res = run_supervisory_analytics()
    
    record_audit_event(
        username=current_user.username,
        role=current_user.role.value,
        action="SYNTHETIC_DATASET_RESET",
        details={"findings_generated": analytics_res["total_findings_generated"]}
    )
    
    return {
        "status": "success",
        "message": "Realistic multi-scenario SOC datasets seeded and analyzed successfully.",
        "workflows_analyzed": analytics_res["total_workflows_analyzed"],
        "findings_generated": analytics_res["total_findings_generated"]
    }

@router.post("/validate-csv", response_model=Dict[str, Any])
async def validate_and_profile_csv(
    file: UploadFile = File(...),
    dataset_type: str = Form("alerts"), # alerts, cases, assets, closures
    current_user: User = Depends(get_current_user)
):
    """
    Validates uploaded CSV structure against NCIIPC supervisory schema and profiles contents.
    """
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")
        
    expected_cols = {
        "alerts": ["id", "entity_id", "timestamp", "severity", "category", "target_host"],
        "cases": ["id", "entity_id", "alert_id", "created_at", "priority", "owner_analyst"],
        "assets": ["id", "entity_id", "hostname", "criticality", "owner_dept"]
    }.get(dataset_type, ["id", "entity_id"])
    
    actual_cols = list(df.columns)
    missing_cols = [c for c in expected_cols if c not in actual_cols]
    
    is_valid = len(missing_cols) == 0
    row_count = len(df)
    null_counts = df.isnull().sum().to_dict()
    
    return {
        "filename": file.filename,
        "dataset_type": dataset_type,
        "is_valid": is_valid,
        "total_records": row_count,
        "detected_columns": actual_cols,
        "missing_mandatory_columns": missing_cols,
        "null_field_counts": null_counts,
        "preview": df.head(5).to_dict(orient="records")
    }
