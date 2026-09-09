import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
  color?: 'cyan' | 'red' | 'amber' | 'emerald' | 'purple';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendPositive,
  color = 'cyan',
}) => {
  const colorMap = {
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      glow: 'hover:shadow-cyan-500/10',
      iconBg: 'bg-cyan-950/60 text-cyan-400 border-cyan-500/30',
      valText: 'text-cyan-300',
    },
    red: {
      border: 'border-red-500/20 hover:border-red-500/40',
      glow: 'hover:shadow-red-500/10',
      iconBg: 'bg-red-950/60 text-red-400 border-red-500/30',
      valText: 'text-red-400',
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      glow: 'hover:shadow-amber-500/10',
      iconBg: 'bg-amber-950/60 text-amber-400 border-amber-500/30',
      valText: 'text-amber-300',
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      glow: 'hover:shadow-emerald-500/10',
      iconBg: 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30',
      valText: 'text-emerald-300',
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/40',
      glow: 'hover:shadow-purple-500/10',
      iconBg: 'bg-purple-950/60 text-purple-400 border-purple-500/30',
      valText: 'text-purple-300',
    },
  };

  const scheme = colorMap[color];

  return (
    <div
      className={`glass-panel p-5 rounded-2xl border ${scheme.border} transition-all duration-300 hover:shadow-xl ${scheme.glow} relative overflow-hidden`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-medium text-slate-400 tracking-wide uppercase">
            {title}
          </span>
          <div className={`text-3xl font-extrabold mt-1 tracking-tight font-mono ${scheme.valText}`}>
            {value}
          </div>
        </div>

        <div className={`p-3 rounded-xl border ${scheme.iconBg}`}>
          {icon}
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-400 font-medium">{subtitle}</span>}
          {trend && (
            <span
              className={`font-semibold font-mono ${
                trendPositive ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
