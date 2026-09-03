import { useEffect, useState } from "react";
import { claimApi } from "../../api/claimApi";
import { authApi } from "../../api/authApi";
import AppLayout from "../../components/layout/AppLayout";
import StatusBadge from "../../components/common/StatusBadge";
import Pagination from "../../components/common/Pagination";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import { formatDate, formatDateTime, formatINR } from "../../utils/formatters";
import { exportToCSV } from "../../utils/csv";
import "../../styles/shared.css";

function OfficerClaims() {
  const [data, setData] = useState({ records: [], totalRecords: 0, totalPages: 0 });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [profile, setProfile] = useState(null);

  const [reviewForm, setReviewForm] = useState(null);
  const [recommendForm, setRecommendForm] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [targetStatus, setTargetStatus] = useState("RECOMMENDED_APPROVAL");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  useEffect(() => {
    fetchClaims();
    fetchProfile();
  }, [page]);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await claimApi.getAll(page, 10, "createdAt", "desc");
      setData(res.data);
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

  const isAssignedOfficer = (claim) => {
    if (!profile || !claim) return false;
    const officerId = claim.assignedOfficerId;
    const officerName = claim.assignedOfficerName;
    if (officerId && profile.id) {
      return Number(officerId) === Number(profile.id);
    }
    if (officerName && profile.fullName) {
      return officerName.trim().toLowerCase() === profile.fullName.trim().toLowerCase();
    }
    return false;
  };

  const [customerHistoryData, setCustomerHistoryData] = useState({
    open: false,
    claims: [],
    loading: false,
  });

  const handleToggleCustomerHistory = async (claim) => {
    if (customerHistoryData.open) {
      setCustomerHistoryData((prev) => ({ ...prev, open: false }));
      return;
    }

    const custId = claim.customerId;
    const custName = claim.customerName || "Customer";
    setCustomerHistoryData({
      open: true,
      claims: [],
      loading: true,
    });
    try {
      let claimsList = [];
      if (custId) {
        try {
          const res = await claimApi.getByCustomer(custId);
          claimsList = res.data?.records || res.data || [];
        } catch {
          claimsList = (data.records || []).filter((c) => c.customerName === custName);
        }
      } else {
        claimsList = (data.records || []).filter((c) => c.customerName === custName);
      }
      setCustomerHistoryData({
        open: true,
        claims: claimsList,
        loading: false,
      });
    } catch {
      const fallbackList = (data.records || []).filter((c) => c.customerName === custName);
      setCustomerHistoryData({
        open: true,
        claims: fallbackList,
        loading: false,
      });
    }
  };

  const openDetail = async (claim) => {
    if (selected?.claimId === claim.claimId) {
      setSelected(null);
      return;
    }
    setSelected(claim);
    setHistory([]);
    setDocuments([]);
    setCustomerHistoryData({ open: false, claims: [], loading: false });
    try {
      const [resHist, resDocs] = await Promise.all([
        claimApi.getHistory(claim.claimId),
        claimApi.getDocuments(claim.claimId),
      ]);
      setHistory(resHist.data || []);
      setDocuments(resDocs.data || []);
    } catch {
      /* ignore */
    }
  };

  const openReview = async (claim) => {
    if (!isAssignedOfficer(claim)) {
      alert("This claim is not assigned to you. Only the assigned insurance officer can review it.");
      return;
    }
    setReviewForm(claim);
    setRecommendForm(null);
    setRemarks("");
    setActionError("");
    setDocuments([]);
    try {
      const res = await claimApi.getDocuments(claim.claimId);
      setDocuments(res.data || []);
    } catch {
      /* ignore */
    }
  };

  const openRecommend = async (claim) => {
    if (!isAssignedOfficer(claim)) {
      alert("This claim is not assigned to you. Only the assigned insurance officer can recommend it.");
      return;
    }
    setRecommendForm(claim);
    setReviewForm(null);
    setRemarks("");
    setTargetStatus("RECOMMENDED_APPROVAL");
    setActionError("");
    setDocuments([]);
    try {
      const res = await claimApi.getDocuments(claim.claimId);
      setDocuments(res.data || []);
    } catch {
      /* ignore */
    }
  };

  const handleReview = async () => {
    if (remarks.trim().length < 5) {
      setActionError("Remarks must be at least 5 characters.");
      return;
    }
    setActionLoading(true);
    try {
      await claimApi.review(reviewForm.claimId, { targetStatus: "UNDER_REVIEW", remarks });
      setReviewForm(null);
      fetchClaims();
    } catch (e) {
      setActionError(e.response?.data?.message || "Operation failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecommend = async () => {
    if (remarks.trim().length < 5) {
      setActionError("Remarks must be at least 5 characters.");
      return;
    }
    setActionLoading(true);
    try {
      await claimApi.recommend(recommendForm.claimId, { targetStatus, remarks });
      setRecommendForm(null);
      fetchClaims();
    } catch (e) {
      setActionError(e.response?.data?.message || "Operation failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = data.records.filter((c) => {
    if (selectedStatus !== "ALL" && c.status !== selectedStatus) return false;
    return true;
  });

  const handleExport = () => {
    exportToCSV("Claims_List", filtered, {
      claimNumber: "Claim Number",
      policyNumber: "Policy Number",
      claimAmount: "Claim Amount",
      incidentDate: "Incident Date",
      status: "Status",
    });
  };

  return (
    <AppLayout>
      <header className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Claims Management</h1>
          <p className="topbar-greeting">Review and process submitted insurance claims</p>
        </div>
        <div className="topbar-actions">
          <Button variant="outlined" icon="download" onClick={handleExport}>
            Export CSV
          </Button>
        </div>
      </header>

      <div className="page-container">
        {/* Inline Review Action Card */}
        {reviewForm && (
          <div className="card" style={{ marginBottom: 20, border: "1.5px solid #f59e0b" }}>
            <div className="card-header" style={{ padding: "16px 20px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="material-icons" style={{ color: "#f59e0b" }}>pending_actions</span>
                <span className="card-title" style={{ fontSize: 16, fontWeight: 700 }}>
                  Review Claim — {reviewForm.claimNumber}
                </span>
              </div>
              <Button variant="ghost" icon="close" iconStyle={{ fontSize: 20 }} onClick={() => setReviewForm(null)} style={{ padding: 4 }} />
            </div>

            <div className="card-body" style={{ padding: "16px 20px 20px" }}>
              <Alert type="error" message={actionError} style={{ marginBottom: 14 }} />

              <div className="modal-summary-box" style={{ marginBottom: 15, padding: 12, background: "#f3f4f6", borderRadius: 8 }}>
                <div><strong>Customer Name:</strong> {reviewForm.customerName || "—"}</div>
                <div style={{ marginTop: 4 }}><strong>Claim Amount:</strong> {formatINR(reviewForm.claimAmount)}</div>
                <div style={{ marginTop: 4 }}><strong>Reason:</strong> {reviewForm.claimReason}</div>
              </div>

              <div className="form-group full">
                <label className="form-label">Review Remarks * (min 5 chars)</label>
                <textarea
                  className="form-textarea"
                  placeholder="Enter review remarks..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18, borderTop: "1px solid #f3f4f6", paddingTop: 14 }}>
                <Button variant="ghost" onClick={() => setReviewForm(null)} disabled={actionLoading}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleReview} loading={actionLoading}>
                  Move to Under Review
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Inline Recommend Action Card */}
        {recommendForm && (
          <div className="card" style={{ marginBottom: 20, border: "1.5px solid #534AB7" }}>
            <div className="card-header" style={{ padding: "16px 20px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="material-icons" style={{ color: "#534AB7" }}>assignment_turned_in</span>
                <span className="card-title" style={{ fontSize: 16, fontWeight: 700 }}>
                  Recommend Decision — {recommendForm.claimNumber}
                </span>
              </div>
              <Button variant="ghost" icon="close" iconStyle={{ fontSize: 20 }} onClick={() => setRecommendForm(null)} style={{ padding: 4 }} />
            </div>

            <div className="card-body" style={{ padding: "16px 20px 20px" }}>
              <Alert type="error" message={actionError} style={{ marginBottom: 14 }} />

              <div className="form-grid">
                <div className="form-group full">
                  <label className="form-label">Recommendation *</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[["RECOMMENDED_APPROVAL", "✓ Recommend Approval"], ["RECOMMENDED_REJECTION", "✗ Recommend Rejection"]].map(([val, lbl]) => (
                      <button
                        key={val}
                        type="button"
                        className={targetStatus === val ? (val === "RECOMMENDED_APPROVAL" ? "btn-success" : "btn-danger") : "btn-ghost"}
                        style={{ flex: 1, justifyContent: "center" }}
                        onClick={() => setTargetStatus(val)}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group full">
                  <label className="form-label">Recommendation Remarks * (min 5 chars)</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Enter recommendation remarks..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18, borderTop: "1px solid #f3f4f6", paddingTop: 14 }}>
                <Button variant="ghost" onClick={() => setRecommendForm(null)} disabled={actionLoading}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleRecommend} loading={actionLoading}>
                  Submit Recommendation
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Inline Claim Details Card */}
        {selected && (
          <div className="card" style={{ marginBottom: 20, border: "1.5px solid #3b82f6" }}>
            <div className="card-header" style={{ padding: "16px 20px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span className="material-icons" style={{ color: "#3b82f6", flexShrink: 0 }}>info</span>
                <span className="card-title" style={{ fontSize: 16, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  Claim Details — {selected.claimNumber}
                </span>
              </div>
              <Button variant="ghost" icon="close" iconStyle={{ fontSize: 20 }} onClick={() => setSelected(null)} style={{ padding: 4 }} />
            </div>

            <div className="card-body" style={{ padding: "16px 20px 20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px 20px", marginBottom: 20 }}>
                <div className="info-item">
                  <span className="info-label">Claim Number</span>
                  <span className="info-value td-mono" style={{ wordBreak: "break-all", fontSize: 13 }}>{selected.claimNumber}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Policy Number</span>
                  <span className="info-value td-mono" style={{ wordBreak: "break-all", fontSize: 13 }}>{selected.policyNumber}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Customer Name</span>
                  <span className="info-value" style={{ fontWeight: 600 }}>{selected.customerName || "—"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Claim Amount</span>
                  <span className="info-value td-amount">{formatINR(selected.claimAmount)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status</span>
                  <div>
                    <StatusBadge status={selected.status} />
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-label">Incident Date</span>
                  <span className="info-value">{formatDate(selected.incidentDate)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Assigned Officer</span>
                  <span className="info-value">{selected.assignedOfficerName || "Unassigned"}</span>
                </div>
                <div className="info-item" style={{ gridColumn: "1 / -1" }}>
                  <span className="info-label">Claim Reason</span>
                  <span className="info-value" style={{ wordBreak: "break-word" }}>{selected.claimReason || "—"}</span>
                </div>
                <div className="info-item" style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f3f4f6", paddingTop: 14, marginTop: 4 }}>
                  <button
                    className="btn-outlined"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", fontSize: 13, borderColor: "#534AB7", color: "#534AB7", fontWeight: 600, borderRadius: 8 }}
                    onClick={() => handleToggleCustomerHistory(selected)}
                  >
                    <span className="material-icons" style={{ fontSize: 18 }}>
                      {customerHistoryData.open ? "expand_less" : "history"}
                    </span>
                    {customerHistoryData.open ? "Hide Customer's Past Claims" : "View Customer's Past Claims"}
                  </button>
                </div>
              </div>

              {/* Inline Customer's Past Claims Section */}
              {customerHistoryData.open && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1.5px solid #534AB7" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div className="section-title" style={{ fontSize: 14, fontWeight: 700, color: "#534AB7", display: "flex", alignItems: "center", gap: 6 }}>
                      <span className="material-icons" style={{ fontSize: 20 }}>history</span>
                      Past Claims History — {selected.customerName || "Customer"}
                    </div>
                    <span className="count-badge">
                      {customerHistoryData.claims.length} {customerHistoryData.claims.length === 1 ? "claim" : "claims"}
                    </span>
                  </div>

                  {customerHistoryData.loading ? (
                    <Loader />
                  ) : customerHistoryData.claims.length === 0 ? (
                    <EmptyState icon="assignment" message="No previous claims found for this customer." />
                  ) : (
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Claim #</th>
                            <th>Policy #</th>
                            <th>Amount</th>
                            <th>Incident Date</th>
                            <th>Officer</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerHistoryData.claims.map((c) => (
                            <tr key={c.claimId}>
                              <td className="td-mono">{c.claimNumber}</td>
                              <td className="td-mono">{c.policyNumber}</td>
                              <td className="td-amount">{formatINR(c.claimAmount)}</td>
                              <td>{formatDate(c.incidentDate)}</td>
                              <td className="td-muted">{c.assignedOfficerName || "—"}</td>
                              <td>
                                <StatusBadge status={c.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Attached Documents */}
              {documents.length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1.5px solid #f3f4f6" }}>
                  <div className="section-title" style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
                    Attached Documents ({documents.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {documents.map((doc) => (
                      <div key={doc.documentId} className="attached-doc-row">
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{doc.documentName}</div>
                          <div style={{ fontSize: 11, opacity: 0.7 }}>{doc.documentType}</div>
                        </div>
                        {doc.documentUrl && (
                          <a
                            href={doc.documentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-ghost"
                            style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 }}
                          >
                            <span className="material-icons" style={{ fontSize: 16 }}>open_in_new</span>
                            View
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audit Log Timeline */}
              {history.length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1.5px solid #f3f4f6" }}>
                  <div className="section-title" style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
                    Audit Log & History
                  </div>
                  <div className="timeline">
                    {history.map((h) => (
                      <div key={h.historyId} className="timeline-item">
                        <div className="timeline-dot" />
                        <div className="timeline-content">
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                            <div>
                              <StatusBadge status={h.toStatus} />
                            </div>
                            <span className="timeline-time">{formatDateTime(h.createdAt)}</span>
                          </div>
                          <div className="timeline-actor">
                            Changed by: <strong style={{ color: "inherit" }}>{h.actionByUsername || "System"}</strong> ({h.actionByRole || "SYSTEM"})
                          </div>
                          {h.remarks && <div className="timeline-remarks">"{h.remarks}"</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <span className="card-title">Claims List</span>
            <span className="count-badge">{filtered.length} visible ({data.totalRecords} total)</span>
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
                      <th>Assigned Officer</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8}>
                          <EmptyState icon="assignment" message="No claims found" />
                        </td>
                      </tr>
                    ) : (
                      filtered.map((c) => {
                        const assignedToMe = isAssignedOfficer(c);
                        const officerName = c.assignedOfficerName;
                        return (
                          <tr key={c.claimId}>
                            <td className="td-mono">{c.claimNumber}</td>
                            <td className="td-bold">{c.customerName || "—"}</td>
                            <td className="td-mono">{c.policyNumber}</td>
                            <td className="td-amount">{formatINR(c.claimAmount)}</td>
                            <td className="td-muted">{formatDate(c.incidentDate)}</td>
                            <td>
                              {officerName ? (
                                assignedToMe ? (
                                  <span className="badge badge-active" style={{ fontSize: 11 }}>Assigned to You</span>
                                ) : (
                                  <span className="td-muted" style={{ fontSize: 12 }}>{officerName}</span>
                                )
                              ) : (
                                <span className="badge badge-inactive" style={{ fontSize: 11 }}>Unassigned</span>
                              )}
                            </td>
                            <td>
                              <StatusBadge status={c.status} />
                            </td>
                            <td>
                              <div className="action-row">
                                <button className="btn-ghost" onClick={() => openDetail(c)}>
                                  Details
                                </button>
                                {c.status === "SUBMITTED" && (
                                  <button
                                    className="btn-primary"
                                    onClick={() => openReview(c)}
                                    disabled={!assignedToMe}
                                    style={!assignedToMe ? { opacity: 0.5, cursor: "not-allowed", pointerEvents: "none" } : {}}
                                    title={!assignedToMe ? "Only assigned officer can review" : ""}
                                  >
                                    {assignedToMe ? "Review" : "Unassigned"}
                                  </button>
                                )}
                                {c.status === "UNDER_REVIEW" && (
                                  <button
                                    className="btn-outlined"
                                    onClick={() => openRecommend(c)}
                                    disabled={!assignedToMe}
                                    style={!assignedToMe ? { opacity: 0.5, cursor: "not-allowed", pointerEvents: "none" } : {}}
                                    title={!assignedToMe ? "Only assigned officer can recommend" : ""}
                                  >
                                    {assignedToMe ? "Recommend" : "Not Assigned"}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={page}
                totalPages={data.totalPages}
                totalRecords={data.totalRecords}
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

export default OfficerClaims;
