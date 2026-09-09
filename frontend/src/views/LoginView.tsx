import React, { useState } from 'react';
import { Shield, Lock, User as UserIcon, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { api, setAuthToken } from '../api';
import { User } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('examiner');
  const [password, setPassword] = useState('examiner123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await api.login(username, password);
      setAuthToken(data.access_token);
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRolePreset = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Cyber Grid Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-[#070b14]/90 to-[#070b14] pointer-events-none"></div>
      <div className="scanline"></div>

      <div className="w-full max-w-md relative z-10 space-y-8">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center glow-cyan shadow-2xl shadow-cyan-500/30">
            <Shield className="h-9 w-9 text-white" />
          </div>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-blue-400">
              SAT-SA
            </h1>
            <p className="text-xs uppercase tracking-widest text-cyan-400 font-mono font-bold mt-1">
              Supervisory Analytics Tool for SOC Assessment
            </p>
            <p className="text-xs text-slate-400 mt-1">
              National Critical Information Infrastructure Protection Centre (NCIIPC)
            </p>
          </div>
        </div>

        {/* Login Form Box */}
        <div className="glass-panel p-8 rounded-3xl border border-cyan-500/30 shadow-2xl shadow-cyan-950/40">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-cyan-400" />
              <span>Examiner Terminal Auth</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-bold">
              OFFLINE AIR-GAPPED
            </span>
          </div>

          {error && (
            <div className="p-3 mb-5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 mb-1.5 font-medium">
                Supervisory Officer ID / Username
              </label>
              <div className="relative">
                <UserIcon className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="examiner"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1.5 font-medium">
                Terminal Access Key / Password
              </label>
              <div className="relative">
                <KeyRound className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all"
            >
              <span>{isLoading ? 'Authenticating Terminal...' : 'Initialize Supervisory Session'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Preset Roles for Quick Evaluation */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="text-[11px] text-slate-400 font-medium mb-2.5">
              Quick Role Test Credentials (1-Click Fill):
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectRolePreset('examiner', 'examiner123')}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left text-[11px] transition-all"
              >
                <div className="font-semibold text-cyan-300">Examiner Officer</div>
                <div className="text-[10px] text-slate-500 font-mono">examiner / examiner123</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectRolePreset('lead_auditor', 'auditor123')}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left text-[11px] transition-all"
              >
                <div className="font-semibold text-purple-300">Lead Auditor</div>
                <div className="text-[10px] text-slate-500 font-mono">lead_auditor / auditor123</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
