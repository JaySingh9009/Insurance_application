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

export function Payments() {
  const [data, setData] = useState({ records: [], totalRecords: 0, totalPages: 0 });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await paymentApi.getAll(page, 10, "paymentDate", "desc");
      setData(res.data);

    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page]);

  const handleExport = () => {
    exportToCSV("Payments_Log", data.records, {
      policyNumber: "Policy Number",
      amount: "Amount",
      paymentMode: "Payment Mode",
      transactionReference: "Transaction Reference",
      paymentDate: "Payment Date",
      paymentStatus: "Status",
    });
  };

  return (
    <AppLayout>
      <div className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Payments Log</h1>
          <p className="topbar-greeting">Track revenue & transaction records</p>
        </div>
        <div className="topbar-actions">
          <Button variant="outlined" icon="download" onClick={handleExport}>
            Export CSV
          </Button>
        </div>
      </div>

      <div className="page-container">
        <Card title="All Transactions" badge={`${data.totalRecords} total`}>

          {loading ? (
            <Loader />
          ) : (
            <>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Policy #</th>
                      <th>Amount</th>
                      <th>Reference</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.records.length === 0 ? (
                      <tr>
                        <td colSpan={5}>
                          <EmptyState icon="payments" message="No payment transactions found" />
                        </td>
                      </tr>
                    ) : (
                      data.records.map((p) => (
                        <tr key={p.paymentId}>
                          <td className="td-mono">{p.policyNumber || "—"}</td>
                          <td className="td-amount">{formatINR(p.amount)}</td>
                          <td className="td-mono">{p.transactionReference}</td>
                          <td className="td-muted">{formatDateTime(p.paymentDate)}</td>
                          <td>
                            <StatusBadge status={p.paymentStatus} />
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
        </Card>
      </div>
    </AppLayout>
  );
}

export default Payments;
