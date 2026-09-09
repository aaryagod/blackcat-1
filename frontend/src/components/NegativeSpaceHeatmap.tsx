import React from 'react';
import { AlertOctagon, HelpCircle, ArrowUpRight } from 'lucide-react';
import { NegativeSpaceMatrixItem } from '../types';

interface NegativeSpaceHeatmapProps {
  data: NegativeSpaceMatrixItem[];
  onSelectCell?: (entityId: string, dimension: string) => void;
}

export const NegativeSpaceHeatmap: React.FC<NegativeSpaceHeatmapProps> = ({ data, onSelectCell }) => {
  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-slate-900/60 text-slate-500 border-slate-800';
    if (count <= 2) return 'bg-blue-950/60 text-blue-300 border-blue-800/50';
    if (count <= 6) return 'bg-amber-950/60 text-amber-300 border-amber-800/60';
    return 'bg-red-950/80 text-red-300 border-red-500/50 font-bold glow-red';
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
            <AlertOctagon className="h-5 w-5" />
            <span>Negative-Space Operational Evidence Matrix</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Audits absent expected workflow evidence across Critical Sector Entities (Missing Escalations, Forensics, Signoffs, Unmanaged Assets).
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400">Signal Density:</span>
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500">0</span>
            <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300">1-2</span>
            <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300">3-6</span>
            <span className="px-2 py-0.5 rounded bg-red-950 border border-red-500 text-red-300">7+</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">Critical Sector Entity</th>
              <th className="py-3 px-4">Sector</th>
              <th className="py-3 px-4 text-center">Missing L2/CISO Escalations</th>
              <th className="py-3 px-4 text-center">Missing Forensics / Hashes</th>
              <th className="py-3 px-4 text-center">Missing Signoffs (Downgrades)</th>
              <th className="py-3 px-4 text-center">Unmanaged / Shadow Assets</th>
              <th className="py-3 px-4 text-center">Premature Speed Closures</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {data.map((item) => (
              <tr key={item.entity_id} className="hover:bg-slate-900/40 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-slate-200">
                  <div className="flex items-center gap-2">
                    <span>{item.entity_name}</span>
                    <span className="text-[10px] font-mono text-cyan-400 font-normal">
                      ({item.code})
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-400">{item.sector}</td>

                <td className="py-3.5 px-4 text-center">
                  <span
                    onClick={() => onSelectCell && onSelectCell(item.entity_id, 'RULE-02')}
                    className={`inline-block px-3 py-1 rounded-lg border font-mono cursor-pointer transition-transform hover:scale-105 ${getIntensityClass(
                      item.missing_escalations
                    )}`}
                  >
                    {item.missing_escalations}
                  </span>
                </td>

                <td className="py-3.5 px-4 text-center">
                  <span
                    onClick={() => onSelectCell && onSelectCell(item.entity_id, 'RULE-03')}
                    className={`inline-block px-3 py-1 rounded-lg border font-mono cursor-pointer transition-transform hover:scale-105 ${getIntensityClass(
                      item.missing_forensics
                    )}`}
                  >
                    {item.missing_forensics}
                  </span>
                </td>

                <td className="py-3.5 px-4 text-center">
                  <span
                    onClick={() => onSelectCell && onSelectCell(item.entity_id, 'RULE-06')}
                    className={`inline-block px-3 py-1 rounded-lg border font-mono cursor-pointer transition-transform hover:scale-105 ${getIntensityClass(
                      item.missing_signoffs
                    )}`}
                  >
                    {item.missing_signoffs}
                  </span>
                </td>

                <td className="py-3.5 px-4 text-center">
                  <span
                    onClick={() => onSelectCell && onSelectCell(item.entity_id, 'RULE-07')}
                    className={`inline-block px-3 py-1 rounded-lg border font-mono cursor-pointer transition-transform hover:scale-105 ${getIntensityClass(
                      item.unmanaged_assets
                    )}`}
                  >
                    {item.unmanaged_assets}
                  </span>
                </td>

                <td className="py-3.5 px-4 text-center">
                  <span
                    onClick={() => onSelectCell && onSelectCell(item.entity_id, 'RULE-01')}
                    className={`inline-block px-3 py-1 rounded-lg border font-mono cursor-pointer transition-transform hover:scale-105 ${getIntensityClass(
                      item.speed_closures
                    )}`}
                  >
                    {item.speed_closures}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
