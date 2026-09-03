import { useEffect, useState } from "react";
import { claimApi } from "../../api/claimApi";
import { policyApi } from "../../api/policyApi";
import AppLayout from "../../components/layout/AppLayout";
import SubmitClaimForm from "../../components/forms/SubmitClaimForm";
import StatusBadge from "../../components/common/StatusBadge";
import Pagination from "../../components/common/Pagination";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import { formatDate, formatDateTime, formatINR } from "../../utils/formatters";
import { exportToCSV } from "../../utils/csv";
import "../../styles/shared.css";

function MyClaims() {
  const [data, setData] = useState({ records: [], totalRecords: 0, totalPages: 0 });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [showSubmit, setShowSubmit] = useState(false);
  const [policies, setPolicies] = useState([]);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await claimApi.getMyClaims(page, 10, "createdAt", "desc");
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPolicies = async () => {
    try {
      const res = await policyApi.getMyPolicies(0, 100);
      setPolicies(res.data.records || []);
    } catch (e) {
      console.error(e);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => {
    fetchClaims();
    fetchMyPolicies();
  }, [page]);

  const openDetail = async (claim) => {
    if (selected?.claimId === claim.claimId) {
      setSelected(null);
      return;
    }
    setSelected(claim);
    setHistory([]);
    setDocuments([]);
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


  const handleExportCSV = () => {
    exportToCSV(data.records, "My_Claims", [
      { header: "Claim #", key: "claimNumber" },
      { header: "Policy #", key: "policyNumber" },
      { header: "Amount (INR)", key: "claimAmount" },
      { header: "Incident Date", key: "incidentDate" },
      { header: "Status", key: "status" },
    ]);
  };

  return (
    <AppLayout>
      <div className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">My Claims</h1>
          <span className="topbar-greeting">Track and file insurance claims</span>
        </div>
        <div className="topbar-actions">
          <Button variant="primary" icon={showSubmit ? "close" : "add"} onClick={() => setShowSubmit(!showSubmit)}>
            {showSubmit ? "Close Form" : "Submit New Claim"}
          </Button>
        </div>
      </div>

      <div className="page-container">
        {/* Extracted Inline Claim Submission Form */}
        <SubmitClaimForm
          isOpen={showSubmit}
          onClose={() => setShowSubmit(false)}
          policies={policies}
          onSuccess={fetchClaims}
        />

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
              </div>

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

              {/* Claim History Timeline */}
              {history.length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #f3f4f6" }}>
                  <div className="section-title" style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
                    Claim History & Audit Log
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
            <span className="card-title">All Claims</span>
            <span className="count-badge">{data.totalRecords} total</span>
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
                      <th>Amount</th>
                      <th>Incident Date</th>
                      <th>Assigned Officer</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.records.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <EmptyState icon="assignment" message="No claims found" />
                        </td>
                      </tr>
                    ) : (
                      data.records.map((claim) => (
                        <tr key={claim.claimId}>
                          <td className="td-mono">{claim.claimNumber}</td>
                          <td className="td-mono">{claim.policyNumber}</td>
                          <td className="td-amount">{formatINR(claim.claimAmount)}</td>
                          <td className="td-muted">{formatDate(claim.incidentDate)}</td>
                          <td className="td-muted">{claim.assignedOfficerName || "Not assigned"}</td>
                          <td>
                            <StatusBadge status={claim.status} />
                          </td>
                          <td>
                            <Button variant="ghost" onClick={() => openDetail(claim)}>
                              {selected?.claimId === claim.claimId ? "Hide Details" : "Details"}
                            </Button>
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

export default MyClaims;
