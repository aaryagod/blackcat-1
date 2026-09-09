import React, { useState, useEffect } from 'react';
import { FileText, Download, Copy, Printer, CheckCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import { api } from '../api';
import { Entity } from '../types';

interface ReportsViewProps {
  selectedEntity: Entity | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ selectedEntity }) => {
  const [dossier, setDossier] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchDossier = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAssessmentDossier(selectedEntity?.id);
      setDossier(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDossier();
  }, [selectedEntity]);

  const handleCopyMarkdown = () => {
    if (dossier?.markdown_content) {
      navigator.clipboard.writeText(dossier.markdown_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadReport = () => {
    if (!dossier?.markdown_content) return;
    const blob = new Blob([dossier.markdown_content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NCIIPC-SUPERVISORY-DOSSIER-${dossier.report_id}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest font-bold">
            <FileText className="h-4 w-4" />
            <span>Formal Supervisory Assessment Dossier</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight mt-1">
            Supervisory Audit Dossier & Formal Report
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Official NCIIPC supervisory findings summary suitable for official inquiry compilation and executive presentation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchDossier}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
            title="Refresh Dossier"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleCopyMarkdown}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all"
          >
            {copied ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Markdown'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all"
          >
            <Printer className="h-4 w-4" />
            <span>Print Dossier</span>
          </button>

          <button
            onClick={handleDownloadReport}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Download className="h-4 w-4" />
            <span>Export Dossier (.MD)</span>
          </button>
        </div>
      </div>

      {/* Dossier Preview Document */}
      {isLoading ? (
        <div className="glass-panel p-16 text-center rounded-3xl border border-slate-800 text-slate-400 text-xs">
          Generating supervisory assessment dossier...
        </div>
      ) : (
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-cyan-500/30 shadow-2xl space-y-8 bg-slate-950/90 max-w-5xl mx-auto">
          {/* Formal Letterhead */}
          <div className="border-b-2 border-cyan-500/40 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-widest font-mono font-extrabold text-cyan-400">
                Government of India — National Critical Information Infrastructure Protection Centre (NCIIPC)
              </div>
              <h2 className="text-xl font-bold text-slate-100 tracking-tight mt-1">
                SUPERVISORY CYBER RESILIENCE ASSESSMENT DOSSIER
              </h2>
              <div className="text-xs text-slate-400 mt-1 font-mono">
                Dossier ID: {dossier?.report_id} | Assessment Cycle: Q2-2026
              </div>
            </div>

            <div className="text-right font-mono text-xs text-slate-400">
              <div className="px-2.5 py-1 rounded bg-red-950/80 border border-red-500/40 text-red-400 font-bold text-[10px] uppercase inline-block mb-1">
                STRICTLY CONFIDENTIAL
              </div>
              <div>Lead Examiner: {dossier?.generated_by}</div>
              <div>Badge: {dossier?.badge_number}</div>
            </div>
          </div>

          {/* Dossier Content */}
          <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-6">
            <div>
              <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider mb-2">
                1. Executive Supervisory Summary
              </h3>
              <p className="text-slate-300">
                This supervisory assessment was generated through offline automated workflow reconstruction and negative-space analysis across {dossier?.entities?.length || 0} Critical Sector Entities. A total of <strong>{dossier?.total_findings || 0} prioritized operational findings</strong> have been documented for official examiner inquiry.
              </p>
            </div>

            {/* Scoreboard Table */}
            <div>
              <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider mb-3">
                2. Critical Sector Entity Resilience Scoreboard
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border border-slate-800 text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-[11px] uppercase font-mono text-slate-400">
                    <tr>
                      <th className="p-3">Entity Name</th>
                      <th className="p-3">Sector</th>
                      <th className="p-3">Tier</th>
                      <th className="p-3 text-center">Resilience Score</th>
                      <th className="p-3 text-center">Identified Findings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {dossier?.entities?.map((e: any) => (
                      <tr key={e.id}>
                        <td className="p-3 font-semibold text-slate-100">{e.name}</td>
                        <td className="p-3 text-slate-300">{e.sector}</td>
                        <td className="p-3 text-slate-400 font-mono text-[11px]">{e.criticality_tier}</td>
                        <td className="p-3 text-center font-mono font-bold text-cyan-300">{e.resilience_score} / 100</td>
                        <td className="p-3 text-center font-mono text-amber-400">{e.total_findings}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* High Priority Findings Section */}
            <div>
              <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider mb-3">
                3. High-Priority Supervisory Findings & Regulatory Notices
              </h3>

              <div className="space-y-4">
                {dossier?.high_priority_findings?.slice(0, 8).map((f: any, idx: number) => (
                  <div key={f.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100">
                        {idx + 1}. [{f.severity.toUpperCase()}] {f.title}
                      </span>
                      <span className="font-mono text-cyan-400 font-bold">
                        Priority: {f.priority_score}/100
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono">
                      Entity: {f.entity_name} | Category: {f.category} | Rule: {f.rule_id} | Status: <span className="text-amber-400">{f.review_status}</span>
                    </div>

                    <div className="text-slate-300 text-xs mt-1">
                      <strong>Signal:</strong> {f.what}
                    </div>

                    <div className="text-purple-300 text-xs italic">
                      <strong>Counterfactual:</strong> {f.counterfactual_explanation}
                    </div>

                    <div className="text-cyan-300 text-xs">
                      <strong>Supervisory Recommendation:</strong> {f.recommended_action}
                    </div>

                    {f.examiner_notes && (
                      <div className="p-2 rounded bg-slate-950 border border-cyan-500/30 text-xs text-cyan-200">
                        <strong>Examiner Annotation:</strong> "{f.examiner_notes}" (by {f.reviewed_by})
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
