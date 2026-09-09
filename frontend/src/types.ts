export type EntitySector = 
  | 'Energy & Power'
  | 'Banking & Financial'
  | 'Telecommunications'
  | 'Defense & Strategic'
  | 'Healthcare Infrastructure';

export type FindingCategory = 
  | 'Execution Gap'
  | 'Negative Space'
  | 'Statistical & Workload'
  | 'Operational Anomaly'
  | 'Asset Visibility';

export type FindingSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

export type ReviewStatus = 
  | 'Pending Review'
  | 'Confirmed Supervisory Gap'
  | 'Flagged for Formal Inquiry'
  | 'Explained / Benign Exception'
  | 'Suppressed / Rule Refinement';

export interface User {
  username: string;
  full_name: string;
  role: 'examiner' | 'lead_auditor' | 'super_admin' | 'readonly';
  organization: string;
  badge_number: string;
}

export interface Entity {
  id: string;
  name: string;
  code: string;
  sector: EntitySector;
  criticality_tier: string;
  soc_contact: string;
  assessment_period: string;
  resilience_score: number;
  total_alerts: number;
  total_cases: number;
  total_findings: number;
}

export interface Finding {
  id: string;
  entity_id: string;
  entity_name: string;
  rule_id: string;
  title: string;
  category: FindingCategory;
  severity: FindingSeverity;
  priority_score: number;
  what: string;
  why: string;
  expected_workflow: string[];
  observed_workflow: string[];
  supporting_evidence: Record<string, any>;
  counterfactual_explanation: string;
  recommended_action: string;
  review_status: ReviewStatus;
  examiner_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface AnalyticsSummary {
  total_entities: number;
  total_alerts: number;
  total_cases: number;
  total_findings: number;
  critical_findings: number;
  average_resilience_score: number;
  category_distribution: Record<string, number>;
  review_status_distribution: Record<string, number>;
}

export interface NegativeSpaceMatrixItem {
  entity_id: string;
  entity_name: string;
  code: string;
  sector: string;
  missing_escalations: number;
  missing_forensics: number;
  missing_signoffs: number;
  unmanaged_assets: number;
  speed_closures: number;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  username: string;
  role: string;
  action: string;
  entity_id?: string;
  finding_id?: string;
  details: Record<string, any>;
}
