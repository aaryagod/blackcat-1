from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

class EntitySector(str, Enum):
    POWER_GRID = "Energy & Power"
    BANKING = "Banking & Financial"
    TELECOM = "Telecommunications"
    DEFENSE = "Defense & Strategic"
    HEALTHCARE = "Healthcare Infrastructure"

class FindingCategory(str, Enum):
    EXECUTION_GAP = "Execution Gap"
    NEGATIVE_SPACE = "Negative Space"
    STATISTICAL_WORKLOAD = "Statistical & Workload"
    UNSUPERVISED_ANOMALY = "Operational Anomaly"
    ASSET_VISIBILITY = "Asset Visibility"

class FindingSeverity(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class ReviewStatus(str, Enum):
    PENDING_REVIEW = "Pending Review"
    CONFIRMED_GAP = "Confirmed Supervisory Gap"
    FORMAL_INQUIRY = "Flagged for Formal Inquiry"
    EXPLAINED_BENIGN = "Explained / Benign Exception"
    SUPPRESSED = "Suppressed / Rule Refinement"

class UserRole(str, Enum):
    SUPERVISORY_EXAMINER = "examiner"
    LEAD_AUDITOR = "lead_auditor"
    SUPER_ADMIN = "super_admin"
    READ_ONLY = "readonly"

# Database & Ingestion Models
class Entity(BaseModel):
    id: str
    name: str
    code: str
    sector: EntitySector
    criticality_tier: str = "Tier-1"
    soc_contact: str
    assessment_period: str = "Q2-2026"
    resilience_score: float = 75.0
    total_alerts: int = 0
    total_cases: int = 0
    total_findings: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AlertRecord(BaseModel):
    id: str
    entity_id: str
    timestamp: str
    source_tool: str
    severity: str # Critical, High, Medium, Low
    category: str # Ransomware, Data Exfiltration, SCADA Invalidation, DDoS, Brute Force, etc.
    target_host: str
    target_ip: str
    analyst_id: str
    status: str # Open, In-Progress, Closed, Escalated
    triage_duration_sec: int
    summary: str

class CaseRecord(BaseModel):
    id: str
    entity_id: str
    alert_id: str
    created_at: str
    priority: str
    owner_analyst: str
    status: str
    escalation_flag: bool = False
    sla_target_minutes: int = 60
    sla_breached: bool = False

class InvestigationRecord(BaseModel):
    id: str
    case_id: str
    analyst_id: str
    start_time: str
    end_time: str
    evidence_types_attached: List[str] = [] # e.g. ["pcap", "hash", "memory_dump", "edr_telemetry"]
    hash_artifacts: Optional[str] = None
    containment_action_logged: bool = False
    investigation_notes: str

class EscalationRecord(BaseModel):
    id: str
    case_id: str
    escalated_by: str
    escalated_to: str # L2, L3, CISO, CERT-In
    escalation_timestamp: str
    ack_timestamp: Optional[str] = None
    justification: str

class ClosureRecord(BaseModel):
    id: str
    case_id: Optional[str] = None
    alert_id: str
    closed_at: str
    closed_by: str
    resolution_type: str # False Positive, True Positive Mitigated, Benign, Auto-Closed
    root_cause_summary: str
    supervisory_signoff: bool = False
    duration_minutes: float

class AssetRecord(BaseModel):
    id: str
    entity_id: str
    hostname: str
    ip_address: str
    asset_type: str # SCADA Gateway, Core SWIFT Node, Core Router, Workstation, Server
    criticality: str # Tier-1 Mission Critical, Tier-2, Tier-3
    owner_dept: str
    is_in_active_inventory: bool = True

# Explainable Finding Model
class Finding(BaseModel):
    id: str
    entity_id: str
    entity_name: str
    rule_id: str
    title: str
    category: FindingCategory
    severity: FindingSeverity
    priority_score: int = Field(ge=0, le=100) # 0 to 100
    what: str
    why: str
    expected_workflow: List[str]
    observed_workflow: List[str]
    supporting_evidence: Dict[str, Any]
    counterfactual_explanation: str
    recommended_action: str
    review_status: ReviewStatus = ReviewStatus.PENDING_REVIEW
    examiner_notes: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

# Auth & User Models
class User(BaseModel):
    username: str
    full_name: str
    role: UserRole
    organization: str = "NCIIPC / Supervisory Directorate"
    badge_number: str = "EXAM-2026-99"

class UserLoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class AuditLogEntry(BaseModel):
    id: str
    timestamp: str
    username: str
    role: str
    action: str
    entity_id: Optional[str] = None
    finding_id: Optional[str] = None
    details: Dict[str, Any] = {}

class ReviewDecisionRequest(BaseModel):
    status: ReviewStatus
    examiner_notes: str
