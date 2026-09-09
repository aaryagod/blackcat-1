import React from 'react';
import { BarChart3, Award, TrendingUp, ShieldCheck, Activity } from 'lucide-react';
import { Entity } from '../types';
import { CSEComparisonTable } from '../components/CSEComparisonTable';

interface BenchmarkingViewProps {
  entities: Entity[];
  onSelectEntity: (entity: Entity) => void;
}

export const BenchmarkingView: React.FC<BenchmarkingViewProps> = ({
  entities,
  onSelectEntity,
}) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest font-bold">
          <BarChart3 className="h-4 w-4" />
          <span>Multi-Entity Cross-Sector Comparative Assessment</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight mt-1">
          Critical Sector Resilience Scoreboard & Benchmarks
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Supervisory comparative indexing across Energy (SCADA), Banking (Core SWIFT), and Telecommunications (5G Backbone) critical infrastructure sectors.
        </p>
      </div>

      {/* Main Scoreboard Table */}
      <CSEComparisonTable entities={entities} onSelectEntity={onSelectEntity} />

      {/* Sector Summary Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {entities.map((ent) => (
          <div
            key={ent.id}
            className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                  {ent.sector}
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-2">{ent.name}</h3>
                <div className="text-xs font-mono text-slate-400">{ent.code}</div>
              </div>

              <div className="text-right">
                <div className="text-[10px] uppercase font-mono text-slate-400">Resilience</div>
                <div className="text-2xl font-extrabold text-cyan-300 font-mono">
                  {ent.resilience_score}%
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Criticality Tier:</span>
                <span className="font-semibold text-slate-200">{ent.criticality_tier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Alert Volume:</span>
                <span className="font-mono text-slate-200">{ent.total_alerts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Investigated Cases:</span>
                <span className="font-mono text-cyan-400">{ent.total_cases}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Identified Findings:</span>
                <span className="font-mono font-bold text-amber-400">{ent.total_findings}</span>
              </div>
            </div>

            <button
              onClick={() => onSelectEntity(ent)}
              className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-semibold transition-all"
            >
              Examine Operational Dossier
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
