from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Dict, Any, Optional
from app.models import User
from app.auth import get_current_user, require_role
from app.analytics.explainability import run_supervisory_analytics
from app.database import get_db_connection
from app.audit import record_audit_event

router = APIRouter(prefix="/api/analytics", tags=["Analytics Execution & Visualizations"])

@router.post("/run", response_model=Dict[str, Any])
def execute_analytics(
    entity_id: Optional[str] = Query(None),
    current_user: User = Depends(require_role(["examiner", "lead_auditor", "super_admin"]))
):
    result = run_supervisory_analytics(entity_id)
    
    record_audit_event(
        username=current_user.username,
        role=current_user.role.value,
        action="SUPERVISORY_ANALYTICS_RUN",
        entity_id=entity_id,
        details={
            "workflows_analyzed": result["total_workflows_analyzed"],
            "findings_generated": result["total_findings_generated"]
        }
    )
    
    return result

@router.get("/summary", response_model=Dict[str, Any])
def get_analytics_summary(current_user: User = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM entities")
    total_entities = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM alerts")
    total_alerts = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM cases")
    total_cases = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM findings")
    total_findings = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM findings WHERE severity = 'Critical'")
    critical_findings = cursor.fetchone()[0]
    
    cursor.execute("SELECT category, COUNT(*) as count FROM findings GROUP BY category")
    category_dist = {r["category"]: r["count"] for r in cursor.fetchall()}
    
    cursor.execute("SELECT review_status, COUNT(*) as count FROM findings GROUP BY review_status")
    status_dist = {r["review_status"]: r["count"] for r in cursor.fetchall()}
    
    cursor.execute("SELECT AVG(resilience_score) FROM entities")
    avg_resilience = round(cursor.fetchone()[0] or 0.0, 1)
    
    conn.close()
    
    return {
        "total_entities": total_entities,
        "total_alerts": total_alerts,
        "total_cases": total_cases,
        "total_findings": total_findings,
        "critical_findings": critical_findings,
        "average_resilience_score": avg_resilience,
        "category_distribution": category_dist,
        "review_status_distribution": status_dist
    }

@router.get("/negative-space-matrix", response_model=Dict[str, Any])
def get_negative_space_matrix(current_user: User = Depends(get_current_user)):
    """
    Returns an aggregated matrix of missing evidence dimensions across entities:
    - Missing L2 Escalation
    - Missing Volatile Forensics / Hash Artifacts
    - Missing Supervisory Signoff
    - Unmanaged Assets
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, name, code, sector FROM entities")
    entities = [dict(r) for r in cursor.fetchall()]
    
    matrix = []
    for e in entities:
        eid = e["id"]
        
        cursor.execute("SELECT COUNT(*) FROM findings WHERE entity_id = ? AND rule_id = 'RULE-02'", (eid,))
        missing_esc = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM findings WHERE entity_id = ? AND rule_id = 'RULE-03'", (eid,))
        missing_forensics = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM findings WHERE entity_id = ? AND rule_id = 'RULE-06'", (eid,))
        missing_signoff = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM findings WHERE entity_id = ? AND rule_id = 'RULE-07'", (eid,))
        unmanaged_assets = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM findings WHERE entity_id = ? AND rule_id = 'RULE-01'", (eid,))
        speed_closures = cursor.fetchone()[0]
        
        matrix.append({
            "entity_id": eid,
            "entity_name": e["name"],
            "code": e["code"],
            "sector": e["sector"],
            "missing_escalations": missing_esc,
            "missing_forensics": missing_forensics,
            "missing_signoffs": missing_signoff,
            "unmanaged_assets": unmanaged_assets,
            "speed_closures": speed_closures
        })
        
    conn.close()
    return {"matrix": matrix}
