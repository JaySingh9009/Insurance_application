import { useEffect, useState } from "react";
import { claimApi } from "../../api/claimApi";
import { authApi } from "../../api/authApi";
import AppLayout from "../../components/layout/AppLayout";
import StatusBadge from "../../components/common/StatusBadge";
import Pagination from "../../components/common/Pagination";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import { formatDate, formatINR } from "../../utils/formatters";
import "../../styles/shared.css";

function OfficerDashboard() {
  const [claims, setClaims] = useState({ records: [], totalRecords: 0, totalPages: 0 });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ pending: 0, underReview: 0, reviewed: 0 });

  const officerName = localStorage.getItem("name") || "Officer";

  useEffect(() => {
    fetchClaims();
    fetchProfile();
    fetchStats();
  }, [page]);

  const fetchStats = async () => {
    try {
      const res = await claimApi.getAll(0, 100);
      const records = res.data.records || [];
      const pending = records.filter((c) => c.status === "SUBMITTED").length;
      const underReview = records.filter((c) => c.status === "UNDER_REVIEW").length;
      const reviewed = records.filter((c) =>
        ["RECOMMENDED_APPROVAL", "RECOMMENDED_REJECTION", "APPROVED", "REJECTED"].includes(c.status)
      ).length;
      setStats({ pending, underReview, reviewed });
    } catch (e) {
      console.error(e);
    }
  };

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await claimApi.getAll(page, 10, "createdAt", "desc");
      setClaims(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await authApi.getProfile();
      setProfile(res.data);
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };


  return (
    <AppLayout>
      <header className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Insurance Officer Dashboard</h1>
          <span className="topbar-greeting">Welcome, {profile?.fullName || officerName} 👋</span>
        </div>
      </header>

      <div className="page-container">
        <div className="stats-grid">
          <div className="stat-card">
            <span className="material-icons stat-icon" style={{ color: "#3b82f6", background: "#dbeafe" }}>
              inbox
            </span>
            <div>
              <p className="stat-label">Pending Review</p>
              <p className="stat-value">{stats.pending}</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="material-icons stat-icon" style={{ color: "#f59e0b", background: "#fef3c7" }}>
              pending_actions
            </span>
            <div>
              <p className="stat-label">Under Review</p>
              <p className="stat-value">{stats.underReview}</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="material-icons stat-icon" style={{ color: "#16a34a", background: "#dcfce7" }}>
              task_alt
            </span>
            <div>
              <p className="stat-label">Total Reviewed</p>
              <p className="stat-value">{stats.reviewed}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Claims Queue</span>
            <span className="count-badge">{claims.totalRecords} total</span>
          </div>
          {loading ? (
            <Loader />
          ) : (
            <>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Claim #</th>
                      <th>Customer</th>
                      <th>Policy #</th>
                      <th>Amount</th>
                      <th>Incident Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.records.length === 0 ? (
                      <tr>
                        <td colSpan={6}>
                          <EmptyState icon="assignment" message="No claims to review" />
                        </td>
                      </tr>
                    ) : (
                      claims.records.map((claim) => (
                        <tr key={claim.claimId}>
                          <td className="td-mono">{claim.claimNumber}</td>
                          <td className="td-bold">{claim.customerName || "—"}</td>
                          <td className="td-mono">{claim.policyNumber}</td>
                          <td className="td-amount">{formatINR(claim.claimAmount)}</td>
                          <td className="td-muted">{formatDate(claim.incidentDate)}</td>
                          <td>
                            <StatusBadge status={claim.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={page}
                totalPages={claims.totalPages}
                totalRecords={claims.totalRecords}
                pageSize={10}
                onChange={setPage}
              />
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default OfficerDashboard;
