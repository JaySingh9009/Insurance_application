import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { userApi } from "../../api/userApi";
import { claimApi } from "../../api/claimApi";
import { policyApi } from "../../api/policyApi";
import AppLayout from "../../components/layout/AppLayout";
import CreateOfficerForm from "../../components/forms/CreateOfficerForm";
import StatusBadge from "../../components/common/StatusBadge";
import { useAuth } from "../../hooks/useAuth";
import { formatINR } from "../../utils/formatters";
import "../../styles/shared.css";
import "../../styles/AdminDashboard.css";

const PIPELINE = [
  { label: "Submitted", key: "SUBMITTED", dot: "#3b82f6" },
  { label: "Under Review", key: "UNDER_REVIEW", dot: "#f59e0b" },
  { label: "Recommended", key: "RECOMMENDED_APPROVAL", dot: "#534AB7" },
  { label: "Approved", key: "APPROVED", dot: "#16a34a" },
  { label: "Rejected", key: "REJECTED", dot: "#ef4444" },
];

function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const adminName = user?.name || "Admin";

  const [dashStats, setDashStats] = useState(null);
  const [recentClaims, setRecentClaims] = useState([]);
  const [recentPolicies, setRecentPolicies] = useState([]);
  const [pendingClaims, setPendingClaims] = useState([]);
  const [pipelineCount, setPipelineCount] = useState({
    SUBMITTED: 0,
    UNDER_REVIEW: 0,
    RECOMMENDED_APPROVAL: 0,
    APPROVED: 0,
    REJECTED: 0,
  });

  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchDashboard();
    fetchRecentData();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await userApi.getAdminDashboard();
      setDashStats(res.data);
    } catch {
      /* ignore */
    }
  };


  const fetchRecentData = async () => {
    try {
      const [claimRes, policyRes] = await Promise.all([
        claimApi.getAll(0, 4, "createdAt", "desc"),
        policyApi.getAll(0, 4, "createdAt", "desc"),
      ]);
      if (claimRes.data.records?.length) setRecentClaims(claimRes.data.records);
      if (policyRes.data.records?.length) setRecentPolicies(policyRes.data.records);

      const allRes = await claimApi.getAll(0, 100);

      const records = allRes.data.records || [];
      const counts = { SUBMITTED: 0, UNDER_REVIEW: 0, RECOMMENDED_APPROVAL: 0, APPROVED: 0, REJECTED: 0 };
      records.forEach((c) => {
        if (counts[c.status] !== undefined) counts[c.status]++;
      });
      setPipelineCount(counts);

      setPendingClaims(records.filter((c) => c.status === "RECOMMENDED_APPROVAL" || c.status === "SUBMITTED").slice(0, 5));
    } catch {
      /* ignore */
    }
  };

  const totalPipeline = Object.values(pipelineCount).reduce((a, b) => a + b, 0);

  return (
    <AppLayout>
      <div className="topbar" style={{ marginBottom: 20 }}>
        <div className="topbar-left">
          <h1 className="topbar-title">Admin Dashboard</h1>
          <span className="topbar-greeting">Welcome back, {adminName} 👋</span>
        </div>
        <div className="topbar-actions">
          <button className="btn-primary" onClick={() => setShowCreate(!showCreate)}>
            <span className="material-icons">person_add</span> {showCreate ? "Close Form" : "Create Officer"}
          </button>
        </div>
      </div>

      <div className="page-container" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Inline Create Officer Form */}
        <CreateOfficerForm isOpen={showCreate} onClose={() => setShowCreate(false)} />

        {/* Stat cards */}
        <div className="admin-stats-grid">
          <div className="stat-card stat-card-purple" onClick={() => navigate("/admin/users")} style={{ cursor: "pointer" }}>
            <span className="material-icons stat-icon">group</span>
            <div>
              <p className="stat-label">Total Customers</p>
              <p className="stat-value">{dashStats?.totalCustomers ?? dashStats?.totalUsers ?? "—"}</p>
            </div>
          </div>
          <div className="stat-card stat-card-blue" onClick={() => navigate("/admin/policies")} style={{ cursor: "pointer" }}>
            <span className="material-icons stat-icon">policy</span>
            <div>
              <p className="stat-label">Total Policies</p>
              <p className="stat-value">{dashStats?.totalPolicies ?? "—"}</p>
            </div>
          </div>
          <div className="stat-card stat-card-amber" onClick={() => navigate("/admin/claims")} style={{ cursor: "pointer" }}>
            <span className="material-icons stat-icon">assignment</span>
            <div>
              <p className="stat-label">Total Claims</p>
              <p className="stat-value">{dashStats?.totalClaims ?? "—"}</p>
            </div>
          </div>
          <div className="stat-card stat-card-green" onClick={() => navigate("/admin/products")} style={{ cursor: "pointer" }}>
            <span className="material-icons stat-icon">category</span>
            <div>
              <p className="stat-label">Total Products</p>
              <p className="stat-value">{dashStats?.totalProducts ?? "—"}</p>
            </div>
          </div>
        </div>

        {/* Claims Pipeline */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Claims Processing Pipeline</span>
            <span className="count-badge">{totalPipeline} total claims</span>
          </div>
          <div className="pipeline-bar-wrap">
            {totalPipeline > 0 ? (
              <div className="pipeline-bar">
                {PIPELINE.map((stage) => {
                  const cnt = pipelineCount[stage.key] || 0;
                  const pct = totalPipeline ? (cnt / totalPipeline) * 100 : 0;
                  if (pct === 0) return null;
                  return (
                    <div
                      key={stage.key}
                      style={{ width: `${pct}%`, background: stage.dot }}
                      title={`${stage.label}: ${cnt}`}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="pipeline-bar-empty" />
            )}
            <div className="pipeline-legend">
              {PIPELINE.map((stage) => (
                <div key={stage.key} className="legend-item">
                  <span className="legend-dot" style={{ background: stage.dot }} />
                  <span className="legend-label">{stage.label}</span>
                  <span className="legend-count">({pipelineCount[stage.key] || 0})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Section Grid */}
        <div className="admin-grid-2">
          {/* Recent Claims */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent Claims</span>
              <button className="btn-ghost" onClick={() => navigate("/admin/claims")}>
                View all →
              </button>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Claim #</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentClaims.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="td-muted">
                        No recent claims
                      </td>
                    </tr>
                  ) : (
                    recentClaims.map((c) => (
                      <tr key={c.claimId} onClick={() => navigate("/admin/claims")} style={{ cursor: "pointer" }}>
                        <td className="td-mono">{c.claimNumber}</td>
                        <td className="td-amount">{formatINR(c.claimAmount)}</td>
                        <td>
                          <StatusBadge status={c.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Policies */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent Policies</span>
              <button className="btn-ghost" onClick={() => navigate("/admin/policies")}>
                View all →
              </button>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Policy #</th>
                    <th>Plan</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPolicies.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="td-muted">
                        No recent policies
                      </td>
                    </tr>
                  ) : (
                    recentPolicies.map((p) => (
                      <tr key={p.policyId} onClick={() => navigate("/admin/policies")} style={{ cursor: "pointer" }}>
                        <td className="td-mono">{p.policyNumber}</td>
                        <td className="td-bold">{p.planName}</td>
                        <td>
                          <StatusBadge status={p.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pending Decision Queue */}
        {pendingClaims.length > 0 && (
          <section className="card card-warning-accent">
            <div className="card-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="material-icons" style={{ color: "#b45309" }}>
                  error_outline
                </span>
                <span className="card-title">Pending Action Required</span>
              </div>
              <span className="count-badge badge-warning">{pendingClaims.length} pending review/decision</span>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Claim #</th>
                    <th>Policy #</th>
                    <th>Amount</th>
                    <th>Officer</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingClaims.map((c) => (
                    <tr key={c.claimId}>
                      <td className="td-mono">{c.claimNumber}</td>
                      <td className="td-mono">{c.policyNumber}</td>
                      <td className="td-amount">{formatINR(c.claimAmount)}</td>
                      <td>{c.assignedOfficerName || "—"}</td>
                      <td>
                        <StatusBadge status={c.status} />
                      </td>
                      <td>
                        <button className="btn-decide" onClick={() => navigate("/admin/claims")} id={`decide-${c.claimId}`}>
                          Decide
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}

export default AdminDashboard;
