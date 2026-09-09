import React from 'react';
import { ShieldCheck, ShieldAlert, Award, AlertTriangle, ExternalLink } from 'lucide-react';
import { Entity } from '../types';

interface CSEComparisonTableProps {
  entities: Entity[];
  onSelectEntity: (entity: Entity) => void;
}

export const CSEComparisonTable: React.FC<CSEComparisonTableProps> = ({ entities, onSelectEntity }) => {
  const getResilienceBadge = (score: number) => {
    if (score >= 80) {
      return {
        label: 'Resilient Tier',
        color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30',
        icon: <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />,
      };
    }
    if (score >= 60) {
      return {
        label: 'Supervisory Review',
        color: 'text-amber-400 bg-amber-950/60 border-amber-500/30',
        icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />,
      };
    }
    return {
      label: 'Critical Focus',
      color: 'text-red-400 bg-red-950/80 border-red-500/50 glow-red',
      icon: <ShieldAlert className="h-3.5 w-3.5 text-red-400" />,
    };
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
            <Award className="h-5 w-5" />
            <span>Critical Sector Entity (CSE) Resilience Scoreboard</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Supervisory rank derived from operational workflow completeness, execution gaps, and negative-space signals.
          </p>
        </div>

        <span className="text-xs font-mono px-3 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300">
          Period: Q2-2026 Assessment
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">Supervisory Rank</th>
              <th className="py-3 px-4">Entity Details</th>
              <th className="py-3 px-4">Sector & Tier</th>
              <th className="py-3 px-4 text-center">Alerts / Cases</th>
              <th className="py-3 px-4 text-center">Operational Findings</th>
              <th className="py-3 px-4 text-center">Cyber Resilience Index</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {entities.map((entity, idx) => {
              const resBadge = getResilienceBadge(entity.resilience_score);
              return (
                <tr key={entity.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                    #{idx + 1}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-100">{entity.name}</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {entity.code} | {entity.soc_contact}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-slate-200">{entity.sector}</div>
                    <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                      {entity.criticality_tier}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono">
                    <span className="text-slate-200">{entity.total_alerts}</span>
                    <span className="text-slate-500"> / </span>
                    <span className="text-cyan-400">{entity.total_cases}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2.5 py-1 rounded-full font-mono font-bold bg-slate-900 border border-slate-700 text-amber-400">
                      {entity.total_findings}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg border font-mono font-bold flex items-center gap-1.5 ${resBadge.color}`}>
                        {resBadge.icon}
                        <span>{entity.resilience_score} / 100</span>
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onSelectEntity(entity)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/50 border border-cyan-500/30 text-cyan-300 text-xs font-semibold inline-flex items-center gap-1 transition-all"
                    >
                      <span>Drill-down</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
