import { useState } from "react";
import { paymentApi } from "../../api/paymentApi";
import { formatINR } from "../../utils/formatters";
import Alert from "./Alert";
import "../../styles/shared.css";

export default function RazorpayCheckoutModal({ policy, isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [receiptData, setReceiptData] = useState(null);

  // Fallback Mock Razorpay Modal state (in case standard popup is blocked or for explicit test mode interaction)
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [activeTab, setActiveTab] = useState("UPI"); // UPI, CARD, NETBANKING
  const [upiId, setUpiId] = useState("success@razorpay");
  const [cardNumber, setCardNumber] = useState("4111 1111 1111 1111");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("123");
  const [bank, setBank] = useState("SBI");
  const [processing, setProcessing] = useState(false);

  if (!isOpen || !policy) return null;

  const payableAmount = policy.installmentAmount
    ? Number(policy.installmentAmount)
    : Number(policy.premiumAmount || 0);

  const handleInitiateRazorpay = async () => {
    setLoading(true);
    setError("");
    try {
      // Step 1: Create Razorpay Order from backend
      const res = await paymentApi.createOrder({
        policyId: policy.policyId,
        amount: payableAmount,
      });

      const order = res.data;
      setOrderDetails(order);

      // Check if official Razorpay SDK script is available on window
      if (typeof window.Razorpay === "function") {
        const options = {
          key: order.keyId || "rzp_test_THPAh3J7KnVXXJ",
          amount: Math.round((order.amount || payableAmount) * 100), // amount in paisa
          currency: order.currency || "INR",
           order_id: order.orderId,  
          name: "InsureCo Policy Portal",
          description: `Premium Payment — ${policy.policyNumber}`,
          prefill: {
            name: order.customerName || "Valued Customer",
            email: order.customerEmail || "customer@insurance.com",
            contact: "9876543210",
          },
          theme: {
            color: "#3395FF",
          },
          handler: async function (response) {
            await verifyPayment({
              policyId: policy.policyId,
              razorpayPaymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpayOrderId: response.razorpay_order_id || order.orderId,
              razorpaySignature: response.razorpay_signature || "test_signature",
              amount: order.amount,
              paymentMethod: "RAZORPAY",
            });
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (response) {
          setError(response.error?.description || "Payment failed on Razorpay Gateway.");
          setLoading(false);
        });
        rzp.open();
        setLoading(false);
      } else {
        // Fallback interactive Razorpay Modal UI inside React app
        setShowFallbackModal(true);
        setLoading(false);
      }
    } catch (e) {
      setError(e.response?.data?.message || "Failed to create Razorpay payment order.");
      setLoading(false);
    }
  };

  const verifyPayment = async (payload) => {
    setProcessing(true);
    setError("");
    try {
      const res = await paymentApi.verifyPayment(payload);
      setReceiptData(res.data);
      setShowFallbackModal(false);
      if (onSuccess) onSuccess();
    } catch (e) {
      setError(e.response?.data?.message || "Razorpay Payment verification failed.");
    } finally {
      setProcessing(false);
      setLoading(false);
    }
  };


  const handleFallbackSubmit = async () => {
    const paymentId = `pay_RZP_${Math.floor(100000000 + Math.random() * 900000000)}`;
    await verifyPayment({
      policyId: policy.policyId,
      razorpayPaymentId: paymentId,
      razorpayOrderId: orderDetails?.orderId || `order_RZP_${Date.now()}`,
      razorpaySignature: "simulated_razorpay_sig",
      amount: payableAmount,
      paymentMethod: "RAZORPAY",
    });
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
      }}
    >
      {/* Receipt Modal State */}
      {receiptData ? (
        <div
          className="modal card"
          style={{
            maxWidth: 520,
            width: "100%",
            background: "#ffffff",
            color: "#0f172a",
            borderRadius: 16,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #16a34a, #15803d)",
              color: "#fff",
              padding: "24px 20px",
              textAlign: "center",
            }}
          >
            <span className="material-icons" style={{ fontSize: 48, marginBottom: 6 }}>
              check_circle
            </span>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Payment Successful!</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.9 }}>
              Official Razorpay Payment Receipt
            </p>
          </div>

          <div style={{ padding: "20px 24px" }}>
            <div
              style={{
                background: "#f8fafc",
                borderRadius: 12,
                padding: "16px",
                border: "1px solid #e2e8f0",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                fontSize: 13,
                marginBottom: 20,
              }}
            >
              <div>
                <span style={{ color: "#64748b", fontSize: 11, display: "block", fontWeight: 700 }}>
                  TRANSACTION ID
                </span>
                <strong style={{ color: "#0f172a", fontSize: 12 }} className="td-mono">
                  {receiptData.transactionReference}
                </strong>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: 11, display: "block", fontWeight: 700 }}>
                  POLICY NUMBER
                </span>
                <strong style={{ color: "#0f172a", fontSize: 12 }} className="td-mono">
                  {policy.policyNumber}
                </strong>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: 11, display: "block", fontWeight: 700 }}>
                  AMOUNT PAID
                </span>
                <strong style={{ color: "#16a34a", fontSize: 16, fontWeight: 800 }}>
                  {formatINR(receiptData.amount)}
                </strong>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: 11, display: "block", fontWeight: 700 }}>
                  POLICY STATUS
                </span>
                <span
                  style={{
                    display: "inline-block",
                    background: "#dcfce7",
                    color: "#15803d",
                    fontWeight: 700,
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 6,
                  }}
                >
                  ACTIVE
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn-ghost" onClick={handlePrintReceipt}>
                <span className="material-icons" style={{ fontSize: 16 }}>
                  print
                </span>{" "}
                Print Receipt
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setReceiptData(null);
                  onClose();
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : showFallbackModal ? (
        /* Fallback Razorpay Modal Checkout inside React */
        <div
          className="modal card"
          style={{
            maxWidth: 480,
            width: "100%",
            background: "#0c2340",
            color: "#ffffff",
            borderRadius: 14,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "#07172b",
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  background: "#3395FF",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 14,
                  padding: "4px 8px",
                  borderRadius: 6,
                  letterSpacing: 0.5,
                }}
              >
                RAZORPAY
              </div>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Test Mode</span>
            </div>
            <button
              onClick={() => setShowFallbackModal(false)}
              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
            >
              <span className="material-icons">close</span>
            </button>
          </div>

          {/* Amount Callout */}
          <div style={{ background: "rgba(51, 149, 255, 0.1)", padding: "14px 20px" }}>
            <div style={{ fontSize: 11, color: "#93c5fd", fontWeight: 700 }}>PAYING TO INSURECO</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#ffffff" }}>
              {formatINR(payableAmount)}
            </div>
            <div style={{ fontSize: 11, color: "#cbd5e1" }}>
              Policy: {policy.policyNumber} ({policy.planName})
            </div>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              background: "#091c33",
            }}
          >
            {["UPI", "CARD", "NETBANKING"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: "12px 8px",
                  border: "none",
                  borderBottom: activeTab === tab ? "2px solid #3395FF" : "none",
                  background: activeTab === tab ? "rgba(51, 149, 255, 0.15)" : "transparent",
                  color: activeTab === tab ? "#3395FF" : "#94a3b8",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ padding: "18px 20px" }}>
            <Alert type="error" message={error} style={{ marginBottom: 12 }} />

            {activeTab === "UPI" && (
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#cbd5e1", marginBottom: 6 }}>
                  Enter Test UPI ID (GPay / PhonePe / Paytm)
                </label>
                <input
                  className="form-input"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  style={{
                    background: "#07172b",
                    border: "1px solid #1e3a8a",
                    color: "#fff",
                    marginBottom: 10,
                  }}
                />
                <span style={{ fontSize: 11, color: "#10b981", display: "block" }}>
                  ✓ Use `success@razorpay` to simulate successful payment.
                </span>
              </div>
            )}

            {activeTab === "CARD" && (
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#cbd5e1", marginBottom: 4 }}>
                  Test Card Number
                </label>
                <input
                  className="form-input"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  style={{
                    background: "#07172b",
                    border: "1px solid #1e3a8a",
                    color: "#fff",
                    marginBottom: 10,
                  }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: "#cbd5e1", marginBottom: 2 }}>
                      Expiry
                    </label>
                    <input
                      className="form-input"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      style={{ background: "#07172b", border: "1px solid #1e3a8a", color: "#fff" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: "#cbd5e1", marginBottom: 2 }}>
                      CVV
                    </label>
                    <input
                      className="form-input"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      style={{ background: "#07172b", border: "1px solid #1e3a8a", color: "#fff" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "NETBANKING" && (
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#cbd5e1", marginBottom: 6 }}>
                  Select Bank
                </label>
                <select
                  className="form-select"
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  style={{
                    background: "#07172b",
                    border: "1px solid #1e3a8a",
                    color: "#fff",
                  }}
                >
                  <option value="SBI">State Bank of India (SBI)</option>
                  <option value="HDFC">HDFC Bank</option>
                  <option value="ICICI">ICICI Bank</option>
                  <option value="AXIS">Axis Bank</option>
                </select>
              </div>
            )}

            <button
              onClick={handleFallbackSubmit}
              disabled={processing}
              style={{
                width: "100%",
                padding: "12px",
                background: "#3395FF",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: 14,
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                marginTop: 18,
                transition: "opacity 0.2s",
              }}
            >
              {processing ? "Authorizing with Bank…" : `PAY ${formatINR(payableAmount)}`}
            </button>
          </div>
        </div>
      ) : (
        /* Initial Action Card triggering Razorpay Order */
        <div
          className="modal card"
          style={{
            maxWidth: 460,
            width: "100%",
            background: "#ffffff",
            color: "#0f172a",
            borderRadius: 16,
            padding: 24,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 14,
              background: "rgba(51, 149, 255, 0.12)",
              color: "#3395FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            <span className="material-icons" style={{ fontSize: 32 }}>
              payment
            </span>
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>
            Pay via Razorpay Gateway
          </h3>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
            Policy #{policy.policyNumber} — {policy.planName}
          </p>

          <Alert type="error" message={error} style={{ marginBottom: 14 }} />

          <div
            style={{
              background: "#f8fafc",
              borderRadius: 10,
              padding: "12px 16px",
              border: "1px solid #e2e8f0",
              marginBottom: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 13, color: "#64748b" }}>Amount Payable:</span>
            <strong style={{ fontSize: 18, color: "#3395FF", fontWeight: 800 }}>
              {formatINR(payableAmount)}
            </strong>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="btn-ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleInitiateRazorpay}
              disabled={loading}
              style={{ background: "#3395FF" }}
            >
              {loading ? "Opening Razorpay…" : "Proceed to Pay"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
