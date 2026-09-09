import uuid
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.database import get_db_connection
from app.analytics.workflow_engine import reconstruct_operational_workflows
from app.analytics.execution_gap_rules import evaluate_execution_gaps
from app.analytics.negative_space_engine import evaluate_negative_space
from app.analytics.statistical_profiler import evaluate_statistical_workload_and_ml
from app.analytics.scoring_engine import compute_priority_score, calculate_entity_resilience_score

def run_supervisory_analytics(entity_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Executes the comprehensive supervisory analytics pipeline:
    1. Reconstruct Workflows (Alert -> Triage -> Case -> Investigation -> Escalation -> Closure)
    2. Evaluate Deterministic Execution Gap Rules
    3. Evaluate Negative-Space Rules
    4. Evaluate Statistical & ML Outliers
    5. Aggregate & Compute Explainable Priority Findings
    6. Persist Findings to Database
    7. Update Entity Resilience Indices
    """
    workflows = reconstruct_operational_workflows(entity_id)
    
    # Run analytical engines
    gap_findings = evaluate_execution_gaps(workflows)
    negative_findings = evaluate_negative_space(workflows)
    stat_findings, workload_stats = evaluate_statistical_workload_and_ml(workflows)
    
    raw_findings = gap_findings + negative_findings + stat_findings
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # If entity specified, clear findings for that entity; otherwise clear all findings
    if entity_id:
        cursor.execute("DELETE FROM findings WHERE entity_id = ?", (entity_id,))
    else:
        cursor.execute("DELETE FROM findings")
        
    saved_findings = []
    
    for f in raw_findings:
        f_id = f"FIND-{f['rule_id']}-{uuid.uuid4().hex[:6].upper()}"
        priority_score = compute_priority_score(f)
        created_at = datetime.utcnow().isoformat()
        
        # Serialize fields
        exp_json = json.dumps(f["expected_workflow"])
        obs_json = json.dumps(f["observed_workflow"])
        ev_json = json.dumps(f["supporting_evidence"])
        
        cat_val = f["category"].value if hasattr(f["category"], "value") else str(f["category"])
        sev_val = f["severity"].value if hasattr(f["severity"], "value") else str(f["severity"])
        
        cursor.execute("""
        INSERT INTO findings (
            id, entity_id, entity_name, rule_id, title, category, severity, priority_score,
            what, why, expected_workflow_json, observed_workflow_json, supporting_evidence_json,
            counterfactual_explanation, recommended_action, review_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending Review', ?)
        """, (
            f_id, f["entity_id"], f["entity_name"], f["rule_id"], f["title"], cat_val, sev_val,
            priority_score, f["what"], f["why"], exp_json, obs_json, ev_json,
            f["counterfactual_explanation"], f["recommended_action"], created_at
        ))
        
        saved_findings.append({
            "id": f_id,
            "entity_id": f["entity_id"],
            "entity_name": f["entity_name"],
            "rule_id": f["rule_id"],
            "title": f["title"],
            "category": cat_val,
            "severity": sev_val,
            "priority_score": priority_score,
            "what": f["what"],
            "why": f["why"],
            "expected_workflow": f["expected_workflow"],
            "observed_workflow": f["observed_workflow"],
            "supporting_evidence": f["supporting_evidence"],
            "counterfactual_explanation": f["counterfactual_explanation"],
            "recommended_action": f["recommended_action"],
            "review_status": "Pending Review",
            "created_at": created_at
        })
        
    # Update entity statistics and resilience scores
    cursor.execute("SELECT id FROM entities")
    entity_ids = [r["id"] for r in cursor.fetchall()]
    
    for eid in entity_ids:
        cursor.execute("SELECT COUNT(*) FROM alerts WHERE entity_id = ?", (eid,))
        tot_alerts = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM cases WHERE entity_id = ?", (eid,))
        tot_cases = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM findings WHERE entity_id = ?", (eid,))
        tot_finds = cursor.fetchone()[0]
        
        ent_findings = [f for f in saved_findings if f["entity_id"] == eid]
        resilience = calculate_entity_resilience_score(eid, ent_findings, tot_alerts, tot_cases)
        
        cursor.execute("""
        UPDATE entities 
        SET total_alerts = ?, total_cases = ?, total_findings = ?, resilience_score = ?
        WHERE id = ?
        """, (tot_alerts, tot_cases, tot_finds, resilience, eid))
        
    conn.commit()
    conn.close()
    
    # Sort findings by priority score descending
    saved_findings.sort(key=lambda x: x["priority_score"], reverse=True)
    
    return {
        "status": "success",
        "total_workflows_analyzed": len(workflows),
        "total_findings_generated": len(saved_findings),
        "findings": saved_findings,
        "workload_stats": workload_stats
    }
