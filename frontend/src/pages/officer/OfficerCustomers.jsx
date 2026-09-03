import { useEffect, useState } from "react";
import { customerApi } from "../../api/customerApi";
import AppLayout from "../../components/layout/AppLayout";
import Pagination from "../../components/common/Pagination";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import { formatDate, formatDateTime } from "../../utils/formatters";
import { exportToCSV } from "../../utils/csv";
import "../../styles/shared.css";

function OfficerCustomers() {
  const [data, setData] = useState({ records: [], totalRecords: 0, totalPages: 0 });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [search]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await customerApi.getAllActive(100);
      setData(res.data);

    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const filtered = data.records.filter(
    (c) =>
      !search ||
      c.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / 10);
  const paginated = filtered.slice(page * 10, (page + 1) * 10);

  const handleExport = () => {
    exportToCSV("Customers_List", filtered, {
      fullName: "Full Name",
      email: "Email",
      mobileNumber: "Mobile",
      city: "City",
      state: "State",
      dateOfBirth: "Date of Birth",
    });
  };

  return (
    <AppLayout>
      <header className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Customers</h1>
          <p className="topbar-greeting">Browse customer profiles</p>
        </div>
        <div className="topbar-actions">
          <div className="search-bar">
            <span className="material-icons">search</span>
            <input placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outlined" icon="download" onClick={handleExport}>
            Export CSV
          </Button>
        </div>
      </header>

      <div className="page-container">
        {/* Inline Customer Profile Card */}
        {selected && (
          <div className="card" style={{ marginBottom: 20, border: "1.5px solid #534AB7" }}>
            <div className="card-header" style={{ padding: "16px 20px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="material-icons" style={{ color: "#534AB7" }}>person</span>
                <span className="card-title" style={{ fontSize: 16, fontWeight: 700 }}>Customer Profile — {selected.fullName}</span>
              </div>
              <Button variant="ghost" icon="close" iconStyle={{ fontSize: 20 }} onClick={() => setSelected(null)} style={{ padding: 4 }} />
            </div>
            <div className="card-body" style={{ padding: "16px 20px 20px" }}>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Full Name</span>
                  <span className="info-value">{selected.fullName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email</span>
                  <span className="info-value">{selected.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Mobile</span>
                  <span className="info-value">{selected.mobileNumber || "—"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Date of Birth</span>
                  <span className="info-value">{formatDate(selected.dateOfBirth)}</span>
                </div>
                <div className="info-item" style={{ gridColumn: "1/-1" }}>
                  <span className="info-label">Address</span>
                  <span className="info-value">
                    {[selected.address, selected.city, selected.state, selected.pincode].filter(Boolean).join(", ") || "—"}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Nominee Name</span>
                  <span className="info-value">{selected.nomineeName || "—"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Nominee Relation</span>
                  <span className="info-value">{selected.nomineeRelation || "—"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Joined</span>
                  <span className="info-value">{formatDateTime(selected.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <span className="card-title">Customer List</span>
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
                      <th>Name</th>
                      <th>Email</th>
                      <th>Mobile</th>
                      <th>City</th>
                      <th>State</th>
                      <th>Joined</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <EmptyState message="No customers found" />
                        </td>
                      </tr>
                    ) : (
                      paginated.map((c) => (
                        <tr key={c.customerId}>
                          <td className="td-bold">{c.fullName}</td>
                          <td className="td-muted">{c.email}</td>
                          <td>{c.mobileNumber || "—"}</td>
                          <td>{c.city || "—"}</td>
                          <td>{c.state || "—"}</td>
                          <td className="td-muted">{formatDate(c.createdAt)}</td>
                          <td>
                            <button className="btn-ghost" onClick={() => setSelected(selected?.customerId === c.customerId ? null : c)}>
                              <span className="material-icons">visibility</span> View
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
                totalPages={totalPages}
                totalRecords={filtered.length}
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

export default OfficerCustomers;
