import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  FileCheck2,
  HelpCircle,
  Sparkles,
  Send,
  Building,
  Hash,
  Clock,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { Finding, ReviewStatus } from '../types';
import { WorkflowTimeline } from './WorkflowTimeline';

interface FindingDetailModalProps {
  finding: Finding | null;
  onClose: () => void;
  onSubmitReview: (findingId: string, status: ReviewStatus, notes: string) => Promise<void>;
  isSubmitting?: boolean;
}

export const FindingDetailModal: React.FC<FindingDetailModalProps> = ({
  finding,
  onClose,
  onSubmitReview,
  isSubmitting = false,
}) => {
  if (!finding) return null;

  const [selectedStatus, setSelectedStatus] = useState<ReviewStatus>(finding.review_status);
  const [examinerNotes, setExaminerNotes] = useState<string>(finding.examiner_notes || '');
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSaveDecision = async () => {
    await onSubmitReview(finding.id, selectedStatus, examinerNotes);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'Critical':
        return 'bg-red-950/80 text-red-400 border-red-500/40 glow-red';
      case 'High':
        return 'bg-amber-950/80 text-amber-400 border-amber-500/40';
      case 'Medium':
        return 'bg-blue-950/80 text-blue-400 border-blue-500/40';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0b1120] border border-cyan-500/30 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-900/60">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold font-mono border ${getSeverityBadge(finding.severity)}`}>
                {finding.severity.toUpperCase()}
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
                {finding.category}
              </span>
              <span className="text-xs font-mono text-slate-400">
                RULE: {finding.rule_id} | ID: {finding.id}
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              {finding.title}
            </h2>

            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-cyan-300 font-medium">
                <Building className="h-3.5 w-3.5" />
                {finding.entity_name}
              </span>
              <span className="flex items-center gap-1.5 font-mono">
                <Clock className="h-3.5 w-3.5" />
                Detected: {new Date(finding.created_at).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Priority Score Gauge */}
            <div className="text-center p-2 rounded-xl bg-slate-950/80 border border-cyan-500/40 glow-cyan">
              <div className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold">Priority</div>
              <div className="text-2xl font-extrabold text-cyan-300 font-mono">
                {finding.priority_score}<span className="text-xs text-slate-500">/100</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* WHAT & WHY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                <span>What Happened (Operational Signal)</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-xs">
                {finding.what}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileCheck2 className="h-4 w-4" />
                <span>Supervisory Rationale (Regulatory Why)</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-xs">
                {finding.why}
              </p>
            </div>
          </div>

          {/* Workflow Comparison Visualizer */}
          <div>
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Workflow Reconstruction & Negative Space Diff
            </div>
            <WorkflowTimeline
              expected={finding.expected_workflow}
              observed={finding.observed_workflow}
            />
          </div>

          {/* Counterfactual Explanation Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 to-blue-950/30 border border-purple-500/30">
            <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs uppercase tracking-wider mb-1.5">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span>Counterfactual Supervisory Explanation</span>
            </div>
            <p className="text-slate-300 text-xs italic leading-relaxed">
              "{finding.counterfactual_explanation}"
            </p>
          </div>

          {/* Supporting Evidence Records Table */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Hash className="h-4 w-4" />
              <span>Supporting Audit Evidence Records</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(finding.supporting_evidence).map(([k, v]) => (
                <div key={k} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">{k.replace(/_/g, ' ')}</div>
                  <div className="text-xs font-mono font-semibold text-slate-200 mt-0.5 truncate">
                    {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Supervisory Action */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-cyan-500/20">
            <div className="text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <span>Recommended Examiner Action</span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              {finding.recommended_action}
            </p>
          </div>

          {/* Examiner Triage & Review Decision Form */}
          <div className="p-5 rounded-xl bg-slate-900/90 border border-cyan-500/40 mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                Examiner Review & Disposition Decision
              </div>
              {successMsg && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Decision Saved & Audit Logged</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                  Review Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as ReviewStatus)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Pending Review">Pending Review</option>
                  <option value="Confirmed Supervisory Gap">Confirmed Supervisory Gap</option>
                  <option value="Flagged for Formal Inquiry">Flagged for Formal Inquiry (Notice)</option>
                  <option value="Explained / Benign Exception">Explained / Benign Exception</option>
                  <option value="Suppressed / Rule Refinement">Suppressed / Rule Refinement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                  Examiner Annotation Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Verified lack of CISO escalation during Q2 onsite audit..."
                  value={examinerNotes}
                  onChange={(e) => setExaminerNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveDecision}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSubmitting ? 'Recording Audit...' : 'Save Examiner Decision'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
