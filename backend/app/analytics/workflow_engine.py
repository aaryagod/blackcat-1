import json
from typing import Dict, List, Any, Optional
from datetime import datetime
from app.database import get_db_connection

def reconstruct_operational_workflows(entity_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Reconstructs the operational flow for every alert:
    Alert -> Triage -> Case Creation -> Investigation -> Escalation -> Closure
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        a.id AS alert_id, a.entity_id, a.timestamp AS alert_time, a.source_tool, a.severity, a.category,
        a.target_host, a.target_ip, a.analyst_id AS alert_analyst, a.triage_duration_sec, a.summary AS alert_summary,
        c.id AS case_id, c.created_at AS case_created, c.priority AS case_priority, c.owner_analyst AS case_analyst,
        c.escalation_flag, c.sla_target_minutes, c.sla_breached,
        inv.id AS inv_id, inv.start_time AS inv_start, inv.end_time AS inv_end, inv.evidence_types_json,
        inv.hash_artifacts, inv.containment_action_logged, inv.investigation_notes,
        esc.id AS esc_id, esc.escalated_to, esc.escalation_timestamp, esc.justification AS esc_justification,
        cls.id AS closure_id, cls.closed_at, cls.closed_by, cls.resolution_type, cls.root_cause_summary,
        cls.supervisory_signoff, cls.duration_minutes AS closure_duration_min,
        ent.name AS entity_name, ent.code AS entity_code, ent.sector AS entity_sector
    FROM alerts a
    JOIN entities ent ON a.entity_id = ent.id
    LEFT JOIN cases c ON c.alert_id = a.id
    LEFT JOIN investigations inv ON inv.case_id = c.id
    LEFT JOIN escalations esc ON esc.case_id = c.id
    LEFT JOIN closures cls ON (cls.case_id = c.id OR cls.alert_id = a.id)
    """
    
    if entity_id:
        query += " WHERE a.entity_id = ?"
        cursor.execute(query, (entity_id,))
    else:
        cursor.execute(query)
        
    rows = cursor.fetchall()
    conn.close()
    
    workflows = []
    for r in rows:
        evidence_types = []
        if r["evidence_types_json"]:
            try:
                evidence_types = json.loads(r["evidence_types_json"])
            except Exception:
                evidence_types = []
                
        flow = {
            "entity_id": r["entity_id"],
            "entity_name": r["entity_name"],
            "entity_code": r["entity_code"],
            "entity_sector": r["entity_sector"],
            "alert": {
                "id": r["alert_id"],
                "timestamp": r["alert_time"],
                "source_tool": r["source_tool"],
                "severity": r["severity"],
                "category": r["category"],
                "target_host": r["target_host"],
                "target_ip": r["target_ip"],
                "analyst_id": r["alert_analyst"],
                "triage_duration_sec": r["triage_duration_sec"],
                "summary": r["alert_summary"]
            },
            "case": {
                "id": r["case_id"],
                "created_at": r["case_created"],
                "priority": r["case_priority"],
                "owner_analyst": r["case_analyst"],
                "escalation_flag": bool(r["escalation_flag"]),
                "sla_target_minutes": r["sla_target_minutes"],
                "sla_breached": bool(r["sla_breached"])
            } if r["case_id"] else None,
            "investigation": {
                "id": r["inv_id"],
                "analyst_id": r["case_analyst"] or r["alert_analyst"],
                "start_time": r["inv_start"],
                "end_time": r["inv_end"],
                "evidence_types": evidence_types,
                "hash_artifacts": r["hash_artifacts"],
                "containment_action_logged": bool(r["containment_action_logged"]),
                "notes": r["investigation_notes"]
            } if r["inv_id"] else None,
            "escalation": {
                "id": r["esc_id"],
                "escalated_to": r["escalated_to"],
                "timestamp": r["escalation_timestamp"],
                "justification": r["esc_justification"]
            } if r["esc_id"] else None,
            "closure": {
                "id": r["closure_id"],
                "closed_at": r["closed_at"],
                "closed_by": r["closed_by"],
                "resolution_type": r["resolution_type"],
                "root_cause_summary": r["root_cause_summary"],
                "supervisory_signoff": bool(r["supervisory_signoff"]),
                "duration_minutes": r["closure_duration_min"]
            } if r["closure_id"] else None
        }
        workflows.append(flow)
        
    return workflows
