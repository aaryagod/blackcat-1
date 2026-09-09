import random
import uuid
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any
from app.database import get_db_connection

def generate_synthetic_soc_data():
    """
    Generates realistic SOC operational data across 3 Critical Sector Entities:
    1. National Power Grid (Energy / SCADA)
    2. Apex Central Bank (Financial Services / SWIFT)
    3. Metro Telecom CSE (Telecommunications / 5G Core)
    
    Includes realistic baseline alerts and intentionally injected supervisory signals/negative space anomalies.
    """
    random.seed(42) # Deterministic for repeatable audit demonstrations
    
    entities = [
        {
            "id": "CSE-ENERGY-01",
            "name": "National Power Grid Corporation",
            "code": "NPGC-SCADA",
            "sector": "Energy & Power",
            "criticality_tier": "Tier-1 Mission Critical",
            "soc_contact": "soc-leads@powergrid.gov.in",
            "assessment_period": "Q2-2026",
            "resilience_score": 64.5
        },
        {
            "id": "CSE-FIN-02",
            "name": "Apex Central Bank & Clearing House",
            "code": "ACBC-FIN",
            "sector": "Banking & Financial",
            "criticality_tier": "Tier-1 Financial Core",
            "soc_contact": "ciso-office@apexbank.fin",
            "assessment_period": "Q2-2026",
            "resilience_score": 58.2
        },
        {
            "id": "CSE-TEL-03",
            "name": "Metro Telecom Enterprise",
            "code": "MTE-TELCO",
            "sector": "Telecommunications",
            "criticality_tier": "Tier-1 National Backbone",
            "soc_contact": "soc-ops@metrotelco.in",
            "assessment_period": "Q2-2026",
            "resilience_score": 71.0
        }
    ]
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Clear existing operational tables for clean generation
    cursor.execute("DELETE FROM findings")
    cursor.execute("DELETE FROM closures")
    cursor.execute("DELETE FROM escalations")
    cursor.execute("DELETE FROM investigations")
    cursor.execute("DELETE FROM cases")
    cursor.execute("DELETE FROM alerts")
    cursor.execute("DELETE FROM assets")
    cursor.execute("DELETE FROM entities")
    
    base_time = datetime(2026, 4, 1, 8, 0, 0)
    
    for ent in entities:
        cursor.execute("""
        INSERT INTO entities (id, name, code, sector, criticality_tier, soc_contact, assessment_period, resilience_score, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (ent["id"], ent["name"], ent["code"], ent["sector"], ent["criticality_tier"], ent["soc_contact"], ent["assessment_period"], ent["resilience_score"], datetime.utcnow().isoformat()))
        
        # 1. Assets
        assets = []
        if "ENERGY" in ent["id"]:
            asset_specs = [
                ("ASSET-NR-01", "SCADA-RTU-SUBSTATION-11", "10.45.10.12", "SCADA RTU Controller", "Tier-1", "Grid Operations"),
                ("ASSET-NR-02", "EMS-CORE-SERVER-01", "10.45.10.50", "Energy Mgmt Server", "Tier-1", "Transmission Dept"),
                ("ASSET-NR-03", "FREQ-MODULATOR-GW", "10.45.11.20", "Frequency Modulator", "Tier-1", "Grid Control"),
                ("ASSET-NR-04", "SCADA-HMI-OPERATOR-WS1", "10.45.20.101", "Operator Workstation", "Tier-2", "Substation 4"),
                ("ASSET-NR-05", "SUBSTATION-FIREWALL-01", "10.45.1.1", "Industrial Firewall", "Tier-1", "Network Security")
            ]
        elif "FIN" in ent["id"]:
            asset_specs = [
                ("ASSET-BNK-01", "SWIFT-SAG-GATEWAY-01", "172.16.50.10", "SWIFT Alliance Gateway", "Tier-1", "Treasury & Payments"),
                ("ASSET-BNK-02", "CORE-CBS-ORACLE-DB", "172.16.50.25", "Core Banking Database", "Tier-1", "Database Admin"),
                ("ASSET-BNK-03", "RTGS-SETTLEMENT-SRV", "172.16.51.100", "Settlement Server", "Tier-1", "Interbank Clearing"),
                ("ASSET-BNK-04", "ATM-SWITCH-GW-02", "172.16.40.15", "ATM Transaction Switch", "Tier-2", "Card Operations"),
                ("ASSET-BNK-05", "PAYMENT-API-BACKEND", "172.16.60.80", "Open Banking API", "Tier-2", "Digital Banking")
            ]
        else:
            asset_specs = [
                ("ASSET-TEL-01", "5G-CORE-UPF-ROUTER", "192.168.100.1", "5G User Plane Function Router", "Tier-1", "Core Network"),
                ("ASSET-TEL-02", "BGP-EDGE-ROUTER-MUM", "192.168.1.1", "Border Gateway Router", "Tier-1", "IP Transit"),
                ("ASSET-TEL-03", "HLR-HSS-SUBSCRIBER-DB", "192.168.100.50", "Subscriber DB", "Tier-1", "Telecom Core"),
                ("ASSET-TEL-04", "SMSC-GATEWAY-01", "192.168.120.10", "SMS Center Gateway", "Tier-2", "Messaging"),
                ("ASSET-TEL-05", "PROVISIONING-PORTAL-WEB", "192.168.150.20", "SIM Provisioning Server", "Tier-2", "Customer Ops")
            ]
            
        for a_id, host, ip, atype, crit, dept in asset_specs:
            cursor.execute("""
            INSERT INTO assets (id, entity_id, hostname, ip_address, asset_type, criticality, owner_dept, is_in_active_inventory)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            """, (a_id, ent["id"], host, ip, atype, crit, dept))
            assets.append({"id": a_id, "host": host, "ip": ip})
            
        # 2. Alerts, Cases, Investigations, Escalations, Closures
        analysts = [f"ANALYST-{ent['code']}-{i}" for i in range(1, 7)]
        categories = ["Malware / Ransomware", "Credential Dumping / Brute Force", "Data Exfiltration Attempt", 
                      "Lateral Movement / Remote Execution", "Unauthorized Configuration Change", "DDoS / Flooding"]
        
        num_alerts = 120 if "ENERGY" in ent["id"] else (180 if "FIN" in ent["id"] else 140)
        
        for i in range(1, num_alerts + 1):
            alert_id = f"ALT-{ent['code']}-{i:04d}"
            curr_time = base_time + timedelta(hours=i*3, minutes=random.randint(0, 50))
            time_str = curr_time.strftime("%Y-%m-%d %H:%M:%S")
            
            asset = random.choice(assets)
            target_host = asset["host"]
            target_ip = asset["ip"]
            cat = random.choice(categories)
            severity = random.choices(["Critical", "High", "Medium", "Low"], weights=[15, 30, 40, 15])[0]
            analyst = random.choice(analysts)
            triage_sec = random.randint(180, 2400) # 3 mins to 40 mins
            summary = f"Detected suspicious {cat} activity on {target_host} originating from external/internal network."
            
            # Decide if Case is opened
            has_case = random.random() < 0.45 or severity in ["Critical", "High"]
            status = "Closed"
            
            cursor.execute("""
            INSERT INTO alerts (id, entity_id, timestamp, source_tool, severity, category, target_host, target_ip, analyst_id, status, triage_duration_sec, summary)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (alert_id, ent["id"], time_str, "Splunk/QRadar SIEM", severity, cat, target_host, target_ip, analyst, status, triage_sec, summary))
            
            if has_case:
                case_id = f"CAS-{ent['code']}-{i:04d}"
                case_created = (curr_time + timedelta(minutes=random.randint(5, 25))).strftime("%Y-%m-%d %H:%M:%S")
                case_priority = severity
                sla_minutes = 60 if severity == "Critical" else (120 if severity == "High" else 240)
                is_escalated = random.random() < 0.35 if severity in ["Critical", "High"] else False
                
                cursor.execute("""
                INSERT INTO cases (id, entity_id, alert_id, created_at, priority, owner_analyst, status, escalation_flag, sla_target_minutes, sla_breached)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
                """, (case_id, ent["id"], alert_id, case_created, case_priority, analyst, "Closed", 1 if is_escalated else 0, sla_minutes))
                
                # Investigation
                inv_id = f"INV-{ent['code']}-{i:04d}"
                inv_start = case_created
                inv_end = (curr_time + timedelta(minutes=random.randint(30, 90))).strftime("%Y-%m-%d %H:%M:%S")
                ev_types = random.sample(["pcap", "hash", "memory_dump", "edr_telemetry", "syslog"], k=random.randint(1, 3))
                notes = f"Investigated telemetry logs for {target_host}. Verified source IP reputation and process tree."
                
                cursor.execute("""
                INSERT INTO investigations (id, case_id, analyst_id, start_time, end_time, evidence_types_json, hash_artifacts, containment_action_logged, investigation_notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (inv_id, case_id, analyst, inv_start, inv_end, json.dumps(ev_types), f"sha256:{uuid.uuid4().hex}" if "hash" in ev_types else None, 1 if severity == "Critical" else 0, notes))
                
                # Escalation if flagged
                if is_escalated:
                    esc_id = f"ESC-{ent['code']}-{i:04d}"
                    esc_time = (curr_time + timedelta(minutes=random.randint(20, 45))).strftime("%Y-%m-%d %H:%M:%S")
                    cursor.execute("""
                    INSERT INTO escalations (id, case_id, escalated_by, escalated_to, escalation_timestamp, ack_timestamp, justification)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (esc_id, case_id, analyst, "L2 Tier / Incident Lead", esc_time, esc_time, "Severity criteria met; potential adversary persistence."))
                    
                # Closure
                close_id = f"CLS-{ent['code']}-{i:04d}"
                closed_at = (curr_time + timedelta(minutes=random.randint(70, 180))).strftime("%Y-%m-%d %H:%M:%S")
                cursor.execute("""
                INSERT INTO closures (id, case_id, alert_id, closed_at, closed_by, resolution_type, root_cause_summary, supervisory_signoff, duration_minutes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (close_id, case_id, alert_id, closed_at, analyst, "True Positive Mitigated", "Host isolated and malicious persistence artifact removed.", 1, random.randint(45, 120)))
            else:
                # Direct alert closure
                close_id = f"CLS-{ent['code']}-{i:04d}"
                closed_at = (curr_time + timedelta(seconds=triage_sec)).strftime("%Y-%m-%d %H:%M:%S")
                cursor.execute("""
                INSERT INTO closures (id, case_id, alert_id, closed_at, closed_by, resolution_type, root_cause_summary, supervisory_signoff, duration_minutes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (close_id, None, alert_id, closed_at, analyst, "False Positive", "Routine administrator maintenance script triggered false alert.", 0, triage_sec / 60.0))

        # =========================================================================
        # INJECT GROUND-TRUTH SUPERVISORY ANOMALIES & NEGATIVE SPACE SCENARIOS
        # =========================================================================
        
        if "ENERGY" in ent["id"]:
            # 1. INJECT RULE-02 (Negative Space: Missing L2 Escalation on Confirmed SCADA Telemetry Spoofing)
            inj_alert_1 = "ALT-NPGC-SCADA-8801"
            inj_case_1 = "CAS-NPGC-SCADA-8801"
            t1 = datetime(2026, 4, 18, 14, 20, 0).strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute("""
            INSERT INTO alerts (id, entity_id, timestamp, source_tool, severity, category, target_host, target_ip, analyst_id, status, triage_duration_sec, summary)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (inj_alert_1, ent["id"], t1, "SCADA IDS / Nozomi", "Critical", "SCADA Invalidation / Telemetry Spoofing", "SCADA-RTU-SUBSTATION-11", "10.45.10.12", "ANALYST-NPGC-SCADA-1", "Closed", 900, "Unsolicited DNP3 function code 0x05 (Direct Operate) spoofed on Substation 11 RTU."))
            
            cursor.execute("""
            INSERT INTO cases (id, entity_id, alert_id, created_at, priority, owner_analyst, status, escalation_flag, sla_target_minutes, sla_breached)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, 60, 0)
            """, (inj_case_1, ent["id"], inj_alert_1, t1, "Critical", "ANALYST-NPGC-SCADA-1", "Closed"))
            
            cursor.execute("""
            INSERT INTO investigations (id, case_id, analyst_id, start_time, end_time, evidence_types_json, hash_artifacts, containment_action_logged, investigation_notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
            """, (f"INV-NPGC-8801", inj_case_1, "ANALYST-NPGC-SCADA-1", t1, (datetime(2026,4,18,15,10,0)).strftime("%Y-%m-%d %H:%M:%S"), json.dumps(["syslog"]), None, "Confirmed malicious packet payload altering substation voltage register. Case closed by L1 without escalating."))
            
            cursor.execute("""
            INSERT INTO closures (id, case_id, alert_id, closed_at, closed_by, resolution_type, root_cause_summary, supervisory_signoff, duration_minutes)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
            """, (f"CLS-NPGC-8801", inj_case_1, inj_alert_1, (datetime(2026,4,18,15,15,0)).strftime("%Y-%m-%d %H:%M:%S"), "ANALYST-NPGC-SCADA-1", "False Positive", "L1 operator attributed to test pulse without CISO or L2 verification.", 55.0))

            # 2. INJECT RULE-07 (Negative Space / Asset Discrepancy: Alert on Unmanaged SCADA Gateway)
            inj_alert_2 = "ALT-NPGC-SCADA-8802"
            t2 = datetime(2026, 4, 22, 11, 5, 0).strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute("""
            INSERT INTO alerts (id, entity_id, timestamp, source_tool, severity, category, target_host, target_ip, analyst_id, status, triage_duration_sec, summary)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (inj_alert_2, ent["id"], t2, "Darktrace Network NDR", "High", "Lateral Movement / Remote Execution", "UNMANAGED-PLC-GW-SUB-09", "10.45.12.89", "ANALYST-NPGC-SCADA-3", "Closed", 480, "Suspicious SMB/Modbus lateral sweep from unmanaged gateway."))

        elif "FIN" in ent["id"]:
            # 1. INJECT RULE-01 (Critical Speed-Closing in 42 seconds)
            inj_alert_3 = "ALT-ACBC-FIN-9901"
            t3 = datetime(2026, 4, 12, 10, 15, 0).strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute("""
            INSERT INTO alerts (id, entity_id, timestamp, source_tool, severity, category, target_host, target_ip, analyst_id, status, triage_duration_sec, summary)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (inj_alert_3, ent["id"], t3, "EDR SentinelOne", "Critical", "Ransomware / Memory Injection", "SWIFT-SAG-GATEWAY-01", "172.16.50.10", "ANALYST-ACBC-FIN-2", "Closed", 42, "Cobalt Strike beacon injection detected inside lsass.exe on SWIFT gateway host."))
            
            cursor.execute("""
            INSERT INTO closures (id, case_id, alert_id, closed_at, closed_by, resolution_type, root_cause_summary, supervisory_signoff, duration_minutes)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
            """, (f"CLS-ACBC-9901", None, inj_alert_3, (datetime(2026,4,12,10,15,42)).strftime("%Y-%m-%d %H:%M:%S"), "ANALYST-ACBC-FIN-2", "False Positive", "Marked as benign test scanner.", 0.7))

            # 2. INJECT RULE-05 (Shift-Boundary Mass Closure Dump: 26 tickets closed in 10 mins before shift change)
            dump_time_base = datetime(2026, 4, 25, 5, 48, 0)
            dump_analyst = "ANALYST-ACBC-FIN-4"
            for d_idx in range(1, 27):
                d_alert = f"ALT-ACBC-DUMP-{d_idx:03d}"
                d_time = (dump_time_base + timedelta(seconds=d_idx * 22)).strftime("%Y-%m-%d %H:%M:%S")
                cursor.execute("""
                INSERT INTO alerts (id, entity_id, timestamp, source_tool, severity, category, target_host, target_ip, analyst_id, status, triage_duration_sec, summary)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (d_alert, ent["id"], d_time, "Splunk", "Medium", "Credential Dumping / Brute Force", "ATM-SWITCH-GW-02", "172.16.40.15", dump_analyst, "Closed", 15, "Batch alert closed right before morning shift handover."))
                
                cursor.execute("""
                INSERT INTO closures (id, case_id, alert_id, closed_at, closed_by, resolution_type, root_cause_summary, supervisory_signoff, duration_minutes)
                VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
                """, (f"CLS-ACBC-DUMP-{d_idx:03d}", None, d_alert, d_time, dump_analyst, "False Positive", "Shift handover mass-clearing: non-actionable bulk noise.", 0.25))

            # 3. INJECT RULE-06 (Unauthorized Severity Downgrading: Critical -> Low)
            inj_alert_4 = "ALT-ACBC-FIN-9904"
            inj_case_4 = "CAS-ACBC-FIN-9904"
            t4 = datetime(2026, 4, 28, 16, 0, 0).strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute("""
            INSERT INTO alerts (id, entity_id, timestamp, source_tool, severity, category, target_host, target_ip, analyst_id, status, triage_duration_sec, summary)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (inj_alert_4, ent["id"], t4, "CyberArk PAS", "Critical", "Data Exfiltration Attempt", "CORE-CBS-ORACLE-DB", "172.16.50.25", "ANALYST-ACBC-FIN-1", "Closed", 1200, "Unencrypted DBA credential dump extracted from database vault."))
            
            cursor.execute("""
            INSERT INTO cases (id, entity_id, alert_id, created_at, priority, owner_analyst, status, escalation_flag, sla_target_minutes, sla_breached)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, 240, 0)
            """, (inj_case_4, ent["id"], inj_alert_4, t4, "Low", "ANALYST-ACBC-FIN-1", "Closed")) # Downgraded to Low priority
            
            cursor.execute("""
            INSERT INTO closures (id, case_id, alert_id, closed_at, closed_by, resolution_type, root_cause_summary, supervisory_signoff, duration_minutes)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
            """, (f"CLS-ACBC-9904", inj_case_4, inj_alert_4, (datetime(2026,4,28,17,30,0)).strftime("%Y-%m-%d %H:%M:%S"), "ANALYST-ACBC-FIN-1", "Benign", "Downgraded and closed as DBA administrative task without supervisor signoff.", 90.0))

        elif "TEL" in ent["id"]:
            # 1. INJECT RULE-03 (Negative Space: Missing Forensic Memory Dump on Confirmed Core Router Intrusion)
            inj_alert_5 = "ALT-MTE-TEL-7701"
            inj_case_5 = "CAS-MTE-TEL-7701"
            t5 = datetime(2026, 4, 14, 21, 30, 0).strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute("""
            INSERT INTO alerts (id, entity_id, timestamp, source_tool, severity, category, target_host, target_ip, analyst_id, status, triage_duration_sec, summary)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (inj_alert_5, ent["id"], t5, "Cisco Stealthwatch", "Critical", "Unauthorized Configuration Change", "BGP-EDGE-ROUTER-MUM", "192.168.1.1", "ANALYST-MTE-TELCO-2", "Closed", 1500, "BGP autonomous system prefix hijacking command injected into edge router memory."))
            
            cursor.execute("""
            INSERT INTO cases (id, entity_id, alert_id, created_at, priority, owner_analyst, status, escalation_flag, sla_target_minutes, sla_breached)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, 60, 0)
            """, (inj_case_5, ent["id"], inj_alert_5, t5, "Critical", "ANALYST-MTE-TELCO-2", "Closed"))
            
            cursor.execute("""
            INSERT INTO investigations (id, case_id, analyst_id, start_time, end_time, evidence_types_json, hash_artifacts, containment_action_logged, investigation_notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
            """, (f"INV-MTE-7701", inj_case_5, "ANALYST-MTE-TELCO-2", t5, (datetime(2026,4,14,23,0,0)).strftime("%Y-%m-%d %H:%M:%S"), json.dumps(["syslog"]), None, "Confirmed unauthorized config injection. Case closed without capturing router volatile memory dump or hashing binary patch."))

            cursor.execute("""
            INSERT INTO closures (id, case_id, alert_id, closed_at, closed_by, resolution_type, root_cause_summary, supervisory_signoff, duration_minutes)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
            """, (f"CLS-MTE-7701", inj_case_5, inj_alert_5, (datetime(2026,4,14,23,10,0)).strftime("%Y-%m-%d %H:%M:%S"), "ANALYST-MTE-TELCO-2", "True Positive Mitigated", "Router rebooted and password rotated. Forensics skipped.", 100.0))

    conn.commit()
    conn.close()
    print("Synthetic SOC operational datasets generated successfully.")

if __name__ == "__main__":
    generate_synthetic_soc_data()
