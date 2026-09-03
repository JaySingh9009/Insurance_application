import { useEffect, useState } from "react";
import { productApi } from "../../api/productApi";
import AppLayout from "../../components/layout/AppLayout";
import StatusBadge, { ActiveBadge } from "../../components/common/StatusBadge";
import Pagination from "../../components/common/Pagination";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import { exportToCSV } from "../../utils/csv";
import "../../styles/shared.css";

const PRODUCT_TYPES = ["HEALTH", "MOTOR", "LIFE", "TRAVEL"];

export function Products() {
  const [data, setData] = useState({ records: [], totalRecords: 0, totalPages: 0 });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ productName: "", productType: "HEALTH", description: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productApi.getAll(page, 10, "createdAt", "desc");
      setData(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const openCreate = () => {
    setForm({ productName: "", productType: "HEALTH", description: "" });
    setFormError("");
    setModal({ mode: "create" });
  };

  const openEdit = (p) => {
    setForm({ productName: p.productName, productType: p.productType, description: p.description || "" });
    setFormError("");
    setModal({ mode: "edit", id: p.productId });
  };

  const handleSave = async () => {
    if (!form.productName.trim() || !form.description.trim()) {
      setFormError("All fields are required.");
      return;
    }
    if (form.description.trim().length < 10) {
      setFormError("Description must be at least 10 characters long.");
      return;
    }
    if (/\d/.test(form.productName)) {
      setFormError("Product name must not contain numbers.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (modal.mode === "create") {
        await productApi.create(form);
      } else {
        await productApi.update(modal.id, form);
      }
      setModal(null);
      fetchProducts();
    } catch (e) {
      const errData = e.response?.data;
      const errMsg = errData?.message || (errData?.errors ? Object.values(errData.errors).join(". ") : null) || "Operation failed.";
      setFormError(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p) => {
    try {
      if (p.active) {
        await productApi.deactivate(p.productId);
      } else {
        await productApi.activate(p.productId);
      }
      fetchProducts();
    } catch (e) {
      alert(e.response?.data?.message || "Operation failed.");
    }
  };


  const handleExport = () => {
    exportToCSV("Insurance_Products", data.records, {
      productName: "Product Name",
      productType: "Product Type",
      description: "Description",
      active: "Status",
    });
  };

  return (
    <AppLayout>
      <div className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Insurance Products</h1>
          <p className="topbar-greeting">Manage categories & product types</p>
        </div>
        <div className="topbar-actions">
          <Button variant="outlined" icon="download" onClick={handleExport}>
            Export CSV
          </Button>
          <Button variant="primary" icon={modal ? "close" : "add"} onClick={() => (modal ? setModal(null) : openCreate())}>
            {modal ? "Close Form" : "New Product"}
          </Button>
        </div>
      </div>

      <div className="page-container">
        {/* Inline Product Form Card */}
        {modal && (
          <div className="card" style={{ marginBottom: 20, border: "1.5px solid #534AB7" }}>
            <div className="card-header" style={{ padding: "16px 20px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="material-icons" style={{ color: "#534AB7" }}>inventory_2</span>
                <span className="card-title" style={{ fontSize: 16, fontWeight: 700 }}>
                  {modal.mode === "create" ? "New Product" : "Edit Product"}
                </span>
              </div>
              <Button variant="ghost" icon="close" iconStyle={{ fontSize: 20 }} onClick={() => setModal(null)} style={{ padding: 4 }} />
            </div>

            <div className="card-body" style={{ padding: "16px 20px 20px" }}>
              <Alert type="error" message={formError} style={{ marginBottom: 14 }} />

              <div className="form-grid">
                <div className="form-group full">
                  <label className="form-label">Product Name * </label>
                  <input
                    className="form-input"
                    placeholder="e.g. HealthGuard Premium"
                    value={form.productName}
                    onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value.replace(/\d/g, "") }))}
                  />
                </div>
                <div className="form-group full">
                  <label className="form-label">Product Type *</label>
                  <select
                    className="form-select"
                    value={form.productType}
                    onChange={(e) => setForm((f) => ({ ...f, productType: e.target.value }))}
                  >
                    {PRODUCT_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group full">
                  <label className="form-label">Description *</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Describe the product…"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    style={{ minHeight: 100 }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18, borderTop: "1px solid #f3f4f6", paddingTop: 14 }}>
                <Button variant="ghost" onClick={() => setModal(null)} disabled={saving}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSave} loading={saving}>
                  Save Product
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <span className="card-title">Products List</span>
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
                      <th>Product Name</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.records.length === 0 ? (
                      <tr>
                        <td colSpan={5}>
                          <EmptyState icon="inventory_2" message="No products created yet" />
                        </td>
                      </tr>
                    ) : (
                      data.records.map((p) => (
                        <tr key={p.productId}>
                          <td className="td-bold">{p.productName}</td>
                          <td>
                            <StatusBadge status={p.productType} />
                          </td>
                          <td className="td-muted" style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.description}
                          </td>
                          <td>
                            <ActiveBadge active={p.active} />
                          </td>
                          <td>
                            <div className="action-row">
                              <button className="btn-ghost" onClick={() => openEdit(p)}>
                                <span className="material-icons">edit</span>
                              </button>
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

export default Products;
