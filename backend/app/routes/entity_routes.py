from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from app.models import Entity, User
from app.auth import get_current_user
from app.database import get_db_connection

router = APIRouter(prefix="/api/entities", tags=["Critical Sector Entities"])

@router.get("", response_model=List[Entity])
def get_all_entities(current_user: User = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM entities ORDER BY resilience_score ASC")
    rows = cursor.fetchall()
    conn.close()
    
    entities = []
    for r in rows:
        entities.append(Entity(
            id=r["id"],
            name=r["name"],
            code=r["code"],
            sector=r["sector"],
            criticality_tier=r["criticality_tier"],
            soc_contact=r["soc_contact"] or "",
            assessment_period=r["assessment_period"] or "Q2-2026",
            resilience_score=r["resilience_score"],
            total_alerts=r["total_alerts"],
            total_cases=r["total_cases"],
            total_findings=r["total_findings"],
            created_at=r["created_at"]
        ))
    return entities

@router.get("/{entity_id}", response_model=Dict[str, Any])
def get_entity_detail(entity_id: str, current_user: User = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM entities WHERE id = ?", (entity_id,))
    ent_row = cursor.fetchone()
    
    if not ent_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Critical Sector Entity not found")
        
    # Get assets count
    cursor.execute("SELECT COUNT(*) FROM assets WHERE entity_id = ?", (entity_id,))
    asset_count = cursor.fetchone()[0]
    
    # Get findings breakdown
    cursor.execute("""
    SELECT category, severity, COUNT(*) as count 
    FROM findings 
    WHERE entity_id = ? 
    GROUP BY category, severity
    """, (entity_id,))
    findings_breakdown = [dict(r) for r in cursor.fetchall()]
    
    # Get recent findings
    cursor.execute("SELECT * FROM findings WHERE entity_id = ? ORDER BY priority_score DESC LIMIT 5", (entity_id,))
    recent_findings = [dict(r) for r in cursor.fetchall()]
    
    conn.close()
    
    return {
        "entity": dict(ent_row),
        "total_assets": asset_count,
        "findings_breakdown": findings_breakdown,
        "top_priority_findings": recent_findings
    }

@router.get("/benchmarks/comparative", response_model=Dict[str, Any])
def get_comparative_benchmarks(current_user: User = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, code, sector, resilience_score, total_alerts, total_cases, total_findings FROM entities")
    entities = [dict(r) for r in cursor.fetchall()]
    
    # Calculate sector averages
    sectors: Dict[str, List[float]] = {}
    for e in entities:
        sec = e["sector"]
        if sec not in sectors:
            sectors[sec] = []
        sectors[sec].append(e["resilience_score"])
        
    sector_averages = {s: round(sum(scores)/len(scores), 1) for s, scores in sectors.items()}
    conn.close()
    
    return {
        "entities": entities,
        "sector_averages": sector_averages,
        "assessment_period": "Q2-2026",
        "supervisory_focus_rank": sorted(entities, key=lambda x: x["resilience_score"])
    }
