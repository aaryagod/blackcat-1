import React, { useState } from 'react';
import {
  UploadCloud,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Database,
  Sparkles,
  Layers,
  History,
} from 'lucide-react';
import { api } from '../api';
import { AuditLogViewer } from '../components/AuditLogViewer';
import { AuditLogItem } from '../types';

interface IngestViewProps {
  auditLogs: AuditLogItem[];
  onRefreshAllData: () => void;
  onRefreshAuditLogs: () => void;
}

export const IngestView: React.FC<IngestViewProps> = ({
  auditLogs,
  onRefreshAllData,
  onRefreshAuditLogs,
}) => {
  const [selectedDatasetType, setSelectedDatasetType] = useState('alerts');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsValidating(true);
    setValidationResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('dataset_type', selectedDatasetType);

    try {
      const res = await fetch('/api/ingest/validate-csv', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('satsa_token')}`,
        },
        body: formData,
      });
      const data = await res.json();
      setValidationResult(data);
    } catch (err: any) {
      setValidationResult({ is_valid: false, error: err.message });
    } finally {
      setIsValidating(false);
    }
  };

  const handleResetSyntheticData = async () => {
    setIsResetting(true);
    setResetSuccess(null);
    try {
      const res = await api.resetSyntheticBaseline();
      setResetSuccess(`Synthetic datasets regenerated! ${res.findings_generated} explainable findings generated across 3 CSEs.`);
      onRefreshAllData();
      onRefreshAuditLogs();
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest font-bold">
          <UploadCloud className="h-4 w-4" />
          <span>Periodic SOC Operational Submission Ingestion</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight mt-1">
          Data Validation Studio & Synthetic Scenario Simulator
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Ingest and profile periodic CSV/JSON SOC operational records (Alert Metadata, Case Management, Investigations, Escalations, Closures, Assets) with schema integrity validation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. CSV Upload & Schema Validator */}
        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
              <FileCheck className="h-5 w-5" />
              <span>Periodic SOC Submission Ingest Dropzone</span>
            </div>

            <select
              value={selectedDatasetType}
              onChange={(e) => setSelectedDatasetType(e.target.value)}
              aria-label="Dataset Schema Target"
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-cyan-300 font-semibold"
            >
              <option value="alerts">Alerts Ingestion Schema</option>
              <option value="cases">Cases Ingestion Schema</option>
              <option value="assets">Asset Inventory Schema</option>
            </select>
          </div>

          <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-slate-950/40 hover:bg-slate-900/40 transition-all text-center">
            <UploadCloud className="h-10 w-10 text-cyan-400 animate-bounce" />
            <div>
              <div className="text-xs font-bold text-slate-200">
                Drag and drop SOC CSV/JSON submission file here
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Supports periodic batch exports from Splunk, QRadar, Sentinel, ITSM, Jira
              </div>
            </div>
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {isValidating && (
            <div className="text-center text-xs text-cyan-300 font-mono py-2">
              Validating schema against NCIIPC supervisory fields...
            </div>
          )}

          {validationResult && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-2 ${
                validationResult.is_valid
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-950/50 border-red-500/40 text-red-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {validationResult.is_valid ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                )}
                <span>
                  {validationResult.is_valid
                    ? `Schema Validated: ${validationResult.total_records} Records Detected`
                    : 'Schema Validation Failed'}
                </span>
              </div>

              <div className="text-[11px] text-slate-300 font-mono">
                Filename: {validationResult.filename} | Type: {validationResult.dataset_type}
              </div>

              {validationResult.missing_mandatory_columns?.length > 0 && (
                <div className="text-[11px] text-red-300 font-mono">
                  Missing Mandatory Columns: {validationResult.missing_mandatory_columns.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Synthetic Scenario Simulator */}
        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <span>Multi-Sector Ground-Truth Synthetic Simulator</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Injects calibrated real-world operational datasets across <strong>National Power Grid (SCADA)</strong>, <strong>Apex Central Bank (SWIFT)</strong>, and <strong>Metro Telecom (5G Backbone)</strong> with ground-truth execution gaps and negative space anomalies for instant live demonstration.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5 font-mono">
              <div className="text-cyan-400 font-bold">Injected Supervisory Scenarios:</div>
              <div className="text-slate-300 text-[11px]">⚡ Missing L2 Escalation on SCADA telemetry spoofing</div>
              <div className="text-slate-300 text-[11px]">⚡ Shift-boundary mass closure dump (26 tickets in 9 mins)</div>
              <div className="text-slate-300 text-[11px]">⚡ Critical speed-closing (Cobalt Strike closed in 42s)</div>
              <div className="text-slate-300 text-[11px]">⚡ Unmanaged shadow gateway telemetry</div>
              <div className="text-slate-300 text-[11px]">⚡ Missing forensic memory dump on router intrusion</div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-3">
            {resetSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                {resetSuccess}
              </div>
            )}

            <button
              onClick={handleResetSyntheticData}
              disabled={isResetting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
              <span>{isResetting ? 'Simulating SOC Datasets & Running Analytics...' : '1-Click Reseed & Re-analyze All CSEs'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audit Trail Section */}
      <AuditLogViewer logs={auditLogs} onRefresh={onRefreshAuditLogs} />
    </div>
  );
};
