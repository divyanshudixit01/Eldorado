import { useEffect, useState } from "react";
import axios from "axios";
import Upload from "./components/Upload";
import GraphView from "./components/GraphView";
import RingTable from "./components/RingTable";
import SummaryPanel from "./components/SummaryPanel";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import NixtioDashboard from "./components/NixtioDashboard";
import FraudOverviewCharts from "./components/FraudOverviewCharts";
import SuspiciousAccountsTable from "./components/SuspiciousAccountsTable";
import Card from "./components/ui/Card";
import Button from "./components/ui/Button";
import LoginModal from "./components/LoginModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function App() {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("light");
  const [toast, setToast] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("nixtio-user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const stored = window.localStorage.getItem("mm-theme");
    const initial = stored === "dark" || stored === "light" ? stored : "light";
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      window.localStorage.setItem("mm-theme", next);
      return next;
    });
  };

  const handleLogin = (eventOrData) => {
    if (eventOrData?.preventDefault) eventOrData.preventDefault();
    const data = typeof eventOrData === "object" && eventOrData?.userId != null
      ? eventOrData
      : null;
    if (!data?.userId) return;
    const name = data.name || data.userId;
    const newUser = {
      userId: data.userId,
      name,
      initials: name
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("")
        .slice(0, 2) || data.userId.slice(0, 2).toUpperCase(),
      role: "Risk team",
    };
    setUser(newUser);
    try {
      localStorage.setItem("nixtio-user", JSON.stringify(newUser));
    } catch {}
  };

  const handleLogout = () => {
    setUser(null);
    setActiveView("dashboard");
    try {
      localStorage.removeItem("nixtio-user");
    } catch {}
  };

  const handleUploadSuccess = (data) => {
    setAnalysisData(data);
    setToast({
      type: "success",
      message: "CSV ingested and graph analysis completed.",
    });
    // Scroll to results after a short delay
    setTimeout(() => {
      const resultsSection = document.querySelector('[data-results-section]');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 500);
  };

  const handleDownloadJSON = () => {
    if (!analysisData) return;
    
    // Format data to match EXACT specification format
    const formattedData = {
      suspicious_accounts: (analysisData.suspicious_accounts || [])
        .map((acc) => ({
          account_id: acc.account_id,
          suspicion_score: parseFloat((acc.suspicion_score || 0).toFixed(1)),
          detected_patterns: acc.detected_patterns || [],
          ring_id: acc.ring_id || null,
        }))
        .sort((a, b) => b.suspicion_score - a.suspicion_score), // Sort descending by suspicion_score
      fraud_rings: (analysisData.fraud_rings || []).map((ring) => ({
        ring_id: ring.ring_id,
        member_accounts: ring.member_accounts || [],
        pattern_type: ring.pattern_type || "unknown",
        risk_score: parseFloat((ring.risk_score || 0).toFixed(1)),
      })),
      summary: {
        total_accounts_analyzed: analysisData.summary?.total_accounts_analyzed || 0,
        suspicious_accounts_flagged: analysisData.summary?.suspicious_accounts_flagged || 0,
        fraud_rings_detected: analysisData.summary?.fraud_rings_detected || 0,
        processing_time_seconds: parseFloat((analysisData.summary?.processing_time_seconds || 0).toFixed(2)),
      },
    };

    const jsonString = JSON.stringify(formattedData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fraud-detection-results-${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToast({
      type: "success",
      message: "Detection results JSON downloaded in exact format.",
    });
  };

  const handleLoadResults = async () => {
    if (!user) {
      setToast({
        type: "error",
        message: "Sign in to load your analysis history.",
      });
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/results`);
      setAnalysisData(response.data);
      setToast({
        type: "success",
        message: "Previous results restored from the last analysis run.",
      });
    } catch (error) {
      console.error("Error loading results:", error);
      setToast({
        type: "error",
        message: "Failed to load previous results. Upload a CSV first.",
      });
    } finally {
      setLoading(false);
    }
  };

  const summary = analysisData?.summary;
  const suspiciousAccounts = analysisData?.suspicious_accounts || [];

  const totalAccounts = summary?.total_accounts_analyzed || 0;
  const fraudCount = summary?.suspicious_accounts_flagged || 0;
  const fraudPercentage =
    totalAccounts > 0 ? (fraudCount / totalAccounts) * 100 : 0;
  const highRiskAccounts = suspiciousAccounts.filter(
    (a) => (a.suspicion_score || 0) >= 80,
  ).length;

  const mapSidebarToView = (key) => {
    const map = {
      dashboard: "dashboard",
      search: "transactions",
      attach: "upload",
      collab: "alerts",
      history: "analytics",
    };
    return map[key] ?? "dashboard";
  };

  const renderMainView = () => {
    switch (activeView) {
      case "transactions":
        return (
          <div className="space-y-6">
            <Card
              title="Transaction Explorer"
              subtitle="Drill into the most recent transactions driving current risk scores."
            >
              <SuspiciousAccountsTable accounts={suspiciousAccounts} />
            </Card>
          </div>
        );
      case "alerts":
        return (
          <div className="space-y-6">
            <Card
              title="Fraud Alerts"
              subtitle="High-priority anomalies and rings that require immediate review."
            >
              <RingTable fraudRings={analysisData?.fraud_rings || []} />
              <div className="mt-4">
                <SummaryPanel
                  summary={summary}
                  fraudPercentage={fraudPercentage}
                  highRiskAccounts={highRiskAccounts}
                />
              </div>
            </Card>
          </div>
        );
      case "analytics":
        return (
          <div className="space-y-6">
            <SummaryPanel
              summary={summary}
              fraudPercentage={fraudPercentage}
              highRiskAccounts={highRiskAccounts}
              onDownload={analysisData ? handleDownloadJSON : undefined}
            />
            <FraudOverviewCharts
              summary={summary}
              suspiciousAccounts={suspiciousAccounts}
            />
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
              <GraphView data={analysisData} />
              <RingTable fraudRings={analysisData?.fraud_rings || []} />
            </div>
          </div>
        );
      case "upload":
        return (
          <div className="space-y-6">
            {/* Upload Section */}
            <Card
              title="Upload Transaction CSV"
              subtitle="Ingest raw transaction logs and stream them into the graph analytics engine."
            >
              <Upload
                onUploadSuccess={handleUploadSuccess}
                onNotify={setToast}
              />
              {!analysisData && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={handleLoadResults}
                    disabled={loading || !user}
                  >
                    {loading ? "Loading previous results…" : user ? "Load Last Run" : "Sign in to load history"}
                  </Button>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user ? "Resume from your last processed CSV." : "Sign in to save and restore analysis history."}
                  </p>
                </div>
              )}
            </Card>

            {/* All Required Outputs - Show when data is available */}
            {analysisData && (
              <div data-results-section className="space-y-6">
                {/* Summary Panel with Download Button */}
                <SummaryPanel
                  summary={summary}
                  fraudPercentage={fraudPercentage}
                  highRiskAccounts={highRiskAccounts}
                  onDownload={handleDownloadJSON}
                />

                {/* Interactive Graph Visualization */}
                <GraphView data={analysisData} />

                {/* Fraud Ring Summary Table */}
                <RingTable fraudRings={analysisData?.fraud_rings || []} />

                {/* Suspicious Accounts Table */}
                <SuspiciousAccountsTable accounts={suspiciousAccounts} />

                {/* Additional Charts */}
                <FraudOverviewCharts
                  summary={summary}
                  suspiciousAccounts={suspiciousAccounts}
                />
              </div>
            )}
          </div>
        );
      case "settings":
        return (
          <div className="space-y-6">
            <Card
              title="Console Settings"
              subtitle="Personalize your analyst workspace."
            >
              <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Theme</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Toggle between light and dark mode.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={handleToggleTheme}
                  >
                    {theme === "dark" ? "Use light theme" : "Use dark theme"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        );
      default:
        return <NixtioDashboard user={user} onNavigateToUpload={() => setActiveView("upload")} />;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        active={
          {
            dashboard: "dashboard",
            transactions: "search",
            upload: "attach",
            alerts: "collab",
            analytics: "history",
            settings: "dashboard",
          }[activeView] ?? "dashboard"
        }
        onNavigate={(key) => setActiveView(mapSidebarToView(key))}
        onLogout={handleLogout}
      />

      <div className="ml-16 flex min-h-screen flex-col">
        <Topbar
          theme={theme}
          onToggleTheme={handleToggleTheme}
          user={user}
          onLogin={() => setShowLoginModal(true)}
          onLogout={handleLogout}
        />

        <div className="flex-1 px-4 pb-8 sm:px-6 lg:px-8">
          <div className="mx-auto w-full">
            {activeView === "upload" ? (
              renderMainView()
            ) : (
              <div className="glass-card p-6 sm:p-8">
                {renderMainView()}
              </div>
            )}
          </div>
        </div>
      </div>

      {showLoginModal && (
        <LoginModal
          onLogin={handleLogin}
          onClose={() => setShowLoginModal(false)}
        />
      )}

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 flex justify-center px-4 sm:justify-end sm:px-6 lg:px-8">
          <div
            className={`pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-xl ${
              toast.type === "error"
                ? "border-red-200/70 bg-red-50/95 dark:border-red-800/80 dark:bg-red-950/90"
                : toast.type === "success"
                  ? "border-emerald-200/70 bg-emerald-50/95 dark:border-emerald-800/80 dark:bg-emerald-950/90"
                  : "border-slate-200 bg-white/95 dark:border-slate-700 dark:bg-slate-900/95"
            }`}
          >
            <div className="mt-0.5 text-lg">
              {toast.type === "error"
                ? "⚠️"
                : toast.type === "success"
                  ? "✅"
                  : "ℹ️"}
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900 dark:text-slate-50">
                {toast.type === "error"
                  ? "Something went wrong"
                  : toast.type === "success"
                    ? "Action completed"
                    : "Notification"}
              </p>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="mt-0.5 rounded-lg p-1 text-slate-400 transition hover:bg-slate-200/50 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
