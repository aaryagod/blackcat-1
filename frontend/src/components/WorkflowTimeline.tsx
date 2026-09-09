import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, ShieldCheck, FileWarning } from 'lucide-react';

interface WorkflowTimelineProps {
  expected: string[];
  observed: string[];
}

export const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({ expected, observed }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-4">
      {/* 1. Expected Standard Operational Flow */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30">
        <div className="flex items-center gap-2 mb-3 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
          <ShieldCheck className="h-4 w-4" />
          <span>Expected Supervisory Baseline Workflow</span>
        </div>

        <div className="space-y-3 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-emerald-500/20">
          {expected.map((step, idx) => (
            <div key={idx} className="flex items-start gap-3 relative z-10">
              <div className="h-7 w-7 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center shrink-0 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="text-xs text-slate-300 font-medium pt-1 leading-relaxed bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 flex-1 font-mono">
                {step}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Observed Flow Reconstructed from Submitted Records */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-red-500/30">
        <div className="flex items-center gap-2 mb-3 text-red-400 font-semibold text-xs uppercase tracking-wider">
          <FileWarning className="h-4 w-4" />
          <span>Observed Operational Flow (Evidence Reconstruction)</span>
        </div>

        <div className="space-y-3 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-red-500/20">
          {observed.map((step, idx) => {
            const isGap = step.includes('[GAP]') || step.includes('[ABSENT]') || step.includes('Speed-Close');
            return (
              <div key={idx} className="flex items-start gap-3 relative z-10">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                    isGap
                      ? 'bg-red-950 border border-red-500 text-red-400 animate-pulse'
                      : 'bg-slate-900 border border-slate-700 text-slate-400'
                  }`}
                >
                  {isGap ? <XCircle className="h-4 w-4" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                </div>
                <div
                  className={`text-xs font-medium pt-1 leading-relaxed p-2 rounded-lg border flex-1 font-mono ${
                    isGap
                      ? 'bg-red-950/40 border-red-500/40 text-red-200'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                  }`}
                >
                  {step}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
