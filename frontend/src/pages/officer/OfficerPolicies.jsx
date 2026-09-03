import { useEffect, useState } from "react";
import { policyApi } from "../../api/policyApi";
import { customerApi } from "../../api/customerApi";
import { planApi } from "../../api/planApi";
import AppLayout from "../../components/layout/AppLayout";
import BuyPolicyForm from "../../components/forms/BuyPolicyForm";
import StatusBadge from "../../components/common/StatusBadge";
import Pagination from "../../components/common/Pagination";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import { formatDate, formatINR, getTodayDate } from "../../utils/formatters";
import { exportToCSV } from "../../utils/csv";
import "../../styles/shared.css";

const MONTHS = [
  { value: "ALL", label: "All Months" },
  { value: "0", label: "January" },
  { value: "1", label: "February" },
  { value: "2", label: "March" },
  { value: "3", label: "April" },
  { value: "4", label: "May" },
  { value: "5", label: "June" },
  { value: "6", label: "July" },
  { value: "7", label: "August" },
  { value: "8", label: "September" },
  { value: "9", label: "October" },
  { value: "10", label: "November" },
  { value: "11", label: "December" },
];

function OfficerPolicies() {
  const [data, setData] = useState({ records: [], totalRecords: 0, totalPages: 0 });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedMonth, setSelectedMonth] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState("ALL");

  const [showIssue, setShowIssue] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await policyApi.getAll(page, 10, "createdAt", "desc");
      setData(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [resC, resP] = await Promise.all([
        customerApi.getAllActive(100),
        planApi.getActive(0, 100),
      ]);
      setCustomers(resC.data.records || []);
      setPlans(resP.data.records || []);
    } catch {
      /* ignore */
    }
  };


  useEffect(() => {
    fetchPolicies();
    fetchDropdowns();
  }, [page]);

  const planNames = Array.from(new Set(data.records.map((p) => p.planName).filter(Boolean)));
  const years = Array.from(
    new Set(data.records.map((p) => (p.startDate ? new Date(p.startDate).getFullYear() : null)).filter(Boolean))
  ).sort((a, b) => b - a);

  const filtered = data.records.filter((p) => {
    const matchesPlan = selectedPlan === "ALL" || p.planName === selectedPlan;
    const matchesStatus = selectedStatus === "ALL" || p.status === selectedStatus;
    let matchesMonth = true;
    let matchesYear = true;
    if (p.startDate) {
      const d = new Date(p.startDate);
      if (selectedMonth !== "ALL") matchesMonth = d.getMonth() === Number(selectedMonth);
      if (selectedYear !== "ALL") matchesYear = d.getFullYear() === Number(selectedYear);
    }
    return matchesPlan && matchesStatus && matchesMonth && matchesYear;
  });

  const handleExport = () => {
    exportToCSV("Policies_Catalog", filtered, {
      policyNumber: "Policy Number",
      customerName: "Customer Name",
      planName: "Plan Name",
      startDate: "Start Date",
      endDate: "End Date",
      status: "Status",
    });
  };

  return (
    <AppLayout>
      <header className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Policies</h1>
          <p className="topbar-greeting">All customer policies</p>
        </div>
        <div className="topbar-actions">
          <Button variant="outlined" icon="download" onClick={handleExport}>
            Export CSV
          </Button>
          <Button variant="primary" icon={showIssue ? "close" : "add"} onClick={() => setShowIssue(!showIssue)}>
            {showIssue ? "Close Form" : "Issue Policy"}
          </Button>
        </div>
      </header>

      <div className="page-container">
        {/* Issue Policy Form Card */}
        <BuyPolicyForm
          isOpen={showIssue}
          onClose={() => setShowIssue(false)}
          plans={plans}
          customers={customers}
          isIssueMode={true}
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
                  <span className="info-label">Customer Name</span>
                  <span className="info-value" style={{ fontWeight: 600 }}>{selected.customerName || "—"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Plan Name</span>
                  <span className="info-value">{selected.planName || "—"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status</span>
                  <div>
                    <StatusBadge status={selected.status} />
                  </div>
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
                <div className="info-item">
                  <span className="info-label">Total Premium Paid</span>
                  <span className="info-value td-amount">{formatINR(selected.totalPremiumPaid)}</span>
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

          <select
            className="filter-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "0.5px solid #e5e7eb",
              fontSize: 13,
              cursor: "pointer",
              outline: "none",
            }}
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "0.5px solid #e5e7eb",
              fontSize: 13,
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="ALL">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">All Policies</span>
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
                      <th>Customer</th>
                      <th>Plan</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Next Due</th>
                      <th>Status</th>
                      <th>Action</th>
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
                          <td className="td-bold">{p.customerName}</td>
                          <td>{p.planName}</td>
                          <td className="td-muted">{formatDate(p.startDate)}</td>
                          <td className="td-muted">{formatDate(p.endDate)}</td>
                          <td className="td-muted">{(p.status === "PENDING_PAYMENT" || p.productType === "TRAVEL" || p.selectedPremiumType === "ONE_TIME" || p.planName?.toLowerCase().includes("travel") || p.productName?.toLowerCase().includes("travel")) ? "—" : formatDate(p.nextPaymentDueDate)}</td>
                          <td>
                            <StatusBadge status={p.status} />
                          </td>
                          <td>
                            <button
                              className="btn-ghost"
                              onClick={() => setSelected(selected?.policyId === p.policyId ? null : p)}
                            >
                              <span className="material-icons">visibility</span>
                            </button>
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

export default OfficerPolicies;
