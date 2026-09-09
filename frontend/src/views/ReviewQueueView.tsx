import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  SlidersHorizontal,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { Finding, FindingCategory, FindingSeverity, ReviewStatus, Entity } from '../types';

interface ReviewQueueViewProps {
  findings: Finding[];
  selectedEntity: Entity | null;
  onSelectFinding: (finding: Finding) => void;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({
  findings,
  selectedEntity,
  onSelectFinding,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [minPriority, setMinPriority] = useState<number>(0);

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      // Entity match
      if (selectedEntity && f.entity_id !== selectedEntity.id) return false;

      // Search match
      if (
        searchTerm &&
        !f.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !f.what.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !f.rule_id.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !f.id.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Category match
      if (selectedCategory !== 'all' && f.category !== selectedCategory) return false;

      // Severity match
      if (selectedSeverity !== 'all' && f.severity !== selectedSeverity) return false;

      // Status match
      if (selectedStatus !== 'all' && f.review_status !== selectedStatus) return false;

      // Priority threshold
      if (f.priority_score < minPriority) return false;

      return true;
    });
  }, [findings, selectedEntity, searchTerm, selectedCategory, selectedSeverity, selectedStatus, minPriority]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="h-6 w-6 text-cyan-400" />
            <span>Supervisory Examiner Review Queue</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Prioritized list of candidate operational gaps, missing evidence anomalies, and supervisory flags.
            {selectedEntity && (
              <span className="text-cyan-300 font-semibold ml-1">
                Filtered by: {selectedEntity.name}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <span>Showing:</span>
          <span className="font-bold text-cyan-300 px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
            {filteredFindings.length} / {findings.length}
          </span>
          <span>Findings</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-cyan-500/20 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Title, Rule, Host..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by Category"
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Finding Categories</option>
              <option value="Execution Gap">Execution Gap</option>
              <option value="Negative Space">Negative Space</option>
              <option value="Statistical & Workload">Statistical & Workload</option>
              <option value="Operational Anomaly">Operational Anomaly (ML)</option>
              <option value="Asset Visibility">Asset Visibility</option>
            </select>
          </div>

          {/* Severity Dropdown */}
          <div>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              aria-label="Filter by Severity"
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Severities</option>
              <option value="Critical">Critical Severity</option>
              <option value="High">High Severity</option>
              <option value="Medium">Medium Severity</option>
              <option value="Low">Low Severity</option>
            </select>
          </div>

          {/* Review Status Dropdown */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by Review Status"
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Review Statuses</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Confirmed Supervisory Gap">Confirmed Supervisory Gap</option>
              <option value="Flagged for Formal Inquiry">Flagged for Formal Inquiry</option>
              <option value="Explained / Benign Exception">Explained / Benign</option>
              <option value="Suppressed / Rule Refinement">Suppressed</option>
            </select>
          </div>
        </div>

        {/* Priority Threshold Slider */}
        <div className="flex items-center gap-4 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-medium">
            <SlidersHorizontal className="h-3.5 w-3.5 text-cyan-400" />
            <span>Minimum Priority Threshold:</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={minPriority}
            onChange={(e) => setMinPriority(Number(e.target.value))}
            className="w-48 accent-cyan-400 cursor-pointer"
          />
          <span className="font-mono font-bold text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {minPriority}/100
          </span>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-3">
        {filteredFindings.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 space-y-3">
            <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-400" />
            <div className="text-base font-bold text-slate-200">No Matching Findings</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No operational gaps meet the current filter criteria. Adjust your search or lower the priority threshold.
            </p>
          </div>
        ) : (
          filteredFindings.map((finding) => (
            <div
              key={finding.id}
              onClick={() => onSelectFinding(finding)}
              className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900/60 transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold font-mono border ${
                      finding.severity === 'Critical'
                        ? 'bg-red-950/80 text-red-400 border-red-500/40 glow-red'
                        : finding.severity === 'High'
                        ? 'bg-amber-950/80 text-amber-400 border-amber-500/40'
                        : 'bg-blue-950/80 text-blue-400 border-blue-500/40'
                    }`}
                  >
                    {finding.severity.toUpperCase()}
                  </span>

                  <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
                    {finding.category}
                  </span>

                  <span className="text-xs font-mono text-slate-400">
                    RULE: {finding.rule_id}
                  </span>

                  <span className="text-xs font-semibold text-slate-300">
                    • {finding.entity_name}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      finding.review_status === 'Pending Review'
                        ? 'bg-amber-950/50 text-amber-400 border border-amber-500/30'
                        : finding.review_status.includes('Confirmed')
                        ? 'bg-red-950/60 text-red-400 border border-red-500/40'
                        : 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {finding.review_status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                  {finding.title}
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {finding.what}
                </p>
              </div>

              {/* Priority & Action */}
              <div className="flex items-center gap-5 shrink-0 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-5">
                <div className="text-left md:text-right">
                  <div className="text-[10px] uppercase font-mono text-slate-400">Priority Score</div>
                  <div className="text-xl font-extrabold text-cyan-300 font-mono">
                    {finding.priority_score}<span className="text-xs text-slate-500">/100</span>
                  </div>
                </div>

                <button
                  className="px-3.5 py-2 rounded-xl bg-cyan-950/80 group-hover:bg-cyan-600 text-cyan-300 group-hover:text-white border border-cyan-500/40 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Inspect</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
