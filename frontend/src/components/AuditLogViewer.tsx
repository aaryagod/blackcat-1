import React from 'react';
import { History, ShieldCheck, User, Clock, Hash } from 'lucide-react';
import { AuditLogItem } from '../types';

interface AuditLogViewerProps {
  logs: AuditLogItem[];
  onRefresh: () => void;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ logs, onRefresh }) => {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
          <History className="h-5 w-5" />
          <span>Immutable Examiner Supervisory Audit Trail</span>
        </div>

        <button
          onClick={onRefresh}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white"
        >
          Refresh Log Trail
        </button>
      </div>

      <div className="space-y-3">
        {logs.map((log) => (
          <div
            key={log.id}
            className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono"
          >
            <div className="flex items-start sm:items-center gap-3">
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold">
                {log.action}
              </span>
              <div>
                <div className="text-slate-200 font-semibold flex items-center gap-2">
                  <span>{log.username}</span>
                  <span className="text-slate-500">({log.role})</span>
                  {log.finding_id && (
                    <span className="text-cyan-400 text-[11px]">➔ {log.finding_id}</span>
                  )}
                </div>
                {log.details && Object.keys(log.details).length > 0 && (
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {JSON.stringify(log.details)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-500 text-[11px] shrink-0">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(log.timestamp).toLocaleString()}
              </span>
              <span className="text-slate-600">[{log.id}]</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
