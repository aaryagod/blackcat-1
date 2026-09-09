from typing import List, Dict, Any, Optional
from app.models import Finding, FindingCategory, FindingSeverity, ReviewStatus
from app.database import get_db_connection

def evaluate_negative_space(workflows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Evaluates Negative Space signals:
    - RULE-02: Missing Expected Escalation on Confirmed Critical Indicator
    - RULE-03: Missing Forensic Evidence (Hash/PCAP/Memory Dump) in Critical/High Resolution
    - RULE-07: Unmanaged / Missing Asset in Active CSE Inventory
    """
    findings = []
    
    # Pre-fetch registered assets for all entities
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT entity_id, hostname, ip_address, is_in_active_inventory FROM assets")
    asset_rows = cursor.fetchall()
    conn.close()
    
    known_assets_by_entity = {}
    for ar in asset_rows:
        ent = ar["entity_id"]
        if ent not in known_assets_by_entity:
            known_assets_by_entity[ent] = set()
        known_assets_by_entity[ent].add(ar["hostname"].lower())
        if ar["ip_address"]:
            known_assets_by_entity[ent].add(ar["ip_address"].lower())

    for wf in workflows:
        alert = wf["alert"]
        case = wf["case"]
        inv = wf["investigation"]
        esc = wf["escalation"]
        closure = wf["closure"]
        entity_id = wf["entity_id"]
        entity_name = wf["entity_name"]
        
        # -------------------------------------------------------------
        # RULE-02: Missing Expected Escalation on Confirmed Threat
        # -------------------------------------------------------------
        if alert["severity"] in ["Critical", "High"] and case:
            # If investigation confirmed threat or alert is Critical SCADA / Ransomware / Intrusion, but no escalation record exists
            if not esc and not case["escalation_flag"]:
                is_scada_or_critical = "SCADA" in alert["category"] or alert["severity"] == "Critical"
                findings.append({
                    "rule_id": "RULE-02",
                    "entity_id": entity_id,
                    "entity_name": entity_name,
                    "title": f"Negative Space: Missing L2/CISO Escalation for {alert['severity']} Incident",
                    "category": FindingCategory.NEGATIVE_SPACE,
                    "severity": FindingSeverity.CRITICAL if is_scada_or_critical else FindingSeverity.HIGH,
                    "base_score": 95 if is_scada_or_critical else 88,
                    "what": f"Incident '{case['id']}' involving critical threat category '{alert['category']}' on host '{alert['target_host']}' was resolved without any recorded L2/L3 escalation or incident commander notification.",
                    "why": "Cyber Resilience Mandate (NCIIPC / CERT-In): All confirmed or high-consequence operational sector indicators must possess an auditable escalation record to Tier-2/Incident Commander.",
                    "expected_workflow": [
                        f"1. Detection: High-fidelity alert {alert['id']} ingested",
                        f"2. Triage & Ticket: Case {case['id']} opened",
                        "3. MANDATORY STEP: Escalation record created to L2/CIRT within 30 minutes",
                        "4. Escalation Acknowledgment: Timestamped Tier-2 receipt",
                        "5. Containment & Mitigation Sign-off"
                    ],
                    "observed_workflow": [
                        f"1. Detection: Alert {alert['id']} received at {alert['timestamp']}",
                        f"2. Ticket: Case {case['id']} opened by Analyst {case['owner_analyst']}",
                        "3. MISSING EVIDENCE (Negative Space): [ABSENT] No EscalationRecord logged",
                        f"4. Direct Closure: Closed as '{closure['resolution_type'] if closure else 'Closed'}'"
                    ],
                    "supporting_evidence": {
                        "alert_id": alert["id"],
                        "case_id": case["id"],
                        "target_host": alert["target_host"],
                        "threat_category": alert["category"],
                        "analyst_id": case["owner_analyst"],
                        "escalation_record_present": False
                    },
                    "counterfactual_explanation": "If a valid escalation log to Tier-2 Incident Response had been present with an escalation timestamp within 45 minutes of case creation, this negative-space signal would not have been generated.",
                    "recommended_action": f"Inquire why Tier-1 analyst closed {alert['category']} case without notifying CIRT team, and audit communication logs (Slack/Teams/Email) for undocumented out-of-band triage."
                })

        # -------------------------------------------------------------
        # RULE-03: Missing Forensic Evidence Artifacts in Case Resolution
        # -------------------------------------------------------------
        if case and inv and closure and alert["severity"] in ["Critical", "High"]:
            # If resolved as True Positive Mitigated or Benign, but evidence_types lacks hashes or memory dumps
            evidence_types = inv.get("evidence_types", [])
            has_substantive_evidence = any(e in evidence_types for e in ["hash", "memory_dump", "pcap"]) or bool(inv.get("hash_artifacts"))
            
            if not has_substantive_evidence:
                findings.append({
                    "rule_id": "RULE-03",
                    "entity_id": entity_id,
                    "entity_name": entity_name,
                    "title": f"Negative Space: Missing Diagnostic Forensic Artifacts in {alert['severity']} Resolution",
                    "category": FindingCategory.NEGATIVE_SPACE,
                    "severity": FindingSeverity.HIGH,
                    "base_score": 86,
                    "what": f"Investigation '{inv['id']}' for {alert['severity']} incident on '{alert['target_host']}' was closed without capturing verifiable technical artifacts (file hashes, PCAP, or volatile memory dump).",
                    "why": "Supervisory Evidentiary Standard: High/Critical security incident closures must be substantiated by immutable diagnostic artifacts to prevent unverified dismissal of adversary persistence.",
                    "expected_workflow": [
                        f"1. Investigation: {alert['severity']} incident investigated",
                        "2. Mandatory Evidence Collection: SHA-256 binary hash or network PCAP attached",
                        "3. Containment Log: Host isolation confirmation",
                        "4. Disposition: Evidence-backed resolution"
                    ],
                    "observed_workflow": [
                        f"1. Investigation: Inv {inv['id']} logged by {inv['analyst_id']}",
                        f"2. Attached Evidence: {evidence_types or 'None (Syslog metadata only)'}",
                        "3. MISSING EVIDENCE (Negative Space): [ABSENT] Zero binary hashes, zero memory dumps, zero PCAP records",
                        f"4. Closed as '{closure['resolution_type']}'"
                    ],
                    "supporting_evidence": {
                        "case_id": case["id"],
                        "inv_id": inv["id"],
                        "target_host": alert["target_host"],
                        "attached_evidence_types": evidence_types,
                        "hash_artifacts": inv.get("hash_artifacts"),
                        "closure_id": closure["id"]
                    },
                    "counterfactual_explanation": "If the analyst had recorded a SHA-256 process hash or attached network packet capture evidence to investigation record, this finding would be dismissed.",
                    "recommended_action": f"Request forensic disk/memory image of host '{alert['target_host']}' to independently verify eradication of threat '{alert['category']}'."
                })

        # -------------------------------------------------------------
        # RULE-07: Unmanaged / Missing Asset in Active Inventory
        # -------------------------------------------------------------
        entity_assets = known_assets_by_entity.get(entity_id, set())
        host_lower = alert["target_host"].lower()
        ip_lower = alert["target_ip"].lower() if alert["target_ip"] else ""
        
        if host_lower not in entity_assets and (not ip_lower or ip_lower not in entity_assets):
            findings.append({
                "rule_id": "RULE-07",
                "entity_id": entity_id,
                "entity_name": entity_name,
                "title": f"Negative Space / Asset Visibility: Alert on Unregistered Asset '{alert['target_host']}'",
                "category": FindingCategory.ASSET_VISIBILITY,
                "severity": FindingSeverity.HIGH if alert["severity"] in ["Critical", "High"] else FindingSeverity.MEDIUM,
                "base_score": 82,
                "what": f"Security alert '{alert['id']}' targeted host '{alert['target_host']}' ({alert['target_ip']}), which does NOT exist in the entity's declared active asset inventory.",
                "why": "Asset Management Mandate: All operational assets generating security alerts must have registered criticality classifications, departmental owners, and authorized baselines.",
                "expected_workflow": [
                    "1. Asset Registration: Asset declared in CSE Central Inventory with owner & tier",
                    "2. Alert Correlation: Security telemetry mapped to registered asset metadata",
                    "3. Assessment: Evaluated under defined criticality tier"
                ],
                "observed_workflow": [
                    f"1. Alert Generation: Alert {alert['id']} fired against {alert['target_host']} ({alert['target_ip']})",
                    "2. Inventory Check: [ABSENT] Hostname and IP missing from registered inventory tables",
                    "3. Shadow Asset: Potential unmanaged shadow infrastructure operating inside CSE network"
                ],
                "supporting_evidence": {
                    "alert_id": alert["id"],
                    "unregistered_host": alert["target_host"],
                    "unregistered_ip": alert["target_ip"],
                    "source_tool": alert["source_tool"],
                    "alert_timestamp": alert["timestamp"]
                },
                "counterfactual_explanation": "If host was registered in submitted asset inventory with designated asset ID and owner department, this asset discrepancy flag would not exist.",
                "recommended_action": f"Issue immediate inventory clarification notice to {entity_name} regarding unmanaged host {alert['target_host']} ({alert['target_ip']})."
            })

    return findings
