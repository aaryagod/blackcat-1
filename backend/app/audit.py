import uuid
import json
from datetime import datetime
from typing import Optional, Dict, Any
from app.database import get_db_connection
from app.models import AuditLogEntry

def record_audit_event(
    username: str,
    role: str,
    action: str,
    entity_id: Optional[str] = None,
    finding_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
) -> AuditLogEntry:
    entry_id = f"AUD-{uuid.uuid4().hex[:8].upper()}"
    timestamp = datetime.utcnow().isoformat()
    details_json = json.dumps(details or {})
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO audit_logs (id, timestamp, username, role, action, entity_id, finding_id, details_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (entry_id, timestamp, username, role, action, entity_id, finding_id, details_json))
    conn.commit()
    conn.close()
    
    return AuditLogEntry(
        id=entry_id,
        timestamp=timestamp,
        username=username,
        role=role,
        action=action,
        entity_id=entity_id,
        finding_id=finding_id,
        details=details or {}
    )

def get_audit_logs(limit: int = 100, entity_id: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if entity_id:
        cursor.execute("SELECT * FROM audit_logs WHERE entity_id = ? ORDER BY timestamp DESC LIMIT ?", (entity_id, limit))
    else:
        cursor.execute("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?", (limit,))
        
    rows = cursor.fetchall()
    conn.close()
    
    logs = []
    for r in rows:
        logs.append({
            "id": r["id"],
            "timestamp": r["timestamp"],
            "username": r["username"],
            "role": r["role"],
            "action": r["action"],
            "entity_id": r["entity_id"],
            "finding_id": r["finding_id"],
            "details": json.loads(r["details_json"] or "{}")
        })
    return logs
