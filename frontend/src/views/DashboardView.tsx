import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  FileSearch,
  Activity,
  Award,
  ArrowRight,
  TrendingDown,
  Layers,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { AnalyticsSummary, Entity, Finding, NegativeSpaceMatrixItem } from '../types';
import { MetricCard } from '../components/MetricCard';
import { NegativeSpaceHeatmap } from '../components/NegativeSpaceHeatmap';

interface DashboardViewProps {
  summary: AnalyticsSummary | null;
  entities: Entity[];
  topFindings: Finding[];
  negativeSpaceMatrix: NegativeSpaceMatrixItem[];
  onSelectFinding: (finding: Finding) => void;
  onNavigateTab: (tab: any) => void;
  onSelectEntity: (entity: Entity) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  entities,
  topFindings,
  negativeSpaceMatrix,
  onSelectFinding,
  onNavigateTab,
  onSelectEntity,
}) => {
  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 relative overflow-hidden bg-gradient-to-r from-[#0b1120] via-cyan-950/20 to-[#0b1120]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest font-bold">
              <Activity className="h-4 w-4 animate-pulse" />
              <span>NCIIPC Supervisory Assessment Live Status</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight mt-1">
              Critical Sector SOC Resilience & Supervisory Analytics
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Automated offline workflow reconstruction, negative-space reasoning, and execution-gap detection across Energy, Banking, and Telecom Critical Sector Entities (CSEs).
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateTab('review-queue')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
            >
              <span>Inspect Review Queue</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Critical Sector Entities"
          value={summary?.total_entities || entities.length}
          subtitle="Tier-1 National Infrastructure"
          icon={<Award className="h-6 w-6" />}
          color="cyan"
        />

        <MetricCard
          title="Operational Findings"
          value={summary?.total_findings || 0}
          subtitle={`${summary?.critical_findings || 0} Critical Priority Signals`}
          icon={<ShieldAlert className="h-6 w-6" />}
          color="red"
          trend="Prioritized for Examiner Review"
          trendPositive={false}
        />

        <MetricCard
          title="Average Cyber Resilience"
          value={`${summary?.average_resilience_score || 64.5}%`}
          subtitle="Q2-2026 Sector Baseline"
          icon={<Activity className="h-6 w-6" />}
          color="amber"
          trend="Target: >= 85%"
          trendPositive={true}
        />

        <MetricCard
          title="Total SOC Ingested Logs"
          value={`${(summary?.total_alerts || 0) + (summary?.total_cases || 0)}`}
          subtitle={`${summary?.total_alerts || 0} Alerts | ${summary?.total_cases || 0} Cases`}
          icon={<Layers className="h-6 w-6" />}
          color="purple"
        />
      </div>

      {/* Main Split: Highest Priority Review Candidates & Sector Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Review Queue Preview (2 Cols) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-cyan-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
              <ShieldAlert className="h-5 w-5 text-red-400" />
              <span>Highest Priority Supervisory Action Items</span>
            </div>

            <button
              onClick={() => onNavigateTab('review-queue')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              <span>View All ({summary?.total_findings || 0})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {topFindings.slice(0, 5).map((finding) => (
              <div
                key={finding.id}
                onClick={() => onSelectFinding(finding)}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                        finding.severity === 'Critical'
                          ? 'bg-red-950/80 text-red-400 border-red-500/40 glow-red'
                          : 'bg-amber-950/80 text-amber-400 border-amber-500/40'
                      }`}
                    >
                      {finding.severity.toUpperCase()}
                    </span>

                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
                      {finding.category}
                    </span>

                    <span className="text-[11px] font-mono text-slate-400">
                      {finding.rule_id}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                    {finding.title}
                  </div>

                  <div className="text-[11px] text-slate-400 line-clamp-1">
                    {finding.what}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 sm:text-right">
                  <div>
                    <div className="text-[10px] uppercase font-mono text-slate-400">Priority</div>
                    <div className="text-base font-extrabold text-cyan-300 font-mono">
                      {finding.priority_score}<span className="text-[10px] text-slate-500">/100</span>
                    </div>
                  </div>

                  <span className="p-2 rounded-lg bg-slate-800/80 group-hover:bg-cyan-950 text-slate-400 group-hover:text-cyan-400 border border-slate-700 group-hover:border-cyan-500/40 transition-all">
                    <ExternalLink className="h-4 w-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Entity Cyber Resilience Breakdown (1 Col) */}
        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
              <Award className="h-5 w-5" />
              <span>CSE Cyber Resilience Index</span>
            </div>

            <button
              onClick={() => onNavigateTab('benchmarks')}
              className="text-xs text-slate-400 hover:text-cyan-300"
            >
              Compare
            </button>
          </div>

          <div className="space-y-4">
            {entities.map((entity) => (
              <div
                key={entity.id}
                onClick={() => onSelectEntity(entity)}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-200">{entity.name}</span>
                  <span className="font-mono font-extrabold text-cyan-300">
                    {entity.resilience_score} / 100
                  </span>
                </div>

                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      entity.resilience_score >= 80
                        ? 'bg-emerald-500'
                        : entity.resilience_score >= 60
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${entity.resilience_score}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
                  <span>{entity.sector}</span>
                  <span className="text-amber-400">{entity.total_findings} findings</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Negative-Space Matrix Preview */}
      <NegativeSpaceHeatmap
        data={negativeSpaceMatrix}
        onSelectCell={(eid) => {
          const found = entities.find((e) => e.id === eid);
          if (found) onSelectEntity(found);
          onNavigateTab('review-queue');
        }}
      />
    </div>
  );
};
