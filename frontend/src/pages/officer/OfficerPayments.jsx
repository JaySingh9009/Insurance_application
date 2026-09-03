import { useEffect, useState } from "react";
import { paymentApi } from "../../api/paymentApi";
import AppLayout from "../../components/layout/AppLayout";
import StatusBadge from "../../components/common/StatusBadge";
import Pagination from "../../components/common/Pagination";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import { formatDateTime, formatINR } from "../../utils/formatters";
import { exportToCSV } from "../../utils/csv";
import "../../styles/shared.css";

const PAYMENT_MODES = ["UPI", "CREDIT_CARD", "DEBIT_CARD", "NET_BANKING"];
const PAYMENT_STATUSES = ["SUCCESS", "PENDING", "FAILED"];

function OfficerPayments() {
  const [data, setData] = useState({ records: [], totalRecords: 0, totalPages: 0 });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchCustomer, setSearchCustomer] = useState("");
  const [selectedMode, setSelectedMode] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  useEffect(() => { fetchPayments(); }, [page]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await paymentApi.getAll(page, 10, "paymentDate", "desc");
      setData(res.data);
    } catch { } finally { setLoading(false); }
  };

  const filtered = data.records.filter(p => {
    const matchesCustomer = !searchCustomer || p.customerName?.toLowerCase().includes(searchCustomer.toLowerCase()) || p.policyNumber?.toLowerCase().includes(searchCustomer.toLowerCase());
    const matchesMode = selectedMode === "ALL" || p.paymentMode === selectedMode;
    const matchesStatus = selectedStatus === "ALL" || p.paymentStatus === selectedStatus;
    return matchesCustomer && matchesMode && matchesStatus;
  });

  const handleExport = async () => {
    try {
      const res = await paymentApi.getAll(0, 100, "paymentDate", "desc");
      const allRecords = res.data.records || [];

      const filteredAll = allRecords.filter(p => {
        const matchesCustomer = !searchCustomer || p.customerName?.toLowerCase().includes(searchCustomer.toLowerCase()) || p.policyNumber?.toLowerCase().includes(searchCustomer.toLowerCase());
        const matchesMode = selectedMode === "ALL" || p.paymentMode === selectedMode;
        const matchesStatus = selectedStatus === "ALL" || p.paymentStatus === selectedStatus;
        return matchesCustomer && matchesMode && matchesStatus;
      });

      const headers = {
        transactionReference: "Transaction Ref",
        policyNumber: "Policy Number",
        customerName: "Customer Name",
        amount: "Amount",
        paymentMode: "Mode",
        paymentDate: "Date & Time",
        paymentStatus: "Status"
      };
      exportToCSV("payments_data", filteredAll, headers);
    } catch {
      alert("Failed to export payments.");
    }
  };

  return (
    <AppLayout>
      <header className="topbar">
          <div className="topbar-left">
            <h1 className="topbar-title">Payments</h1>
            <p className="topbar-greeting">All premium payment records</p>
          </div>
          <div className="topbar-actions">
            <Button variant="outlined" icon="download" onClick={handleExport}>
              Export CSV
            </Button>
          </div>
        </header>
        <div className="page-container">
          <div className="filter-bar" style={{ marginBottom: 20, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div className="search-bar" style={{ width: 240 }}>
              <span className="material-icons">search</span>
              <input 
                placeholder="Search by customer or policy..." 
                value={searchCustomer} 
                onChange={e => setSearchCustomer(e.target.value)} 
              />
            </div>
            
            <select 
              className="filter-select"
              value={selectedMode} 
              onChange={e => setSelectedMode(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #e5e7eb", fontSize: 13, cursor: "pointer", outline: "none" }}
            >
              <option value="ALL">All Modes</option>
              {PAYMENT_MODES.map(m => (
                <option key={m} value={m}>{m.replace(/_/g, " ")}</option>
              ))}
            </select>

            <select 
              className="filter-select"
              value={selectedStatus} 
              onChange={e => setSelectedStatus(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #e5e7eb", fontSize: 13, cursor: "pointer", outline: "none" }}
            >
              <option value="ALL">All Statuses</option>
              {PAYMENT_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <Card title="Payment History" badge={`${filtered.length} visible (${data.totalRecords} total)`}>
            {loading ? <Loader /> : (
              <>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Policy #</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Transaction Ref</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0
                        ? <tr><td colSpan={6}><EmptyState icon="payments" message="No matching payments found" /></td></tr>
                        : filtered.map(p => (
                          <tr key={p.paymentId}>
                            <td className="td-mono">{p.policyNumber}</td>
                            <td className="td-bold">{p.customerName || "—"}</td>
                            <td className="td-amount">{formatINR(p.amount)}</td>
                            <td className="td-mono">{p.transactionReference}</td>
                            <td className="td-muted">{formatDateTime(p.paymentDate)}</td>
                            <td><StatusBadge status={p.paymentStatus} /></td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={page} totalPages={data.totalPages} totalRecords={data.totalRecords} pageSize={10} onChange={setPage} />
              </>
            )}
          </Card>
        </div>
      </AppLayout>
    );
}

export default OfficerPayments;
