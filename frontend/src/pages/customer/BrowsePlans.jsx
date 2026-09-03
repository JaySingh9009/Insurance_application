import { useEffect, useState } from "react";
import { planApi } from "../../api/planApi";
import { policyApi } from "../../api/policyApi";
import AppLayout from "../../components/layout/AppLayout";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import { formatINR, getTodayDate } from "../../utils/formatters";
import "../../styles/shared.css";

function BrowsePlans() {
  const [data, setData] = useState({ records: [], totalRecords: 0, totalPages: 0 });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [selectedPremiumType, setSelectedPremiumType] = useState("MONTHLY");
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  // TRAVEL-specific date state
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  // MOTOR-specific state
  const [motorRegNo, setMotorRegNo] = useState("");
  const [motorMakeModel, setMotorMakeModel] = useState("");
  const [motorYear, setMotorYear] = useState("");
  const [motorError, setMotorError] = useState("");
  // HEALTH-specific state
  const [selectedDiseases, setSelectedDiseases] = useState([]);
  // LIFE-specific state
  const [lifeNomineeName, setLifeNomineeName] = useState("");
  const [lifeNomineeRelation, setLifeNomineeRelation] = useState("");

  useEffect(() => {
    fetchPlans();
  }, [page]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await planApi.getActive(page, 9);
      setData(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };


  // Product type detection for purchasing plan modal
  const rawProductType = purchasing?.productType?.toUpperCase();
  const isTravel =
    rawProductType === "TRAVEL" ||
    purchasing?.productName?.toLowerCase().includes("travel") ||
    purchasing?.planName?.toLowerCase().includes("travel");
  const isMotor =
    rawProductType === "MOTOR" ||
    purchasing?.productName?.toLowerCase().includes("motor") ||
    purchasing?.planName?.toLowerCase().includes("motor");
  const isHealth =
    rawProductType === "HEALTH" ||
    purchasing?.productName?.toLowerCase().includes("health") ||
    purchasing?.planName?.toLowerCase().includes("health");
  const isLife =
    rawProductType === "LIFE" ||
    purchasing?.productName?.toLowerCase().includes("life") ||
    purchasing?.planName?.toLowerCase().includes("life");

  // PED loading factor — only for HEALTH
  const computePedFactor = (diseases) => {
    const loadings = { DIABETES: 0.15, HYPERTENSION: 0.10, ASTHMA_COPD: 0.10, THYROID: 0.05, HEART_DISEASE: 0.30, KIDNEY_LIVER: 0.25, OTHER: 0.05 };
    return 1.0 + (diseases || []).reduce((sum, d) => sum + (loadings[d] || 0), 0);
  };

  const calculateInstallment = (basePremium, type, durationYears = 1, diseases = []) => {
    if (!basePremium) return 0;
    const dur = Number(durationYears) || 1;
    const pedFactor = isHealth ? computePedFactor(diseases) : 1.0;
    const base = Number(basePremium) * pedFactor;
    if (type === "MONTHLY") return Math.round(base / 12);
    if (type === "QUARTERLY") return Math.round((base * 0.985) / 4);
    if (type === "SEMI_ANNUAL") return Math.round((base * 0.97) / 2);
    if (type === "ANNUAL") return Math.round(base * 0.95);
    if (type === "ONE_TIME") return Math.round(base * dur * 0.9);
    return Math.round(base);
  };




  // IRDA depreciation IDV auto-calculation
  const calculateIDV = (planCoverage, year) => {
    if (!year || !planCoverage) return 0;
    const age = new Date().getFullYear() - Number(year);
    const factors = [0.95, 0.85, 0.80, 0.70, 0.60, 0.50, 0.40];
    const factor = factors[Math.min(Math.max(age, 0), 6)];
    return Math.round(planCoverage * factor);
  };

  const motorVehicleAge = motorYear ? new Date().getFullYear() - Number(motorYear) : null;
  const motorIDV = purchasing ? calculateIDV(purchasing.coverageAmount, motorYear) : 0;
  const motorYearError =
    motorYear && (motorVehicleAge > 15
      ? `Vehicle is ${motorVehicleAge} years old — older than 15 years (not insurable).`
      : motorVehicleAge < 0
      ? "Invalid manufacturing year."
      : "");

  const cleanedMotorRegNo = motorRegNo.replace(/[\s-]/g, "").toUpperCase();
  const isMotorRegNoValid = /^[A-Z]{2}[0-9]{2}[A-Z]{1,3}[0-9]{4}$/.test(cleanedMotorRegNo);
  const motorRegNoError = motorRegNo.trim() && !isMotorRegNoValid
    ? "Invalid registration format (e.g. MH12AB1234)"
    : "";

  const handlePurchase = async () => {
    setPurchaseLoading(true);
    setPurchaseError("");

    // MOTOR client-side validation
    if (isMotor) {
      setMotorError("");
      if (!motorRegNo.trim() || !motorMakeModel.trim() || !motorYear) {
        setPurchaseError("Please fill all vehicle details.");
        setPurchaseLoading(false);
        return;
      }
      if (!isMotorRegNoValid) {
        setPurchaseError("Invalid vehicle registration number format (e.g. MH12AB1234).");
        setPurchaseLoading(false);
        return;
      }
      const age = new Date().getFullYear() - Number(motorYear);
      if (age > 15) {
        setPurchaseError(`Vehicle manufactured in ${motorYear} is ${age} years old. Vehicles older than 15 years are not insurable.`);
        setPurchaseLoading(false);
        return;
      }
      if (age < 0) {
        setPurchaseError("Invalid manufacturing year.");
        setPurchaseLoading(false);
        return;
      }
    }

    // TRAVEL client-side validation
    if (isTravel) {
      if (!departureDate || !returnDate) {
        setPurchaseError("Please select both departure and return dates.");
        setPurchaseLoading(false);
        return;
      }
      const dep = new Date(departureDate);
      const ret = new Date(returnDate);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (dep < today) {
        setPurchaseError("Departure date cannot be in the past.");
        setPurchaseLoading(false);
        return;
      }
      if (ret <= dep) {
        setPurchaseError("Return date must be after departure date.");
        setPurchaseLoading(false);
        return;
      }
      const tripDays = Math.round((ret - dep) / (1000 * 60 * 60 * 24));
      const planDur = purchasing.duration;
      if (tripDays > planDur) {
        setPurchaseError(
          `Trip duration (${tripDays} days) exceeds the plan maximum of ${planDur} days.`
        );
        setPurchaseLoading(false);
        return;
      }
    }

    try {
      const payload = { planId: purchasing.planId };
      if (isTravel) {
        payload.startDate = departureDate;
        payload.endDate   = returnDate;
        payload.selectedPremiumType = "ONE_TIME";
      } else if (isMotor) {
        payload.selectedPremiumType = selectedPremiumType;
        payload.vehicleRegistrationNo = motorRegNo.trim().toUpperCase();
        payload.vehicleMakeModel = motorMakeModel.trim();
        payload.vehicleYear = Number(motorYear);
      } else if (isHealth) {
        payload.selectedPremiumType = selectedPremiumType;
        // Include diseases only if any selected
        if (selectedDiseases.length > 0) payload.preExistingDiseases = selectedDiseases;
      } else if (isLife) {
        if (lifeNomineeName && /\d/.test(lifeNomineeName)) {
          setPurchaseError("Nominee name cannot contain numbers.");
          setPurchaseLoading(false);
          return;
        }
        payload.selectedPremiumType = selectedPremiumType;
        if (lifeNomineeName.trim()) payload.nomineeName = lifeNomineeName.trim();
        if (lifeNomineeRelation.trim()) payload.nomineeRelation = lifeNomineeRelation.trim();
      } else {
        payload.selectedPremiumType = selectedPremiumType;
      }




      await policyApi.purchase(payload);
      setPurchaseSuccess(true);

    } catch (e) {
      setPurchaseError(e.response?.data?.message || "Purchase failed.");
    } finally {
      setPurchaseLoading(false);
    }
  };

  const openPurchaseModal = (plan) => {
    setPurchasing(plan);
    const allowed = plan.allowedPremiumTypes?.length
      ? Array.from(plan.allowedPremiumTypes)
      : [plan.premiumType || "ANNUAL"];
    setSelectedPremiumType(allowed[0]);
    setPurchaseError("");
    setPurchaseSuccess(false);
    setDepartureDate("");
    setReturnDate("");
    // reset motor state
    setMotorRegNo("");
    setMotorMakeModel("");
    setMotorYear("");
    setMotorError("");
    // reset health state
    setSelectedDiseases([]);
    // reset life state
    setLifeNomineeName("");
    setLifeNomineeRelation("");
  };



  const typeColors = { HEALTH: "#16a34a", MOTOR: "#2563eb", LIFE: "#dc2626", TRAVEL: "#7c3aed" };
  const typeIcons = { HEALTH: "local_hospital", MOTOR: "directions_car", LIFE: "favorite", TRAVEL: "flight" };

  return (
    <AppLayout>
      <header className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Browse Plans</h1>
          <p className="topbar-greeting">Explore active insurance plans and purchase</p>
        </div>
      </header>
      <div className="page-container">
        {loading ? (
          <Loader />
        ) : data.records.length === 0 ? (
          <EmptyState icon="explore" message="No active plans available" />
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {data.records.map((plan) => {
                const isTravelPlan =
                  plan.productType === "TRAVEL" ||
                  plan.productName?.toLowerCase().includes("travel") ||
                  plan.planName?.toLowerCase().includes("travel");
                const allowedTypes = isTravelPlan
                  ? ["ONE_TIME"]
                  : ["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL", "ONE_TIME"];
                return (
                  <div
                    key={plan.planId}
                    className="card"
                    style={{ padding: 0, transition: "transform 0.2s, box-shadow 0.2s" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-3px)";
                      e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "";
                      e.currentTarget.style.boxShadow = "";
                    }}
                  >
                    {/* Plan header */}
                    <div
                      style={{
                        background: `linear-gradient(135deg, ${typeColors[plan.productType] || "#534AB7"}22, ${typeColors[plan.productType] || "#534AB7"
                          }11)`,
                        padding: "18px 20px 14px",
                        borderBottom: "0.5px solid #f3f4f6",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: `${typeColors[plan.productType] || "#534AB7"}22`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            className="material-icons"
                            style={{ fontSize: 20, color: typeColors[plan.productType] || "#534AB7" }}
                          >
                            {typeIcons[plan.productType] || "category"}
                          </span>
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{plan.planName}</div>
                          <div style={{ fontSize: 11, color: "#9ca3af" }}>{plan.productName}</div>
                        </div>
                      </div>
                    </div>

                    {/* Plan body */}
                    <div style={{ padding: "14px 20px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <div
                            style={{
                              fontSize: 10,
                              color: "#9ca3af",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: 0.4,
                              marginBottom: 3,
                            }}
                          >
                            Coverage
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>
                            {formatINR(plan.coverageAmount)}
                          </div>
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 10,
                              color: "#9ca3af",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: 0.4,
                              marginBottom: 3,
                            }}
                          >
                            Base Premium
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "#534AB7" }}>
                            {formatINR(plan.premiumAmount)}
                          </div>
                          <div style={{ fontSize: 11, color: "#9ca3af" }}>per {plan.premiumType?.toLowerCase()}</div>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
                          Available Frequencies
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {allowedTypes.map((t) => {
                            const disc =
                              t === "QUARTERLY"
                                ? " (1.5% OFF)"
                                : t === "SEMI_ANNUAL"
                                ? " (3% OFF)"
                                : t === "ANNUAL"
                                ? " (5% OFF)"
                                : t === "ONE_TIME" && !isTravelPlan
                                ? " (10% OFF)"
                                : "";
                            return (
                              <span key={t} className="badge badge-active" style={{ fontSize: 10 }}>
                                {t.replace("_", " ")}{disc}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <Button
                        variant="primary"
                        style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
                        onClick={() => openPurchaseModal(plan)}
                      >
                        Buy This Plan
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
              <button className="btn-ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                ← Prev
              </button>
              <span style={{ padding: "8px 12px", fontSize: 13, color: "#6b7280" }}>
                Page {page + 1} of {data.totalPages || 1}
              </span>
              <button className="btn-ghost" disabled={page >= data.totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                Next →
              </button>
            </div>
          </>
        )}

        {/* Purchase modal with Premium Type selection */}
        {purchasing && (
          <div
            className="modal-overlay"
            onClick={(e) => e.target === e.currentTarget && !purchaseSuccess && setPurchasing(null)}
          >
            <div className="modal" style={{ maxWidth: 540 }}>
              <div className="modal-header">
                <span className="modal-title">Purchase — {purchasing.planName}</span>
                <button className="modal-close" onClick={() => setPurchasing(null)}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              <div className="modal-body">
                {purchaseSuccess ? (
                  <Alert type="success" message="Policy purchased successfully! Check My Policies." />
                ) : (
                  <>
                    <Alert type="error" message={purchaseError} style={{ marginBottom: 14 }} />

                    {/* POLICY DURATION / TRIP DAYS */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                      <div className="policy-summary-box" style={{ padding: 12 }}>
                        <div className="info-label" style={{ fontSize: 11 }}>COVERAGE SUM ASSURED</div>
                        <div className="info-value td-bold" style={{ fontSize: 16 }}>{formatINR(purchasing.coverageAmount)}</div>
                      </div>
                      <div className="policy-summary-box" style={{ padding: 12 }}>
                        <div className="info-label" style={{ fontSize: 11 }}>
                          {isTravel ? "MAX TRIP DAYS" : "POLICY DURATION"}
                        </div>
                        <div className="info-value" style={{ fontSize: 16 }}>
                          {isTravel
                            ? `Up to ${purchasing.duration} days`
                            : `${purchasing.duration} Years`}
                        </div>
                      </div>
                    </div>

                    {isTravel ? (
                      <div style={{ marginBottom: 16 }}>
                        {/* ── TRAVEL: Departure + Return date pickers ── */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                          <span className="material-icons" style={{ fontSize: 18, color: "#7c3aed" }}>flight_takeoff</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#818cf8" }}>SELECT TRIP DATES</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div>
                            <label className="form-label" style={{ marginBottom: 6 }}>
                              Departure Date *
                            </label>
                            <input
                              type="date"
                              min={getTodayDate()}
                              value={departureDate}
                              onChange={(e) => setDepartureDate(e.target.value)}
                              className="form-input"
                            />
                          </div>
                          <div>
                            <label className="form-label" style={{ marginBottom: 6 }}>
                              Return Date *
                            </label>
                            <input
                              type="date"
                              min={departureDate || getTodayDate()}
                              value={returnDate}
                              onChange={(e) => setReturnDate(e.target.value)}
                              className="form-input"
                            />
                          </div>
                        </div>
                        {/* Live trip-day counter */}
                        {departureDate && returnDate && (() => {
                          const planDur = purchasing.duration;
                          const days = Math.round((new Date(returnDate) - new Date(departureDate)) / (1000 * 60 * 60 * 24));
                          const ok = days > 0 && days <= planDur;
                          return (
                            <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: ok ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${ok ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                              <span className="material-icons" style={{ fontSize: 14, color: ok ? "#10b981" : "#ef4444" }}>
                                {ok ? "check_circle" : "error"}
                              </span>
                              <span style={{ color: ok ? "#6ee7b7" : "#fca5a5" }}>
                                {days > 0
                                  ? `Trip: ${days} day${days !== 1 ? "s" : ""} ${ok ? `(within ${planDur}-day limit ✓)` : `— exceeds ${planDur}-day maximum!`}`
                                  : "Return date must be after departure date."}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    ) : isMotor ? (
                      <div style={{ marginBottom: 16 }}>
                        {/* ── MOTOR: Vehicle Details Form ── */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                          <span className="material-icons" style={{ fontSize: 18, color: "#2563eb" }}>directions_car</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#60a5fa" }}>VEHICLE DETAILS</span>
                        </div>
                        {/* Reg No + Make/Model */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                          <div>
                            <label className="form-label" style={{ marginBottom: 6 }}>Registration No. *</label>
                            <input type="text" placeholder="e.g. MH12AB1234" value={motorRegNo} onChange={(e) => setMotorRegNo(e.target.value.toUpperCase())} maxLength={15}
                              className="form-input" style={motorRegNoError ? { borderColor: "#ef4444" } : {}} />
                            {motorRegNo.trim() && (
                              <div style={{ marginTop: 4, fontSize: 11, display: "flex", alignItems: "center", gap: 4, color: motorRegNoError ? "#ef4444" : "#10b981" }}>
                                <span className="material-icons" style={{ fontSize: 12 }}>{motorRegNoError ? "error" : "check_circle"}</span>
                                {motorRegNoError || "Valid format ✓"}
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="form-label" style={{ marginBottom: 6 }}>Make &amp; Model *</label>
                            <input type="text" placeholder="e.g. Maruti Swift" value={motorMakeModel} onChange={(e) => setMotorMakeModel(e.target.value)} maxLength={60}
                              className="form-input" />
                          </div>
                        </div>
                        {/* Manufacturing Year */}
                        <div style={{ marginBottom: 12 }}>
                          <label className="form-label" style={{ marginBottom: 6 }}>Manufacturing Year *</label>
                          <input type="number" placeholder={`e.g. ${new Date().getFullYear() - 3}`} value={motorYear}
                            min={new Date().getFullYear() - 15} max={new Date().getFullYear()} step="1"
                            onKeyDown={(e) => {
                              if (e.key === "." || e.key === "," || e.key === "e" || e.key === "-" || e.key === "+") e.preventDefault();
                            }}
                            onChange={(e) => setMotorYear(e.target.value.replace(/[^\d]/g, ""))}
                            className="form-input" style={motorYearError ? { borderColor: "#ef4444" } : {}} />
                          {motorYear && (
                            <div style={{ marginTop: 6, padding: "6px 10px", borderRadius: 6, fontSize: 12, display: "flex", alignItems: "center", gap: 5,
                              background: motorYearError ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
                              border: `1px solid ${motorYearError ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}` }}>
                              <span className="material-icons" style={{ fontSize: 13, color: motorYearError ? "#ef4444" : "#10b981" }}>{motorYearError ? "error" : "check_circle"}</span>
                              <span style={{ color: motorYearError ? "#fca5a5" : "#10b981" }}>
                                {motorYearError || `Vehicle age: ${motorVehicleAge} year${motorVehicleAge !== 1 ? "s" : ""} ✓ — Eligible`}
                              </span>
                            </div>
                          )}
                        </div>
                        {/* Auto-calculated IDV Preview */}
                        {motorYear && !motorYearError && (
                          <div style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.25)", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                              <span className="material-icons" style={{ fontSize: 16, color: "#2563eb" }}>calculate</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: 0.5 }}>IDV — IRDA Depreciation</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: 12, color: "#64748b" }}>
                                Age: {motorVehicleAge} yr(s) · Dep: {motorVehicleAge < 1 ? 5 : motorVehicleAge < 2 ? 15 : motorVehicleAge < 3 ? 20 : motorVehicleAge < 4 ? 30 : motorVehicleAge < 5 ? 40 : motorVehicleAge < 6 ? 50 : 60}%
                              </span>
                              <span style={{ fontSize: 18, fontWeight: 800, color: "#2563eb" }}>{formatINR(motorIDV)}</span>
                            </div>
                            <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>Max claim amount (Insured Declared Value)</div>
                          </div>
                        )}
                        {/* Premium Frequency for Motor */}
                        <div>
                          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#534AB7", marginBottom: 8 }}>SELECT PAYMENT FREQUENCY *</label>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
                            {["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL", "ONE_TIME"].map((type) => {
                              const inst = calculateInstallment(purchasing.premiumAmount, type, purchasing.duration);
                              const isSel = selectedPremiumType === type;
                              return (
                                <div key={type} onClick={() => setSelectedPremiumType(type)}
                                  className={`freq-card ${isSel ? "selected" : ""}`}
                                  style={{ padding: "10px 12px", cursor: "pointer" }}>
                                  <div className="freq-card-header">
                                    <span className="freq-card-title">{type.replace("_", " ")}</span>
                                    <input type="radio" name="motorPremiumType" checked={isSel} onChange={() => setSelectedPremiumType(type)} readOnly />
                                  </div>
                                  <div className="freq-card-amount">
                                    {formatINR(inst)}<span className="freq-card-period">/{type === "MONTHLY" ? "mo" : type === "QUARTERLY" ? "qtr" : type === "SEMI_ANNUAL" ? "half-yr" : type === "ONE_TIME" ? "full term" : "yr"}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* ── Non-TRAVEL, Non-MOTOR: Premium Frequency Selector ── */}
                        {/* HEALTH: Pre-Existing Disease Selector */}
                        {isHealth && (
                          <div style={{ marginBottom: 16 }}>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#16a34a", marginBottom: 4 }}>
                              PRE-EXISTING DISEASES (Optional)
                            </label>
                            <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 10 }}>
                              Select any conditions you have. A risk loading will be added to your premium.
                            </p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                              {[
                                { key: "DIABETES",     label: "Diabetes",       pct: "+15%" },
                                { key: "HYPERTENSION", label: "Hypertension",   pct: "+10%" },
                                { key: "ASTHMA_COPD",  label: "Asthma/COPD",   pct: "+10%" },
                                { key: "THYROID",      label: "Thyroid",        pct: "+5%"  },
                                { key: "HEART_DISEASE",label: "Heart Disease",  pct: "+30%" },
                                { key: "KIDNEY_LIVER", label: "Kidney/Liver",   pct: "+25%" },
                                { key: "OTHER",        label: "Other",          pct: "+5%"  },
                              ].map(({ key, label, pct }) => {
                                const sel = selectedDiseases.includes(key);
                                return (
                                  <button key={key} type="button"
                                    onClick={() => setSelectedDiseases((prev) =>
                                      sel ? prev.filter((d) => d !== key) : [...prev, key]
                                    )}
                                    style={{
                                      padding: "5px 11px", borderRadius: 20, cursor: "pointer",
                                      border: sel ? "2px solid #16a34a" : "1px solid rgba(255,255,255,0.15)",
                                      background: sel ? "rgba(22,163,74,0.15)" : "rgba(255,255,255,0.03)",
                                      color: sel ? "#4ade80" : "#94a3b8",
                                      fontSize: 12, fontWeight: sel ? 700 : 400,
                                      display: "flex", alignItems: "center", gap: 5, transition: "all 0.2s",
                                    }}
                                  >
                                    {sel && <span className="material-icons" style={{ fontSize: 12 }}>check_circle</span>}
                                    {label}
                                    <span style={{
                                      background: sel ? "#16a34a" : "rgba(148,163,184,0.2)",
                                      color: sel ? "#fff" : "#94a3b8",
                                      fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 10,
                                    }}>{pct}</span>
                                  </button>
                                );
                              })}
                            </div>
                            {selectedDiseases.length > 0 && (
                              <div style={{ marginTop: 8, padding: "6px 10px", borderRadius: 6, background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", fontSize: 12, color: "#4ade80" }}>
                                <span className="material-icons" style={{ fontSize: 12, verticalAlign: "middle", marginRight: 4 }}>info</span>
                                Risk loading: <strong>+{Math.round((computePedFactor(selectedDiseases) - 1) * 100)}%</strong> applied on base premium
                              </div>
                            )}
                          </div>
                        )}

                        {/* Premium Frequency Selector Cards */}
                        {/* LIFE: Nominee Information (Optional Override) */}
                        {isLife && (
                          <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 10, background: "rgba(147,51,234,0.06)", border: "1px solid rgba(147,51,234,0.2)" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#9333ea", marginBottom: 4 }}>
                              <span className="material-icons" style={{ fontSize: 16 }}>family_restroom</span>
                              NOMINEE DETAILS (OPTIONAL)
                            </label>
                            <p style={{ fontSize: 11, color: "#64748b", marginBottom: 10 }}>
                              Leave blank to automatically use the primary nominee registered in your profile.
                            </p>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                              <div>
                                <label className="form-label" style={{ marginBottom: 4 }}>Nominee Full Name</label>
                                <input
                                  type="text"
                                  placeholder="Defaults to profile nominee"
                                  value={lifeNomineeName}
                                  onChange={(e) => setLifeNomineeName(e.target.value.replace(/[0-9]/g, ""))}
                                  className="form-input"
                                />
                              </div>
                              <div>
                                <label className="form-label" style={{ marginBottom: 4 }}>Relationship</label>
                                <select
                                  value={lifeNomineeRelation}
                                  onChange={(e) => setLifeNomineeRelation(e.target.value)}
                                  className="form-select"
                                >
                                  <option value="">Default from profile…</option>
                                  <option value="SPOUSE">Spouse</option>
                                  <option value="SON">Son</option>
                                  <option value="DAUGHTER">Daughter</option>
                                  <option value="FATHER">Father</option>
                                  <option value="MOTHER">Mother</option>
                                  <option value="SIBLING">Sibling</option>
                                  <option value="OTHER">Other</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}

                        <div style={{ marginBottom: 16 }}>
                          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#534AB7", marginBottom: 8 }}>
                            SELECT PAYMENT FREQUENCY (PREMIUM TYPE) *
                          </label>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
                            {["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL", "ONE_TIME"].map((type) => {
                              const inst = calculateInstallment(purchasing.premiumAmount, type, purchasing.duration, selectedDiseases);
                              const isSelected = selectedPremiumType === type;
                              return (
                                <div
                                  key={type}
                                  onClick={() => setSelectedPremiumType(type)}
                                  className={`freq-card ${isSelected ? "selected" : ""}`}
                                  style={{ padding: "10px 12px", cursor: "pointer" }}
                                >
                                  <div className="freq-card-header">
                                    <span className="freq-card-title">
                                      {type.replace("_", " ")}
                                    </span>
                                    <input
                                      type="radio"
                                      name="selectedPremiumType"
                                      checked={isSelected}
                                      onChange={() => setSelectedPremiumType(type)}
                                    />
                                  </div>
                                  <div className="freq-card-amount">
                                    {formatINR(inst)}
                                    <span className="freq-card-period">
                                      /{type === "MONTHLY" ? "mo" : type === "QUARTERLY" ? "qtr" : type === "SEMI_ANNUAL" ? "half-yr" : type === "ONE_TIME" ? "full term" : "yr"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Summary Callout */}
                        <div
                          style={{
                            background: "rgba(99, 102, 241, 0.08)",
                            border: "1px solid rgba(99, 102, 241, 0.2)",
                            borderRadius: 8,
                            padding: "12px 14px",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                            <span style={{ color: "#94a3b8" }}>Payable Amount Now:</span>
                            <strong style={{ color: "#818cf8", fontSize: 15 }}>
                              {formatINR(calculateInstallment(purchasing.premiumAmount, selectedPremiumType, purchasing.duration, selectedDiseases))}
                            </strong>
                          </div>




                          <div style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                            <span className="material-icons" style={{ fontSize: 14, color: "#10b981" }}>shield</span>
                            {selectedPremiumType === "MONTHLY"
                              ? "Includes 15-day Grace Period protection on monthly payment schedules."
                              : selectedPremiumType === "ONE_TIME"
                                ? "One-time lump sum payment providing full coverage duration."
                                : `Includes 30-day Grace Period protection on ${selectedPremiumType.replace("_", " ").toLowerCase()} payment schedules.`}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
              {!purchaseSuccess && (
                <div className="modal-footer">
                  <Button variant="ghost" onClick={() => setPurchasing(null)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handlePurchase} loading={purchaseLoading}>
                    Confirm Purchase
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default BrowsePlans;
