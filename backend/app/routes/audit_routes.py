from fastapi import APIRouter, Depends, Query
from typing import List, Dict, Any, Optional
from app.models import User
from app.auth import get_current_user, require_role
from app.audit import get_audit_logs

router = APIRouter(prefix="/api/audit", tags=["Supervisory Audit Trail"])

@router.get("/logs", response_model=List[Dict[str, Any]])
def retrieve_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    entity_id: Optional[str] = Query(None),
    current_user: User = Depends(require_role(["examiner", "lead_auditor", "super_admin"]))
):
    """
    Returns immutable audit logs tracking examiner reviews, analytics runs, and data resets.
    """
    return get_audit_logs(limit=limit, entity_id=entity_id)
