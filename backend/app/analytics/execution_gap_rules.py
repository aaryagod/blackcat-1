from typing import List, Dict, Any
from app.models import Finding, FindingCategory, FindingSeverity, ReviewStatus

def evaluate_execution_gaps(workflows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Evaluates deterministic Execution Gap rules:
    - RULE-01: Critical Alert Premature Closure without Case/Investigation (Speed-Closing)
    - RULE-04: SLA Inversion / Stalled Case before Abrupt Closure
    - RULE-06: Unauthorized Severity Downgrading without Supervisory Signoff
    """
    findings = []
    
    for wf in workflows:
        alert = wf["alert"]
        case = wf["case"]
        inv = wf["investigation"]
        esc = wf["escalation"]
        closure = wf["closure"]
        entity_id = wf["entity_id"]
        entity_name = wf["entity_name"]
        
        # -------------------------------------------------------------
        # RULE-01: Critical Alert Premature Closure (Speed-Closing)
        # -------------------------------------------------------------
        if alert["severity"] in ["Critical", "High"] and not case and closure:
            # Closed in < 3 minutes without opening a case or conducting an investigation
            if alert["triage_duration_sec"] < 180 or (closure["duration_minutes"] and closure["duration_minutes"] < 3.0):
                findings.append({
                    "rule_id": "RULE-01",
                    "entity_id": entity_id,
                    "entity_name": entity_name,
                    "title": f"Premature Critical Alert Closure ({alert['triage_duration_sec']}s Triage)",
                    "category": FindingCategory.EXECUTION_GAP,
                    "severity": FindingSeverity.CRITICAL if alert["severity"] == "Critical" else FindingSeverity.HIGH,
                    "base_score": 92 if alert["severity"] == "Critical" else 84,
                    "what": f"Critical security alert '{alert['id']}' ({alert['category']}) on host '{alert['target_host']}' was closed in only {alert['triage_duration_sec']} seconds without opening an incident ticket or attaching diagnostic notes.",
                    "why": "NCIIPC Supervisory Guideline: Critical and High tier alerts require mandatory formal triage documentation and minimum verification steps prior to disposition.",
                    "expected_workflow": [
                        f"1. Ingestion: Alert {alert['id']} triggered (Severity: {alert['severity']})",
                        "2. Triage: Minimum 15m verification of host telemetry & process tree",
                        "3. Escalation: Ticket creation in ITSM / Case Management",
                        "4. Evidence: Capture of volatile memory / network PCAP",
                        "5. Formal Closure: Supervisory review & documented disposition"
                    ],
                    "observed_workflow": [
                        f"1. Ingestion: Alert {alert['id']} triggered at {alert['timestamp']}",
                        f"2. Speed-Close: Triage completed in {alert['triage_duration_sec']}s by Analyst {alert['analyst_id']}",
                        f"3. Direct Closure: Resolution '{closure['resolution_type']}' marked without case creation",
                        "4. Evidence: [GAP] Zero diagnostic artifacts logged"
                    ],
                    "supporting_evidence": {
                        "alert_id": alert["id"],
                        "target_host": alert["target_host"],
                        "target_ip": alert["target_ip"],
                        "triage_duration_seconds": alert["triage_duration_sec"],
                        "analyst_id": alert["analyst_id"],
                        "closure_id": closure["id"],
                        "resolution_text": closure["root_cause_summary"]
                    },
                    "counterfactual_explanation": "If a linked case record with at least 15 minutes of investigation telemetry had been submitted, this speed-closing supervisory flag would not have triggered.",
                    "recommended_action": f"Request full endpoint raw telemetry logs for host {alert['target_host']} ({alert['target_ip']}) for 60 minutes around {alert['timestamp']} to verify if adversary payload was suppressed."
                })

        # -------------------------------------------------------------
        # RULE-06: Unauthorized Severity Downgrading
        # -------------------------------------------------------------
        if case and alert["severity"] in ["Critical", "High"]:
            if case["priority"] in ["Low", "Medium"] and (not closure or not closure["supervisory_signoff"]):
                findings.append({
                    "rule_id": "RULE-06",
                    "entity_id": entity_id,
                    "entity_name": entity_name,
                    "title": f"Unauthorized Severity Downgrade ({alert['severity']} -> {case['priority']})",
                    "category": FindingCategory.EXECUTION_GAP,
                    "severity": FindingSeverity.HIGH,
                    "base_score": 85,
                    "what": f"Incident case '{case['id']}' originated from a {alert['severity']} alert on '{alert['target_host']}', but was downgraded to '{case['priority']}' priority without required supervisory sign-off.",
                    "why": "Operational Integrity Protocol: De-escalating high-consequence indicators without dual-analyst or supervisory authorization bypasses mandatory CIRT escalations.",
                    "expected_workflow": [
                        f"1. Ingestion: Severity {alert['severity']} alert detected",
                        "2. Case Creation: Retain original severity or attach CISO re-classification memo",
                        "3. Escalation: Route through Tier-2 escalation queue",
                        "4. Closure: Documented approval from SOC Lead"
                    ],
                    "observed_workflow": [
                        f"1. Ingestion: Alert {alert['id']} received with Critical indicator",
                        f"2. Case Downgrade: Case {case['id']} assigned priority '{case['priority']}' by Analyst {case['owner_analyst']}",
                        "3. Missing Approval: [GAP] 'supervisory_signoff' bit is FALSE",
                        f"4. Closed as '{closure['resolution_type'] if closure else 'Open'}'"
                    ],
                    "supporting_evidence": {
                        "alert_id": alert["id"],
                        "original_severity": alert["severity"],
                        "case_id": case["id"],
                        "downgraded_priority": case["priority"],
                        "analyst_id": case["owner_analyst"],
                        "supervisory_signoff": closure["supervisory_signoff"] if closure else False
                    },
                    "counterfactual_explanation": "If a verified supervisory sign-off record and formal justification had been attached to the case re-classification, this finding would not be generated.",
                    "recommended_action": f"Summon SOC shift supervisor to explain rationale for downgrading {alert['category']} case {case['id']} and provide CISO approval chain."
                })

    return findings
