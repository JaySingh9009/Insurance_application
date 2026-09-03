import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { customerApi } from "../../api/customerApi";
import { planApi } from "../../api/planApi";
import { policyApi } from "../../api/policyApi";
import { claimApi } from "../../api/claimApi";
import AppLayout from "../../components/layout/AppLayout";
import BuyPolicyForm from "../../components/forms/BuyPolicyForm";
import SubmitClaimForm from "../../components/forms/SubmitClaimForm";
import StatusBadge from "../../components/common/StatusBadge";
import Pagination from "../../components/common/Pagination";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import { formatDate, formatINR } from "../../utils/formatters";
import "../../styles/shared.css";

function CustomerDashboard() {
  const [policies, setPolicies] = useState({ records: [], totalRecords: 0, totalPages: 0 });
  const [claims, setClaims] = useState({ records: [], totalRecords: 0, totalPages: 0 });
  const [profile, setProfile] = useState(null);
  const [plans, setPlans] = useState([]);
  const [policyPage, setPolicyPage] = useState(0);
  const [claimPage, setClaimPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showPurchase, setShowPurchase] = useState(false);
  const [showClaim, setShowClaim] = useState(false);

  const customerName = localStorage.getItem("name") || "Customer";
  const navigate = useNavigate();
  const initialLoadDone = useRef(false);

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (!initialLoadDone.current) return;
    fetchPolicies();
  }, [policyPage]);

  useEffect(() => {
    if (!initialLoadDone.current) return;
    fetchClaims();
  }, [claimPage]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [profileRes, plansRes] = await Promise.allSettled([
        customerApi.getMyProfile(),
        planApi.getActive(0, 100),
      ]);

      if (profileRes.status === "fulfilled") {
        setProfile(profileRes.value.data);
      }
      if (plansRes.status === "fulfilled") {
        setPlans(plansRes.value.data.records || []);
      }
    } finally {
      setLoading(false);
    }

    await Promise.allSettled([fetchPolicies(), fetchClaims()]);
    initialLoadDone.current = true;
  };

  const fetchPolicies = async () => {
    try {
      const res = await policyApi.getMyPolicies(policyPage, 5);
      setPolicies(res.data);
    } catch {
      /* ignore */
    }
  };

  const fetchClaims = async () => {
    try {
      const res = await claimApi.getMyClaims(claimPage, 5);
      setClaims(res.data);
    } catch {
      /* ignore */
    }
  };


  return (
    <AppLayout>
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="topbar-title">My Dashboard</h1>
            <span className="topbar-greeting">Welcome, {profile?.fullName || customerName} 👋</span>
          </div>
          <div className="topbar-actions">
            <Button
              variant="outlined"
              className={showClaim ? "active" : ""}
              icon="add_task"
              onClick={() => {
                setShowClaim(!showClaim);
                if (showPurchase) setShowPurchase(false);
              }}
            >
              {showClaim ? "Close Claim Form" : "File Claim"}
            </Button>
            <Button
              variant="primary"
              icon="shopping_cart"
              onClick={() => {
                setShowPurchase(!showPurchase);
                if (showClaim) setShowClaim(false);
              }}
            >
              {showPurchase ? "Close Form" : "Buy Policy"}
            </Button>
          </div>
        </header>

        <div className="page-container">
          <BuyPolicyForm
            isOpen={showPurchase}
            onClose={() => setShowPurchase(false)}
            plans={plans}
            onSuccess={fetchPolicies}
          />

          <SubmitClaimForm
            isOpen={showClaim}
            onClose={() => setShowClaim(false)}
            policies={policies.records}
            onSuccess={fetchClaims}
          />

          <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="stat-card" id="stat-policies" onClick={() => navigate("/customer/policies")} style={{ cursor: "pointer" }}>
              <span className="material-icons stat-icon" style={{ color: "#534AB7", background: "#ede9fe" }}>policy</span>
              <div>
                <p className="stat-label">My Policies</p>
                <p className="stat-value">{policies.totalRecords}</p>
              </div>
            </div>
            <div className="stat-card" id="stat-claims" onClick={() => navigate("/customer/claims")} style={{ cursor: "pointer" }}>
              <span className="material-icons stat-icon" style={{ color: "#b45309", background: "#fef3c7" }}>assignment</span>
              <div>
                <p className="stat-label">My Claims</p>
                <p className="stat-value">{claims.totalRecords}</p>
              </div>
            </div>
            <div className="stat-card" id="stat-profile" onClick={() => navigate("/customer/profile")} style={{ cursor: "pointer" }}>
              <span className="material-icons stat-icon" style={{ color: "#16a34a", background: "#dcfce7" }}>person</span>
              <div>
                <p className="stat-label">Profile</p>
                <p className="stat-value" style={{ fontSize: 16 }}>{profile?.fullName || customerName}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">My Policies</span>
              <span className="count-badge">{policies.totalRecords} total</span>
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
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {policies.records.length === 0 ? (
                        <tr>
                          <td colSpan={6}>
                            <EmptyState icon="policy" message="No policies yet — buy one!" />
                          </td>
                        </tr>
                      ) : (
                        policies.records.map((p) => (
                          <tr key={p.policyId}>
                            <td className="td-mono">{p.policyNumber}</td>
                            <td className="td-bold">{p.planName}</td>
                            <td className="td-muted">{formatDate(p.startDate)}</td>
                            <td className="td-muted">{formatDate(p.endDate)}</td>
                            <td className="td-muted">{(p.productType === "TRAVEL" || p.selectedPremiumType === "ONE_TIME" || p.planName?.toLowerCase().includes("travel") || p.productName?.toLowerCase().includes("travel")) ? "—" : formatDate(p.nextPaymentDueDate)}</td>
                            <td>
                              <StatusBadge status={p.status} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  page={policyPage}
                  totalPages={policies.totalPages}
                  totalRecords={policies.totalRecords}
                  pageSize={5}
                  onChange={setPolicyPage}
                />
              </>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">My Claims</span>
              <span className="count-badge">{claims.totalRecords} total</span>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Claim #</th>
                    <th>Policy #</th>
                    <th>Amount</th>
                    <th>Incident</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.records.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <EmptyState icon="assignment" message="No claims submitted" />
                      </td>
                    </tr>
                  ) : (
                    claims.records.map((c) => (
                      <tr key={c.claimId}>
                        <td className="td-mono">{c.claimNumber}</td>
                        <td className="td-mono">{c.policyNumber}</td>
                        <td className="td-amount">{formatINR(c.claimAmount)}</td>
                        <td className="td-muted">{formatDate(c.incidentDate)}</td>
                        <td>
                          <StatusBadge status={c.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              page={claimPage}
              totalPages={claims.totalPages}
              totalRecords={claims.totalRecords}
              pageSize={5}
              onChange={setClaimPage}
            />
          </div>
        </div>
    </AppLayout>
  );
}

export default CustomerDashboard;
