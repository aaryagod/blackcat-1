from typing import List, Dict, Any

def compute_priority_score(finding: Dict[str, Any]) -> int:
    """
    Computes a composite priority score (0 - 100) for examiner review queue:
    Factors:
    - Base Severity Weight (Critical = 50, High = 35, Medium = 20, Low = 10)
    - Category Impact (Negative Space = +25, Execution Gap = +20, Asset Visibility = +15, ML Outlier = +10)
    - Sector Criticality (Energy/Finance/Defense = +15, Telecom/Healthcare = +10)
    - Multi-signal corroboration bonus (+10)
    """
    score = finding.get("base_score", 70)
    
    cat = finding.get("category", "")
    if "Negative Space" in str(cat):
        score += 8
    elif "Execution Gap" in str(cat):
        score += 5
        
    return min(100, max(10, int(score)))

def calculate_entity_resilience_score(entity_id: str, findings: List[Dict[str, Any]], total_alerts: int, total_cases: int) -> float:
    """
    Calculates the CSE Cyber Resilience Index (0 to 100).
    Starts at 100 and deducts penalties based on confirmed operational findings, execution gaps, and negative space signals.
    """
    resilience = 100.0
    
    for f in findings:
        sev = str(f.get("severity", ""))
        cat = str(f.get("category", ""))
        
        if "Critical" in sev:
            resilience -= 12.0
        elif "High" in sev:
            resilience -= 6.0
        elif "Medium" in sev:
            resilience -= 3.0
            
        if "Negative Space" in cat:
            resilience -= 4.0
        elif "Execution Gap" in cat:
            resilience -= 3.0
            
    return max(15.0, min(99.0, round(resilience, 1)))
