import sqlite3
import json
import os
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "satsa_database.sqlite")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Entities
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS entities (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        sector TEXT NOT NULL,
        criticality_tier TEXT NOT NULL,
        soc_contact TEXT,
        assessment_period TEXT,
        resilience_score REAL DEFAULT 75.0,
        total_alerts INTEGER DEFAULT 0,
        total_cases INTEGER DEFAULT 0,
        total_findings INTEGER DEFAULT 0,
        created_at TEXT
    )
    """)
    
    # 2. Alerts
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        entity_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        source_tool TEXT,
        severity TEXT NOT NULL,
        category TEXT,
        target_host TEXT,
        target_ip TEXT,
        analyst_id TEXT,
        status TEXT,
        triage_duration_sec INTEGER,
        summary TEXT,
        FOREIGN KEY (entity_id) REFERENCES entities(id)
    )
    """)
    
    # 3. Cases
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cases (
        id TEXT PRIMARY KEY,
        entity_id TEXT NOT NULL,
        alert_id TEXT,
        created_at TEXT NOT NULL,
        priority TEXT,
        owner_analyst TEXT,
        status TEXT,
        escalation_flag INTEGER DEFAULT 0,
        sla_target_minutes INTEGER DEFAULT 60,
        sla_breached INTEGER DEFAULT 0,
        FOREIGN KEY (entity_id) REFERENCES entities(id)
    )
    """)
    
    # 4. Investigations
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS investigations (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        analyst_id TEXT,
        start_time TEXT,
        end_time TEXT,
        evidence_types_json TEXT,
        hash_artifacts TEXT,
        containment_action_logged INTEGER DEFAULT 0,
        investigation_notes TEXT,
        FOREIGN KEY (case_id) REFERENCES cases(id)
    )
    """)
    
    # 5. Escalations
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS escalations (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        escalated_by TEXT,
        escalated_to TEXT,
        escalation_timestamp TEXT,
        ack_timestamp TEXT,
        justification TEXT,
        FOREIGN KEY (case_id) REFERENCES cases(id)
    )
    """)
    
    # 6. Closures
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS closures (
        id TEXT PRIMARY KEY,
        case_id TEXT,
        alert_id TEXT,
        closed_at TEXT NOT NULL,
        closed_by TEXT,
        resolution_type TEXT,
        root_cause_summary TEXT,
        supervisory_signoff INTEGER DEFAULT 0,
        duration_minutes REAL
    )
    """)
    
    # 7. Assets
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        entity_id TEXT NOT NULL,
        hostname TEXT NOT NULL,
        ip_address TEXT,
        asset_type TEXT,
        criticality TEXT,
        owner_dept TEXT,
        is_in_active_inventory INTEGER DEFAULT 1,
        FOREIGN KEY (entity_id) REFERENCES entities(id)
    )
    """)
    
    # 8. Findings (Explainable Findings)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS findings (
        id TEXT PRIMARY KEY,
        entity_id TEXT NOT NULL,
        entity_name TEXT NOT NULL,
        rule_id TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        severity TEXT NOT NULL,
        priority_score INTEGER NOT NULL,
        what TEXT NOT NULL,
        why TEXT NOT NULL,
        expected_workflow_json TEXT NOT NULL,
        observed_workflow_json TEXT NOT NULL,
        supporting_evidence_json TEXT NOT NULL,
        counterfactual_explanation TEXT NOT NULL,
        recommended_action TEXT NOT NULL,
        review_status TEXT DEFAULT 'Pending Review',
        examiner_notes TEXT,
        reviewed_by TEXT,
        reviewed_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (entity_id) REFERENCES entities(id)
    )
    """)
    
    # 9. Audit Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        username TEXT NOT NULL,
        role TEXT NOT NULL,
        action TEXT NOT NULL,
        entity_id TEXT,
        finding_id TEXT,
        details_json TEXT
    )
    """)
    
    # 10. Users
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL,
        organization TEXT,
        badge_number TEXT
    )
    """)
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at", DB_PATH)
