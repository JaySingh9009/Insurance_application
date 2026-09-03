import { useEffect, useState } from "react";
import { planApi } from "../../api/planApi";
import { productApi } from "../../api/productApi";
import AppLayout from "../../components/layout/AppLayout";
import StatusBadge, { ActiveBadge } from "../../components/common/StatusBadge";
import Pagination from "../../components/common/Pagination";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import { formatINR } from "../../utils/formatters";
import { exportToCSV } from "../../utils/csv";
import "../../styles/shared.css";

const PREMIUM_TYPES = ["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL", "ONE_TIME"];

export function Plans() {
  const [data, setData] = useState({ records: [], totalRecords: 0, totalPages: 0 });
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    productId: "",
    planName: "",
    coverageAmount: "",
    premiumAmount: "",
    premiumType: "ANNUAL",
    allowedPremiumTypes: ["MONTHLY", "QUARTERLY", "ANNUAL"],
    duration: 1,
    description: "",
    termsAndConditions: "Standard policy terms and conditions apply to this plan.",
  });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const f = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }));

  // Derive the product type of the currently selected product
  const selectedProduct = products.find((p) => String(p.productId) === String(form.productId));
  const isTravel = selectedProduct?.productType === "TRAVEL";

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await planApi.getAll(page, 10, "createdAt", "desc");
      setData(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await productApi.getAllActive(100);
      setProducts((res.data.records || []).filter((p) => p.active));
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchProducts();
  }, [page]);

  const ALL_FREQUENCIES = ["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL", "ONE_TIME"];

  const openCreate = () => {
    setForm({
      productId: products[0]?.productId || "",
      planName: "",
      coverageAmount: "",
      premiumAmount: "",
      premiumType: "ANNUAL",
      allowedPremiumTypes: ALL_FREQUENCIES,
      duration: 1,
      description: "",
      termsAndConditions: "Standard policy terms and conditions apply to this plan.",
    });
    setFormError("");
    setModal({ mode: "create" });
  };

  const handleSave = async () => {
    if (!form.productId) {
      setFormError("Please select an insurance product.");
      return;
    }
    if (!form.planName || !form.planName.trim()) {
      setFormError("Plan name is required.");
      return;
    }
    if (/\d/.test(form.planName)) {
      setFormError("Plan name must not contain numbers.");
      return;
    }
    const trimmedName = form.planName.trim().toLowerCase();
    const isDuplicate = data.records.some(
      (p) => String(p.productId) === String(form.productId) && p.planName.trim().toLowerCase() === trimmedName
    );
    if (isDuplicate) {
      setFormError("A policy plan with this name already exists for the selected product.");
      return;
    }
    if (form.coverageAmount === "" || form.coverageAmount === null || form.coverageAmount === undefined) {
      setFormError("Coverage amount is required.");
      return;
    }
    if (Number(form.coverageAmount) <= 0) {
      setFormError("Coverage amount cannot be negative or zero.");
      return;
    }
    if (form.premiumAmount === "" || form.premiumAmount === null || form.premiumAmount === undefined) {
      setFormError("Premium amount is required.");
      return;
    }
    if (Number(form.premiumAmount) <= 0) {
      setFormError("Premium amount cannot be negative or zero.");
      return;
    }
    const durationVal = form.duration;
    if (durationVal === "" || durationVal === null || durationVal === undefined) {
      setFormError(isTravel ? "Maximum trip days is required." : "Duration is required.");
      return;
    }
    if (Number(durationVal) <= 0) {
      setFormError(isTravel ? "Maximum trip days cannot be negative or zero." : "Duration cannot be negative or zero.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      await planApi.create({
        ...form,
        productId: Number(form.productId),
        coverageAmount: Number(form.coverageAmount),
        premiumAmount: Number(form.premiumAmount),
        premiumType: isTravel ? "ONE_TIME" : "ANNUAL",
        duration: Number(durationVal),
        termsAndConditions: form.termsAndConditions || "Standard terms apply.",
        allowedPremiumTypes: ALL_FREQUENCIES,
      });
      setModal(null);
      fetchPlans();
    } catch (e) {
      const errData = e.response?.data;
      const errMsg = errData?.message || (errData?.errors ? Object.values(errData.errors).join(". ") : null) || "Failed to create plan.";
      setFormError(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p) => {
    try {
      if (p.active) {
        await planApi.deactivate(p.planId);
      } else {
        await planApi.activate(p.planId);
      }
      fetchPlans();
    } catch (e) {
      alert(e.response?.data?.message || "Operation failed.");
    }
  };


  const handleExport = () => {
    exportToCSV("Policy_Plans", data.records, {
      planName: "Plan Name",
      productName: "Product Name",
      coverageAmount: "Coverage Amount",
      premiumAmount: "Premium Amount",
      premiumType: "Premium Frequency",
      duration: "Duration",
      active: "Status",
    });
  };

  return (
    <AppLayout>
      <div className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Policy Plans</h1>
          <p className="topbar-greeting">Manage coverage & premium offerings</p>
        </div>
        <div className="topbar-actions">
          <Button variant="outlined" icon="download" onClick={handleExport}>
            Export CSV
          </Button>
          <Button variant="primary" icon={modal ? "close" : "add"} onClick={() => (modal ? setModal(null) : openCreate())}>
            {modal ? "Close Form" : "New Plan"}
          </Button>
        </div>
      </div>

      <div className="page-container">
        {/* Inline Form Card for Plan Creation */}
        {modal && (
          <div className="card" style={{ marginBottom: 20, border: "1.5px solid #534AB7" }}>
            <div className="card-header" style={{ padding: "16px 20px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="material-icons" style={{ color: "#534AB7" }}>fact_check</span>
                <span className="card-title" style={{ fontSize: 16, fontWeight: 700 }}>
                  {modal.mode === "create" ? "New Policy Plan" : "Edit Plan"}
                </span>
              </div>
              <Button variant="ghost" icon="close" iconStyle={{ fontSize: 20 }} onClick={() => setModal(null)} style={{ padding: 4 }} />
            </div>

            <div className="card-body" style={{ padding: "16px 20px 20px" }}>
              <Alert type="error" message={formError} style={{ marginBottom: 14 }} />

              <div className="form-grid">
                <div className="form-group full">
                  <label className="form-label">Product *</label>
                  <select className="form-select" value={form.productId} onChange={f("productId")}>
                    <option value="">Select product…</option>
                    {products.map((p) => (
                      <option key={p.productId} value={p.productId}>
                        {p.productName} ({p.productType})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group full">
                  <label className="form-label">Plan Name * </label>
                  <input
                    className="form-input"
                    placeholder="e.g. LifeShield Premium"
                    value={form.planName}
                    onChange={(e) => setForm((prev) => ({ ...prev, planName: e.target.value.replace(/\d/g, "") }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Coverage Amount (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="form-input"
                    placeholder="500000"
                    value={form.coverageAmount}
                    onKeyDown={(e) => {
                      if (e.key === "." || e.key === "," || e.key === "e" || e.key === "-" || e.key === "+") e.preventDefault();
                    }}
                    onChange={(e) => setForm((prev) => ({ ...prev, coverageAmount: e.target.value.replace(/[^\d]/g, "") }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{isTravel ? "Flat Trip Premium (₹) *" : "Annual Premium Amount (₹) *"}</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="form-input"
                    placeholder="12000"
                    value={form.premiumAmount}
                    onKeyDown={(e) => {
                      if (e.key === "." || e.key === "," || e.key === "e" || e.key === "-" || e.key === "+") e.preventDefault();
                    }}
                    onChange={(e) => setForm((prev) => ({ ...prev, premiumAmount: e.target.value.replace(/[^\d]/g, "") }))}
                  />
                  <div style={{ fontSize: 11, color: isTravel ? "#7c3aed" : "#2563eb", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    <span className="material-icons" style={{ fontSize: 13 }}>info</span>
                    {isTravel
                      ? "Travel plan fee is billed as a flat ONE_TIME payment."
                      : "Base premium is set to ANNUAL. Customers choose payment frequencies (Monthly, Quarterly, Annual) at purchase."}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {isTravel ? "Maximum Trip Days *" : "Duration (years) *"}
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder={isTravel ? "e.g. 30" : "10"}
                    min={1}
                    step="1"
                    max={isTravel ? 365 : 40}
                    value={form.duration}
                    onKeyDown={(e) => {
                      if (e.key === "." || e.key === "," || e.key === "e" || e.key === "-" || e.key === "+") e.preventDefault();
                    }}
                    onChange={(e) => setForm((prev) => ({ ...prev, duration: e.target.value.replace(/[^\d]/g, "") }))}
                  />
                  {isTravel && (
                    <div style={{ fontSize: 11, color: "#7c3aed", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      <span className="material-icons" style={{ fontSize: 13 }}>info</span>
                      For Travel plans, this is the <strong>maximum trip duration in days</strong> (e.g. 15, 30, 60, 90).
                    </div>
                  )}
                </div>
                <div className="form-group full">
                  <label className="form-label">Description (optional)</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Plan summary..."
                    value={form.description}
                    onChange={f("description")}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18, borderTop: "1px solid #f3f4f6", paddingTop: 14 }}>
                <Button variant="ghost" onClick={() => setModal(null)} disabled={saving}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSave} loading={saving}>
                  Save Plan
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <span className="card-title">Policy Plans</span>
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
                      <th>Plan Name</th>
                      <th>Product</th>
                      <th>Coverage</th>
                      <th>Premium</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.records.length === 0 ? (
                      <tr>
                        <td colSpan={8}>
                          <EmptyState icon="fact_check" message="No policy plans found" />
                        </td>
                      </tr>
                    ) : (
                      data.records.map((p) => (
                        <tr key={p.planId}>
                          <td className="td-bold">{p.planName}</td>
                          <td className="td-muted">{p.productName || "—"}</td>
                          <td className="td-amount">{formatINR(p.coverageAmount)}</td>
                          <td className="td-amount">{formatINR(p.premiumAmount)}</td>
                          <td>
                            <StatusBadge status={p.premiumType} />
                          </td>
                          <td className="td-muted">
                            {p.duration} {(p.productType?.toUpperCase() === "TRAVEL" || p.productName?.toLowerCase().includes("travel") || p.planName?.toLowerCase().includes("travel")) ? "days" : "y"}
                          </td>
                          <td>
                            <ActiveBadge active={p.active} />
                          </td>
                          <td>
                            <div className="action-row">
                              <button className={p.active ? "btn-danger" : "btn-success"} onClick={() => toggleActive(p)}>
                                {p.active ? "Deactivate" : "Activate"}
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

export default Plans;
