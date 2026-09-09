import React from 'react';
import { Shield, Radio, UserCheck, LogOut, RefreshCw } from 'lucide-react';
import { User, Entity } from '../types';

interface NavbarProps {
  user: User | null;
  selectedEntity: Entity | null;
  entities: Entity[];
  onSelectEntity: (entity: Entity | null) => void;
  onLogout: () => void;
  onRefreshData: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  selectedEntity,
  entities,
  onSelectEntity,
  onLogout,
  onRefreshData,
  isRefreshing = false,
}) => {
  return (
    <header className="h-16 border-b border-cyan-500/20 bg-[#0b1120]/90 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Brand & Mode Tag */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center glow-cyan shadow-lg shadow-cyan-500/20">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400">
                SAT-SA
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                Supervisory Core
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-tight">
              NCIIPC SOC Assessment & Decision Support Platform
            </p>
          </div>
        </div>

        {/* Air-Gapped Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-emerald-500/30 text-emerald-400 text-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-mono font-medium text-[11px]">OFFLINE AIR-GAPPED VERIFIED</span>
        </div>
      </div>

      {/* Entity Selector & User Bar */}
      <div className="flex items-center gap-4">
        {/* CSE Entity Filter Dropdown */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/60 rounded-lg px-3 py-1.5 text-sm">
          <Radio className="h-4 w-4 text-cyan-400" />
          <span className="text-xs text-slate-400 font-medium">Target CSE:</span>
          <select
            value={selectedEntity ? selectedEntity.id : 'all'}
            onChange={(e) => {
              if (e.target.value === 'all') {
                onSelectEntity(null);
              } else {
                const found = entities.find((ent) => ent.id === e.target.value);
                if (found) onSelectEntity(found);
              }
            }}
            aria-label="Target Critical Sector Entity"
            className="bg-transparent text-cyan-300 text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-slate-900 text-slate-200">
              ⚡ All Critical Sector Entities (Multi-CSE)
            </option>
            {entities.map((ent) => (
              <option key={ent.id} value={ent.id} className="bg-slate-900 text-slate-200">
                {ent.name} ({ent.code})
              </option>
            ))}
          </select>
        </div>

        {/* Re-run Analytics Trigger */}
        <button
          onClick={onRefreshData}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50 text-xs font-medium transition-all"
          title="Re-run Analytics Pipeline"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          <span className="hidden sm:inline">Sync Analysis</span>
        </button>

        {/* Examiner Profile Badge */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
            <div className="text-right hidden md:block">
              <div className="text-xs font-semibold text-slate-200 flex items-center justify-end gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
                {user.full_name}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {user.badge_number} | <span className="uppercase text-cyan-400">{user.role}</span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-2 rounded-lg bg-slate-900/80 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-800/50 transition-all"
              title="Sign Out of Supervisory Terminal"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
