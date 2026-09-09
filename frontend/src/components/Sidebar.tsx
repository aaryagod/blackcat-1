import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  AlertOctagon,
  BarChart3,
  FileText,
  UploadCloud,
  History,
  ShieldAlert,
} from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'review-queue'
  | 'negative-space'
  | 'benchmarks'
  | 'dossier'
  | 'ingest'
  | 'audit-trail';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingReviewsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingReviewsCount,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number; color?: string }[] = [
    {
      id: 'dashboard',
      label: 'Executive Overview',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      id: 'review-queue',
      label: 'Examiner Review Queue',
      icon: <CheckSquare className="h-4 w-4" />,
      badge: pendingReviewsCount,
      color: 'text-amber-400',
    },
    {
      id: 'negative-space',
      label: 'Negative-Space Engine',
      icon: <AlertOctagon className="h-4 w-4" />,
      color: 'text-crimson',
    },
    {
      id: 'benchmarks',
      label: 'Multi-CSE Benchmarks',
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      id: 'dossier',
      label: 'Supervisory Dossier',
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: 'ingest',
      label: 'Ingestion & Simulator',
      icon: <UploadCloud className="h-4 w-4" />,
    },
    {
      id: 'audit-trail',
      label: 'Audit Trail Logs',
      icon: <History className="h-4 w-4" />,
    },
  ];

  return (
    <aside className="w-64 bg-[#0b1120] border-r border-slate-800/80 flex flex-col justify-between p-4 shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-slate-500 uppercase px-3 mb-3">
            Supervisory Modules
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? 'bg-gradient-to-r from-cyan-950/90 to-blue-950/60 border border-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-950/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={active ? 'text-cyan-400' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Supervisory Regulatory Alert Box */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-1">
            <ShieldAlert className="h-4 w-4" />
            <span>NCIIPC Assessment Mandate</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Analytical outputs are advisory supervisory decision-support signals. Findings require human examiner verification before formal notices.
          </p>
        </div>
      </div>

      {/* Version Tag */}
      <div className="pt-4 border-t border-slate-800/80 text-[11px] font-mono text-slate-500 text-center">
        <div>SAT-SA Core v1.0.0-PROTOTYPE</div>
        <div className="text-[10px] text-slate-600">SIH Problem #26157</div>
      </div>
    </aside>
  );
};
