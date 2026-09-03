import { useEffect, useState } from "react";
import { paymentApi } from "../../api/paymentApi";
import { policyApi } from "../../api/policyApi";
import AppLayout from "../../components/layout/AppLayout";
import StatusBadge from "../../components/common/StatusBadge";
import Pagination from "../../components/common/Pagination";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import RazorpayCheckoutModal from "../../components/common/RazorpayCheckoutModal";
import { formatDateTime, formatINR } from "../../utils/formatters";
import "../../styles/shared.css";

function MyPayments() {
  const [data, setData] = useState({ records: [], totalRecords: 0, totalPages: 0 });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPay, setShowPay] = useState(false);
  const [policies, setPolicies] = useState([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState("");
  const [razorpayPolicy, setRazorpayPolicy] = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await paymentApi.getMyPayments(page, 10, "paymentDate", "desc");
      setData(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const fetchPolicies = async () => {
    try {
      const res = await policyApi.getMyPolicies(0, 100);
      setPolicies(
        (res.data.records || []).filter((p) =>
          ["ACTIVE", "PENDING_PAYMENT", "LAPSED", "INACTIVE", "GRACE_PERIOD"].includes(p.status)
        )
      );
    } catch {
      /* ignore */
    }
  };


  useEffect(() => {
    fetchPayments();
    fetchPolicies();
  }, [page]);

  const selectedPolicy = policies.find((p) => p.policyId === Number(selectedPolicyId));

  const handleLaunchRazorpay = () => {
    if (!selectedPolicy) return;
    setRazorpayPolicy(selectedPolicy);
  };

  return (
    <AppLayout>
      <header className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Payment History</h1>
          <p className="topbar-greeting">All premium transactions & receipts</p>
        </div>
        <div className="topbar-actions">
          <Button variant="primary" icon="payments" onClick={() => setShowPay(!showPay)}>
            {showPay ? "Close Form" : "Make a Payment"}
          </Button>
        </div>
      </header>

      <div className="page-container">
        {/* Razorpay Checkout Modal for selected policy */}
        {razorpayPolicy && (
          <RazorpayCheckoutModal
            policy={razorpayPolicy}
            isOpen={Boolean(razorpayPolicy)}
            onClose={() => setRazorpayPolicy(null)}
            onSuccess={() => {
              setRazorpayPolicy(null);
              setShowPay(false);
              setSelectedPolicyId("");
              fetchPayments();
              fetchPolicies();
            }}
          />
        )}

        {/* Inline Make Payment Selection Form */}
        {showPay && (
          <div className="card" style={{ maxWidth: 600, margin: "0 auto 24px", border: "1.5px solid #3395FF" }}>
            <div className="card-header" style={{ padding: "16px 20px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="material-icons" style={{ color: "#3395FF" }}>payment</span>
                <span className="card-title" style={{ fontSize: 16, fontWeight: 700 }}>Make a Premium Payment</span>
              </div>
              <Button variant="ghost" icon="close" iconStyle={{ fontSize: 20 }} onClick={() => setShowPay(false)} style={{ padding: 4 }} />
            </div>

            <div className="card-body" style={{ padding: "16px 20px 20px" }}>
              <div className="form-group full" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ fontWeight: 700, color: "#818cf8" }}>SELECT POLICY TO PAY PREMIUM FOR *</label>
                <select
                  className="form-select"
                  value={selectedPolicyId}
                  onChange={(e) => setSelectedPolicyId(e.target.value)}
                  style={{ padding: "10px 12px", fontSize: 13 }}
                >
                  <option value="">Select policy from list…</option>
                  {policies.map((p) => {
                    const inst = p.installmentAmount || p.premiumAmount;
                    return (
                      <option key={p.policyId} value={p.policyId}>
                        {p.policyNumber} — {p.planName} ({p.status} | Premium: ₹{inst ? Number(inst).toLocaleString("en-IN") : "—"})
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedPolicy && (
                <div className="policy-summary-box" style={{ marginBottom: 18 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
                    <div>
                      <span className="info-label" style={{ fontSize: 11, display: "block" }}>POLICY NUMBER</span>
                      <strong className="info-value td-mono">{selectedPolicy.policyNumber}</strong>
                    </div>
                    <div>
                      <span className="info-label" style={{ fontSize: 11, display: "block" }}>INSTALLMENT PAYABLE</span>
                      <strong style={{ color: "#2563eb", fontSize: 16, fontWeight: 800 }}>
                        {formatINR(selectedPolicy.installmentAmount || selectedPolicy.premiumAmount)}
                      </strong>
                    </div>
                    <div>
                      <span className="info-label" style={{ fontSize: 11, display: "block" }}>PLAN NAME</span>
                      <span className="info-value">{selectedPolicy.planName}</span>
                    </div>
                    <div>
                      <span className="info-label" style={{ fontSize: 11, display: "block" }}>PAYMENT FREQUENCY</span>
                      <span className="info-value">{selectedPolicy.selectedPremiumType || selectedPolicy.premiumType || "ANNUAL"}</span>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 14 }}>
                <Button variant="ghost" onClick={() => setShowPay(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  icon="verified"
                  iconStyle={{ fontSize: 18 }}
                  onClick={handleLaunchRazorpay}
                  disabled={!selectedPolicy}
                  style={{ background: "#3395FF" }}
                >
                  Proceed to Pay via Razorpay
                </Button>
              </div>
            </div>
          </div>
        )}

          <div className="card">
            <div className="card-header">
              <span className="card-title">My Transactions</span>
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
                        <th>Policy #</th>
                        <th>Amount</th>
                        <th>Reference</th>
                        <th>Date & Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.records.length === 0 ? (
                        <tr>
                          <td colSpan={5}>
                            <EmptyState icon="payments" message="No payment records found" />
                          </td>
                        </tr>
                      ) : (
                        data.records.map((p) => (
                          <tr key={p.paymentId}>
                            <td className="td-mono">{p.policyNumber}</td>
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
          </div>
        </div>
    </AppLayout>
  );
}

export default MyPayments;
