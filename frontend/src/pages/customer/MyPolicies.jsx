import { useEffect, useState } from "react";
import { policyApi } from "../../api/policyApi";
import AppLayout from "../../components/layout/AppLayout";
import PayPremiumForm from "../../components/forms/PayPremiumForm";
import StatusBadge from "../../components/common/StatusBadge";
import Pagination from "../../components/common/Pagination";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import { formatDate, formatINR } from "../../utils/formatters";
import "../../styles/shared.css";

function MyPolicies() {
  const [data, setData] = useState({ records: [], totalRecords: 0, totalPages: 0 });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await policyApi.getMyPolicies(page, 10, "createdAt", "desc");
      setData(res.data);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => {
    fetchPolicies();
  }, [page]);

  const planNames = Array.from(new Set(data.records.map((p) => p.planName).filter(Boolean)));

  const filtered = data.records.filter((p) => {
    const matchesPlan = selectedPlan === "ALL" || p.planName === selectedPlan;
    const matchesStatus = selectedStatus === "ALL" || p.status === selectedStatus;
    return matchesPlan && matchesStatus;
  });

  return (
    <AppLayout>
      <header className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">My Policies</h1>
          <p className="topbar-greeting">All your active insurance policies</p>
        </div>
      </header>

      <div className="page-container">
        {/* Extracted Inline Payment Form */}
        <PayPremiumForm
          policy={payModal}
          isOpen={Boolean(payModal)}
          onClose={() => setPayModal(null)}
          onSuccess={fetchPolicies}
        />

        {/* Inline Policy Details Card */}
        {selected && (
          <div className="card" style={{ marginBottom: 20, border: "1.5px solid #534AB7" }}>
            <div className="card-header" style={{ padding: "16px 20px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span className="material-icons" style={{ color: "#534AB7", flexShrink: 0 }}>policy</span>
                <span className="card-title" style={{ fontSize: 16, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  Policy Details — {selected.policyNumber}
                </span>
              </div>
              <Button variant="ghost" icon="close" iconStyle={{ fontSize: 20 }} onClick={() => setSelected(null)} style={{ padding: 4 }} />
            </div>

            <div className="card-body" style={{ padding: "16px 20px 20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px 20px" }}>
                  <div className="info-item">
                    <span className="info-label">Policy Number</span>
                    <span className="info-value td-mono" style={{ wordBreak: "break-all", fontSize: 13 }}>{selected.policyNumber}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Status</span>
                    <div>
                      <StatusBadge status={selected.status} />
                    </div>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Plan Name</span>
                    <span className="info-value">{selected.planName || "—"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Payment Frequency</span>
                    <span className="info-value" style={{ fontWeight: 700, color: "#6366f1" }}>
                      {selected.selectedPremiumType ? selected.selectedPremiumType.replace("_", " ") : "ANNUAL"}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Installment Amount</span>
                    <span className="info-value td-bold" style={{ color: "#10b981" }}>
                      {selected.installmentAmount ? formatINR(selected.installmentAmount) : formatINR(selected.premiumAmount)}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Start Date</span>
                    <span className="info-value">{formatDate(selected.startDate)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">End Date</span>
                    <span className="info-value">{formatDate(selected.endDate)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Next Payment Due</span>
                    <span className="info-value">{(selected.status === "PENDING_PAYMENT" || selected.productType === "TRAVEL" || selected.selectedPremiumType === "ONE_TIME" || selected.planName?.toLowerCase().includes("travel") || selected.productName?.toLowerCase().includes("travel")) ? "—" : formatDate(selected.nextPaymentDueDate)}</span>
                  </div>
                </div>

                {/* ── Motor Vehicle Details (only for MOTOR policies) ── */}
                {selected.productType === "MOTOR" && (selected.vehicleRegistrationNo || selected.vehicleMakeModel) && (
                  <div style={{ marginTop: 20, padding: "14px 16px", borderRadius: 10, background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                      <span className="material-icons" style={{ fontSize: 18, color: "#2563eb" }}>directions_car</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#60a5fa", textTransform: "uppercase", letterSpacing: 0.5 }}>Vehicle Details</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px 20px" }}>
                      <div className="info-item">
                        <span className="info-label">Registration No.</span>
                        <span className="info-value td-mono" style={{ color: "#60a5fa", fontWeight: 700 }}>{selected.vehicleRegistrationNo || "—"}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Vehicle</span>
                        <span className="info-value">{selected.vehicleMakeModel ? `${selected.vehicleMakeModel} (${selected.vehicleYear})` : "—"}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">IDV (Insured Value)</span>
                        <span className="info-value td-bold" style={{ color: "#93c5fd" }}>{selected.idvAmount ? formatINR(selected.idvAmount) : "—"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Health Pre-Existing Diseases (only for HEALTH policies) ── */}
                {selected.productType === "HEALTH" && selected.preExistingDiseases && selected.preExistingDiseases.length > 0 && (
                  <div style={{ marginTop: 20, padding: "14px 16px", borderRadius: 10, background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                      <span className="material-icons" style={{ fontSize: 18, color: "#16a34a" }}>local_hospital</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", textTransform: "uppercase", letterSpacing: 0.5 }}>Declared Pre-Existing Conditions</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {selected.preExistingDiseases.map((disease) => (
                        <span key={disease} style={{ padding: "4px 10px", borderRadius: 16, background: "rgba(22,163,74,0.15)", border: "1px solid rgba(22,163,74,0.3)", color: "#4ade80", fontSize: 12, fontWeight: 600 }}>
                          {disease.replace("_", " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Life Policy Nominee Details (only for LIFE policies) ── */}
                {selected.productType === "LIFE" && (selected.nomineeName || selected.nomineeRelation) && (
                  <div style={{ marginTop: 20, padding: "14px 16px", borderRadius: 10, background: "rgba(147,51,234,0.06)", border: "1px solid rgba(147,51,234,0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                      <span className="material-icons" style={{ fontSize: 18, color: "#a855f7" }}>family_restroom</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#c084fc", textTransform: "uppercase", letterSpacing: 0.5 }}>Nominee Information</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px 20px" }}>
                      <div className="info-item">
                        <span className="info-label">Nominee Name</span>
                        <span className="info-value" style={{ color: "#c084fc", fontWeight: 700 }}>{selected.nomineeName || "—"}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Relationship</span>
                        <span className="info-value">{selected.nomineeRelation || "—"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
          </div>
        )}

        <div
          className="filter-bar"
          style={{ marginBottom: 20, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}
        >
          <select
            className="filter-select"
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "0.5px solid #e5e7eb",
              fontSize: 13,
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="ALL">All Plans</option>
            {planNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "0.5px solid #e5e7eb",
              fontSize: 13,
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING_PAYMENT">Pending Payment</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Policies</span>
            <span className="count-badge">
              {filtered.length} visible ({data.totalRecords} total)
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
                      <th>Policy #</th>
                      <th>Plan</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Next Due</th>
                      <th>Total Paid</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8}>
                          <EmptyState icon="policy" message="No matching policies found" />
                        </td>
                      </tr>
                    ) : (
                      filtered.map((p) => (
                        <tr key={p.policyId}>
                          <td className="td-mono">{p.policyNumber}</td>
                          <td className="td-bold">{p.planName}</td>
                          <td className="td-muted">{formatDate(p.startDate)}</td>
                          <td className="td-muted">{formatDate(p.endDate)}</td>
                          <td
                            className="td-muted"
                            style={{
                              color:
                                p.status !== "PENDING_PAYMENT" && p.nextPaymentDueDate && new Date(p.nextPaymentDueDate) < new Date()
                                  ? "#dc2626"
                                  : "",
                            }}
                          >
                            {(p.status === "PENDING_PAYMENT" || p.productType === "TRAVEL" || p.selectedPremiumType === "ONE_TIME" || p.planName?.toLowerCase().includes("travel") || p.productName?.toLowerCase().includes("travel")) ? "—" : formatDate(p.nextPaymentDueDate)}
                          </td>
                          <td className="td-amount">{formatINR(p.totalPremiumPaid)}</td>
                          <td>
                            <StatusBadge status={p.status} />
                          </td>
                          <td>
                            <div className="action-row">
                              <Button
                                variant="ghost"
                                icon="visibility"
                                onClick={() => setSelected(selected?.policyId === p.policyId ? null : p)}
                              />
                              {(() => {
                                const isTravel = p.productType === "TRAVEL" || p.planName?.toLowerCase().includes("travel") || p.productName?.toLowerCase().includes("travel");
                                const isTravelOrOneTime = isTravel || p.selectedPremiumType === "ONE_TIME";
                                const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
                                const isDeparturePassed = isTravel && p.startDate && new Date(p.startDate) < todayDate;

                                if (isDeparturePassed && (p.status === "PENDING_PAYMENT" || p.status === "EXPIRED")) {
                                  return (
                                    <span
                                      className="badge"
                                      style={{ fontSize: 11, background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", padding: "4px 8px", border: "1px solid rgba(239, 68, 68, 0.3)" }}
                                      title="Payment can no longer be accepted as trip departure date has passed"
                                    >
                                      Trip Passed / Expired
                                    </span>
                                  );
                                }

                                const isDue =
                                  p.status === "PENDING_PAYMENT" ||
                                  p.status === "LAPSED" ||
                                  p.status === "INACTIVE" ||
                                  p.status === "GRACE_PERIOD" ||
                                  (!isTravelOrOneTime &&
                                    p.status === "ACTIVE" &&
                                    p.nextPaymentDueDate &&
                                    new Date(p.nextPaymentDueDate) <= new Date());
                                if (isDue) {
                                  return (
                                    <Button
                                      variant="success"
                                      icon="payments"
                                      onClick={() => setPayModal(payModal?.policyId === p.policyId ? null : p)}
                                    >
                                      {p.status === "LAPSED" || p.status === "INACTIVE" ? "Revive / Pay" : "Pay"}
                                    </Button>
                                  );
                                }
                                return (
                                  <span
                                    className="badge badge-active"
                                    style={{ fontSize: 11, background: "rgba(16, 185, 129, 0.15)", color: "#10b981", padding: "4px 8px" }}
                                    title={isTravelOrOneTime ? "Fully Paid Policy" : `Next due date: ${formatDate(p.nextPaymentDueDate)}`}
                                  >
                                    ✓ Paid / Up to Date
                                  </span>
                                );
                              })()}
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

export default MyPolicies;
