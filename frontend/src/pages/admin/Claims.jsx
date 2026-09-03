import { useEffect, useState } from "react";
import { claimApi } from "../../api/claimApi";
import { userApi } from "../../api/userApi";
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

export function Claims() {
  const [data, setData] = useState({ records: [], totalRecords: 0, totalPages: 0 });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [officers, setOfficers] = useState([]);

  const [assignForm, setAssignForm] = useState(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");

  const [decideForm, setDecideForm] = useState(null);
  const [decideStatus, setDecideStatus] = useState("APPROVED");
  const [decideRemarks, setDecideRemarks] = useState("");
  const [decideLoading, setDecideLoading] = useState(false);
  const [decideError, setDecideError] = useState("");

  const [customerHistoryData, setCustomerHistoryData] = useState({
    open: false,
    claims: [],
    loading: false,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedOfficer, setSelectedOfficer] = useState("ALL");

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
        const res = await claimApi.getByCustomer(custId);
        claimsList = res.data?.records || res.data || [];
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

  const fetchOfficers = async () => {
    try {
      const res = await userApi.getOfficers();
      const officerList = Array.isArray(res.data) ? res.data : (res.data?.records || []);
      const activeOfficers = officerList.filter((a) => a.active !== false);
      setOfficers(activeOfficers);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchClaims();
    fetchOfficers();
  }, [page]);

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


  const openAssign = (claim) => {
    setAssignForm(claim);
    setDecideForm(null);
    const assignedId = claim.assignedOfficerId;
    setSelectedOfficerId(assignedId ? String(assignedId) : "");
    setAssignError("");
  };

  const openDecide = (claim) => {
    if (claim.status === "APPROVED" || claim.status === "REJECTED" || claim.status === "CANCELLED") {
      return;
    }
    setDecideForm(claim);
    setAssignForm(null);
    setDecideStatus("APPROVED");
    setDecideRemarks("");
    setDecideError("");
  };

  const handleAssign = async () => {
    if (!selectedOfficerId) {
      setAssignError("Please select an officer.");
      return;
    }
    setAssignLoading(true);
    setAssignError("");
    try {
      await claimApi.assignOfficer(assignForm.claimId, selectedOfficerId);
      setAssignForm(null);
      fetchClaims();
    } catch (e) {
      setAssignError(e.response?.data?.message || "Failed to assign officer.");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleDecide = async () => {
    if (decideRemarks.trim().length < 5) {
      setDecideError("Remarks must be at least 5 characters.");
      return;
    }
    setDecideLoading(true);
    setDecideError("");
    try {
      await claimApi.decide(decideForm.claimId, {
        decision: decideStatus,
        adminRemarks: decideRemarks,
      });
      setDecideForm(null);
      fetchClaims();
    } catch (e) {
      setDecideError(e.response?.data?.message || "Failed to decide claim.");
    } finally {
      setDecideLoading(false);
    }
  };

  const filteredClaims = (data.records || []).filter((c) => {
    // Status filter
    if (selectedStatus !== "ALL" && c.status !== selectedStatus) return false;

    // Officer filter
    if (selectedOfficer === "UNASSIGNED") {
      if (c.assignedOfficerId || c.assignedOfficerName) return false;
    } else if (selectedOfficer === "ASSIGNED") {
      if (!c.assignedOfficerId && !c.assignedOfficerName) return false;
    } else if (selectedOfficer !== "ALL") {
      if (String(c.assignedOfficerId) !== String(selectedOfficer) && c.assignedOfficerName !== selectedOfficer) return false;
    }

    // Search query filter (Customer Name only)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchCustomer = c.customerName?.toLowerCase().includes(q);
      if (!matchCustomer) return false;
    }

    return true;
  });

  const hasActiveFilters = searchQuery.trim() !== "" || selectedStatus !== "ALL" || selectedOfficer !== "ALL";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("ALL");
    setSelectedOfficer("ALL");
  };

  const handleExport = () => {
    exportToCSV("Claims_List", filteredClaims, {
      claimNumber: "Claim Number",
      policyNumber: "Policy Number",
      customerName: "Customer Name",
      claimAmount: "Claim Amount",
      incidentDate: "Incident Date",
      status: "Status",
      assignedOfficerName: "Assigned Officer",
    });
  };

  return (
    <AppLayout>
      <div className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">All Claims</h1>
          <p className="topbar-greeting">System-wide claim administration & decisions</p>
        </div>
        <div className="topbar-actions">
          <Button variant="outlined" icon="download" onClick={handleExport}>
            Export CSV
          </Button>
        </div>
      </div>

      <div className="page-container">
        {/* Inline Assign Agent Form Card */}
        {assignForm && (
          <div className="card" style={{ marginBottom: 20, border: "1.5px solid #534AB7" }}>
            <div className="card-header" style={{ padding: "16px 20px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="material-icons" style={{ color: "#534AB7" }}>person_add</span>
                <span className="card-title" style={{ fontSize: 16, fontWeight: 700 }}>
                  Assign Officer — Claim {assignForm.claimNumber}
                </span>
              </div>
              <Button variant="ghost" icon="close" iconStyle={{ fontSize: 20 }} onClick={() => setAssignForm(null)} style={{ padding: 4 }} />
            </div>

            <div className="card-body" style={{ padding: "16px 20px 20px" }}>
              <Alert type="error" message={assignError} style={{ marginBottom: 14 }} />

              <div className="form-grid">
                <div className="form-group full">
                  <label className="form-label">Select Officer *</label>
                  <select
                    className="form-select"
                    value={selectedOfficerId}
                    onChange={(e) => setSelectedOfficerId(e.target.value)}
                  >
                    <option value="">Select an insurance officer…</option>
                    {officers.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.fullName} ({a.email}) — {a.activeTaskCount ?? 0} active task{(a.activeTaskCount === 1) ? "" : "s"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18, borderTop: "1px solid #f3f4f6", paddingTop: 14 }}>
                <Button variant="ghost" onClick={() => setAssignForm(null)} disabled={assignLoading}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleAssign} loading={assignLoading}>
                  Assign Officer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Inline Decide Claim Form Card */}
        {decideForm && (
          <div className="card" style={{ marginBottom: 20, border: "1.5px solid #16a34a" }}>
            <div className="card-header" style={{ padding: "16px 20px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="material-icons" style={{ color: "#16a34a" }}>gavel</span>
                <span className="card-title" style={{ fontSize: 16, fontWeight: 700 }}>
                  Final Decision — Claim {decideForm.claimNumber}
                </span>
              </div>
              <Button variant="ghost" icon="close" iconStyle={{ fontSize: 20 }} onClick={() => setDecideForm(null)} style={{ padding: 4 }} />
            </div>

            <div className="card-body" style={{ padding: "16px 20px 20px" }}>
              <Alert type="error" message={decideError} style={{ marginBottom: 14 }} />

              <div className="form-grid">
                <div className="form-group full">
                  <label className="form-label">Decision *</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[["APPROVED", "✓ Approve Claim"], ["REJECTED", "✗ Reject Claim"]].map(([val, lbl]) => (
                      <button
                        key={val}
                        type="button"
                        className={decideStatus === val ? (val === "APPROVED" ? "btn-success" : "btn-danger") : "btn-ghost"}
                        style={{ flex: 1, justifyContent: "center" }}
                        onClick={() => setDecideStatus(val)}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group full">
                  <label className="form-label">Decision Remarks * (min 5 chars)</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Enter decision rationale..."
                    value={decideRemarks}
                    onChange={(e) => setDecideRemarks(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18, borderTop: "1px solid #f3f4f6", paddingTop: 14 }}>
                <Button variant="ghost" onClick={() => setDecideForm(null)} disabled={decideLoading}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleDecide} loading={decideLoading}>
                  Save Final Decision
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
              <button className="btn-ghost" onClick={() => setSelected(null)} style={{ padding: 4 }}>
                <span className="material-icons" style={{ fontSize: 20 }}>close</span>
              </button>
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
                              <td className="td-muted">{c.assignedAgentName || "—"}</td>
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
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #f3f4f6" }}>
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

        {/* Filter Bar */}
        <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 240px", minWidth: 200 }}>
            <span className="material-icons" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: "#9ca3af" }}>
              search
            </span>
            <input
              type="text"
              className="form-input"
              placeholder="Search by customer name…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 34, height: 38, fontSize: 13 }}
            />
          </div>

          <select
            className="filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #e5e7eb", fontSize: 13, height: 38, minWidth: 160 }}
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="RECOMMENDED_APPROVAL">Rec. Approval</option>
            <option value="RECOMMENDED_REJECTION">Rec. Rejection</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            className="filter-select"
            value={selectedOfficer}
            onChange={(e) => setSelectedOfficer(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #e5e7eb", fontSize: 13, height: 38, minWidth: 160 }}
          >
            <option value="ALL">All Officers</option>
            <option value="UNASSIGNED">Unassigned Only</option>
            <option value="ASSIGNED">Assigned Only</option>
            {officers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.fullName || o.username}
              </option>
            ))}
          </select>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Claims List</span>
            <span className="count-badge">
              {filteredClaims.length} visible ({data.totalRecords} total)
            </span>
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
                      <th>Policy #</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Officer</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClaims.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <EmptyState icon="assignment" message={hasActiveFilters ? "No claims match the active filters" : "No claims found"} />
                        </td>
                      </tr>
                    ) : (
                      filteredClaims.map((c) => (
                        <tr key={c.claimId}>
                          <td className="td-mono">{c.claimNumber}</td>
                          <td className="td-mono">{c.policyNumber}</td>
                          <td className="td-bold">{c.customerName || "—"}</td>
                          <td className="td-amount">{formatINR(c.claimAmount)}</td>
                          <td className="td-muted">{c.assignedOfficerName || "—"}</td>
                          <td>
                            <StatusBadge status={c.status} />
                          </td>
                          <td>
                            <div className="action-row">
                              <button className="btn-ghost" onClick={() => openDetail(c)}>
                                Details
                              </button>
                              <button
                                className="btn-outlined"
                                onClick={() => openAssign(c)}
                                disabled={Boolean(c.assignedOfficerId || c.assignedOfficerName || c.status === "APPROVED" || c.status === "REJECTED")}
                                style={
                                  (c.assignedOfficerId || c.assignedOfficerName || c.status === "APPROVED" || c.status === "REJECTED")
                                    ? { opacity: 0.5, cursor: "not-allowed", pointerEvents: "none" }
                                    : {}
                                }
                              >
                                {c.assignedOfficerId || c.assignedOfficerName ? "Assigned" : "Assign"}
                              </button>
                              <button
                                className="btn-primary"
                                onClick={() => openDecide(c)}
                                disabled={Boolean(c.status === "APPROVED" || c.status === "REJECTED" || c.status === "CANCELLED")}
                                style={
                                  (c.status === "APPROVED" || c.status === "REJECTED" || c.status === "CANCELLED")
                                    ? { opacity: 0.5, cursor: "not-allowed", pointerEvents: "none" }
                                    : {}
                                }
                              >
                                {c.status === "APPROVED" ? "Approved" : c.status === "REJECTED" ? "Rejected" : "Decide"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
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

export default Claims;
