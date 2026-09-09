from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict, Any, Optional
import json
from datetime import datetime
from app.models import Finding, FindingCategory, FindingSeverity, ReviewStatus, User, ReviewDecisionRequest
from app.auth import get_current_user, require_role
from app.database import get_db_connection
from app.audit import record_audit_event

router = APIRouter(prefix="/api/findings", tags=["Supervisory Findings & Review Queue"])

@router.get("", response_model=List[Dict[str, Any]])
def get_findings(
    entity_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    min_priority: int = Query(0, ge=0, le=100),
    current_user: User = Depends(get_current_user)
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM findings WHERE priority_score >= ?"
    params = [min_priority]
    
    if entity_id:
        query += " AND entity_id = ?"
        params.append(entity_id)
    if category:
        query += " AND category = ?"
        params.append(category)
    if severity:
        query += " AND severity = ?"
        params.append(severity)
    if status:
        query += " AND review_status = ?"
        params.append(status)
        
    query += " ORDER BY priority_score DESC, created_at DESC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    findings = []
    for r in rows:
        findings.append({
            "id": r["id"],
            "entity_id": r["entity_id"],
            "entity_name": r["entity_name"],
            "rule_id": r["rule_id"],
            "title": r["title"],
            "category": r["category"],
            "severity": r["severity"],
            "priority_score": r["priority_score"],
            "what": r["what"],
            "why": r["why"],
            "expected_workflow": json.loads(r["expected_workflow_json"] or "[]"),
            "observed_workflow": json.loads(r["observed_workflow_json"] or "[]"),
            "supporting_evidence": json.loads(r["supporting_evidence_json"] or "{}"),
            "counterfactual_explanation": r["counterfactual_explanation"],
            "recommended_action": r["recommended_action"],
            "review_status": r["review_status"],
            "examiner_notes": r["examiner_notes"],
            "reviewed_by": r["reviewed_by"],
            "reviewed_at": r["reviewed_at"],
            "created_at": r["created_at"]
        })
    return findings

@router.get("/{finding_id}", response_model=Dict[str, Any])
def get_finding_detail(finding_id: str, current_user: User = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM findings WHERE id = ?", (finding_id,))
    r = cursor.fetchone()
    conn.close()
    
    if not r:
        raise HTTPException(status_code=404, detail="Finding not found")
        
    return {
        "id": r["id"],
        "entity_id": r["entity_id"],
        "entity_name": r["entity_name"],
        "rule_id": r["rule_id"],
        "title": r["title"],
        "category": r["category"],
        "severity": r["severity"],
        "priority_score": r["priority_score"],
        "what": r["what"],
        "why": r["why"],
        "expected_workflow": json.loads(r["expected_workflow_json"] or "[]"),
        "observed_workflow": json.loads(r["observed_workflow_json"] or "[]"),
        "supporting_evidence": json.loads(r["supporting_evidence_json"] or "{}"),
        "counterfactual_explanation": r["counterfactual_explanation"],
        "recommended_action": r["recommended_action"],
        "review_status": r["review_status"],
        "examiner_notes": r["examiner_notes"],
        "reviewed_by": r["reviewed_by"],
        "reviewed_at": r["reviewed_at"],
        "created_at": r["created_at"]
    }

@router.post("/{finding_id}/review", response_model=Dict[str, Any])
def submit_review_decision(
    finding_id: str,
    decision: ReviewDecisionRequest,
    current_user: User = Depends(require_role(["examiner", "lead_auditor"]))
):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, entity_id, title FROM findings WHERE id = ?", (finding_id,))
    r = cursor.fetchone()
    
    if not r:
        conn.close()
        raise HTTPException(status_code=404, detail="Finding not found")
        
    reviewed_at = datetime.utcnow().isoformat()
    status_val = decision.status.value if hasattr(decision.status, "value") else str(decision.status)
    
    cursor.execute("""
    UPDATE findings
    SET review_status = ?, examiner_notes = ?, reviewed_by = ?, reviewed_at = ?
    WHERE id = ?
    """, (status_val, decision.examiner_notes, current_user.full_name, reviewed_at, finding_id))
    conn.commit()
    conn.close()
    
    record_audit_event(
        username=current_user.username,
        role=current_user.role.value,
        action="EXAMINER_REVIEW_DECISION",
        entity_id=r["entity_id"],
        finding_id=finding_id,
        details={
            "status": status_val,
            "examiner_notes": decision.examiner_notes,
            "finding_title": r["title"]
        }
    )
    
    return {
        "status": "success",
        "finding_id": finding_id,
        "updated_review_status": status_val,
        "reviewed_by": current_user.full_name,
        "reviewed_at": reviewed_at
    }
