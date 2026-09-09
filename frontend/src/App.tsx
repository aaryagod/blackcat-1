import React, { useState, useEffect } from 'react';
import { api, getAuthToken, clearAuthToken } from './api';
import { User, Entity, Finding, AnalyticsSummary, NegativeSpaceMatrixItem, AuditLogItem, ReviewStatus } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { FindingDetailModal } from './components/FindingDetailModal';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { ReviewQueueView } from './views/ReviewQueueView';
import { NegativeSpaceView } from './views/NegativeSpaceView';
import { BenchmarkingView } from './views/BenchmarkingView';
import { ReportsView } from './views/ReportsView';
import { IngestView } from './views/IngestView';
import { AuditLogViewer } from './components/AuditLogViewer';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [negativeSpaceMatrix, setNegativeSpaceMatrix] = useState<NegativeSpaceMatrixItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Check current session
  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const u = await api.getMe();
        setUser(u);
      } catch (err) {
        clearAuthToken();
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();

    const handleAuthExpired = () => {
      setUser(null);
    };
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  // Fetch Core Data when user is logged in or entity changes
  const loadAllData = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      const [ents, finds, summ, negMatrix, logs] = await Promise.all([
        api.getEntities(),
        api.getFindings({ entity_id: selectedEntity?.id }),
        api.getAnalyticsSummary(),
        api.getNegativeSpaceMatrix(),
        api.getAuditLogs(50),
      ]);

      setEntities(ents);
      setFindings(finds);
      setSummary(summ);
      setNegativeSpaceMatrix(negMatrix.matrix || []);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load supervisory data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user, selectedEntity]);

  const handleRefreshAuditLogs = async () => {
    try {
      const logs = await api.getAuditLogs(50);
      setAuditLogs(logs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReRunAnalytics = async () => {
    setIsRefreshing(true);
    try {
      await api.runAnalytics(selectedEntity?.id);
      await loadAllData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSubmitReviewDecision = async (
    findingId: string,
    status: ReviewStatus,
    notes: string
  ) => {
    setIsSubmittingReview(true);
    try {
      await api.submitReviewDecision(findingId, status, notes);
      // Update local finding
      setFindings((prev) =>
        prev.map((f) =>
          f.id === findingId
            ? { ...f, review_status: status, examiner_notes: notes, reviewed_by: user?.full_name }
            : f
        )
      );
      if (selectedFinding && selectedFinding.id === findingId) {
        setSelectedFinding((prev) =>
          prev
            ? { ...prev, review_status: status, examiner_notes: notes, reviewed_by: user?.full_name }
            : null
        );
      }
      handleRefreshAuditLogs();
    } catch (err: any) {
      alert(`Failed to record review: ${err.message}`);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-cyan-400 font-mono text-sm">
        <div className="animate-pulse">Initializing SAT-SA Supervisory Terminal...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginView onLoginSuccess={(u) => setUser(u)} />;
  }

  const pendingReviewsCount = findings.filter((f) => f.review_status === 'Pending Review').length;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation */}
      <Navbar
        user={user}
        selectedEntity={selectedEntity}
        entities={entities}
        onSelectEntity={setSelectedEntity}
        onLogout={handleLogout}
        onRefreshData={handleReRunAnalytics}
        isRefreshing={isRefreshing}
      />

      <div className="flex flex-1">
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          pendingReviewsCount={pendingReviewsCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              summary={summary}
              entities={entities}
              topFindings={findings}
              negativeSpaceMatrix={negativeSpaceMatrix}
              onSelectFinding={setSelectedFinding}
              onNavigateTab={setCurrentTab}
              onSelectEntity={(ent) => {
                setSelectedEntity(ent);
                setCurrentTab('review-queue');
              }}
            />
          )}

          {currentTab === 'review-queue' && (
            <ReviewQueueView
              findings={findings}
              selectedEntity={selectedEntity}
              onSelectFinding={setSelectedFinding}
            />
          )}

          {currentTab === 'negative-space' && (
            <NegativeSpaceView
              matrix={negativeSpaceMatrix}
              findings={findings}
              onSelectFinding={setSelectedFinding}
            />
          )}

          {currentTab === 'benchmarks' && (
            <BenchmarkingView
              entities={entities}
              onSelectEntity={(ent) => {
                setSelectedEntity(ent);
                setCurrentTab('review-queue');
              }}
            />
          )}

          {currentTab === 'dossier' && (
            <ReportsView selectedEntity={selectedEntity} />
          )}

          {currentTab === 'ingest' && (
            <IngestView
              auditLogs={auditLogs}
              onRefreshAllData={loadAllData}
              onRefreshAuditLogs={handleRefreshAuditLogs}
            />
          )}

          {currentTab === 'audit-trail' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                  Supervisory Audit Logs & Integrity Trail
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Chronological tamper-evident record of all examiner reviews, reclassification memos, and analytics runs.
                </p>
              </div>
              <AuditLogViewer logs={auditLogs} onRefresh={handleRefreshAuditLogs} />
            </div>
          )}
        </main>
      </div>

      {/* Finding Drill-Down & Evidence Inspection Modal */}
      <FindingDetailModal
        finding={selectedFinding}
        onClose={() => setSelectedFinding(null)}
        onSubmitReview={handleSubmitReviewDecision}
        isSubmitting={isSubmittingReview}
      />
    </div>
  );
};
