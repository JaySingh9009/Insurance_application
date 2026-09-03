import { useState, useEffect } from "react";
import { policyApi } from "../../api/policyApi";
import { formatINR, getTodayDate } from "../../utils/formatters";
import Alert from "../common/Alert";
import Button from "../common/Button";
import Card from "../common/Card";

export default function BuyPolicyForm({
  isOpen,
  onClose,
  plans = [],
  customers = [],
  isIssueMode = false,
  onSuccess,
}) {

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedPremiumType, setSelectedPremiumType] = useState("ANNUAL");
  const [startDate, setStartDate] = useState(getTodayDate());
  const [endDate, setEndDate] = useState("");

  // Motor specific states
  const [vehicleRegistrationNo, setVehicleRegistrationNo] = useState("");
  const [vehicleMakeModel, setVehicleMakeModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState(new Date().getFullYear());

  // Health-specific states — pre-existing diseases (PED)
  const [selectedDiseases, setSelectedDiseases] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Find currently selected plan object
  const currentPlan = plans.find((p) => String(p.planId) === String(selectedPlanId));

  // Determine product type
  const rawProductType = currentPlan?.productType?.toUpperCase();
  const isTravel =
    rawProductType === "TRAVEL" ||
    currentPlan?.productName?.toLowerCase().includes("travel") ||
    currentPlan?.planName?.toLowerCase().includes("travel");
  const isMotor =
    rawProductType === "MOTOR" ||
    currentPlan?.productName?.toLowerCase().includes("motor") ||
    currentPlan?.planName?.toLowerCase().includes("motor");
  const isHealth =
    rawProductType === "HEALTH" ||
    currentPlan?.productName?.toLowerCase().includes("health") ||
    currentPlan?.planName?.toLowerCase().includes("health");
  const isLife =
    rawProductType === "LIFE" ||
    currentPlan?.productName?.toLowerCase().includes("life") ||
    currentPlan?.planName?.toLowerCase().includes("life");

  // Life-specific states — nominee details (optional override)
  const [nomineeName, setNomineeName] = useState("");
  const [nomineeRelation, setNomineeRelation] = useState("");




  // Reset/sync defaults when selected plan changes
  useEffect(() => {
    if (!currentPlan) return;

    if (isTravel) {
      setSelectedPremiumType("ONE_TIME");
      const today = getTodayDate();
      setStartDate(today);
      // Default end date = today + plan.duration days
      const d = new Date();
      d.setDate(d.getDate() + (currentPlan.duration || 7));
      setEndDate(d.toISOString().split("T")[0]);
    } else {
      setSelectedPremiumType(currentPlan.premiumType || "ANNUAL");
      setStartDate(getTodayDate());
      setEndDate("");
    }
    // Reset diseases & nominee fields whenever plan changes
    setSelectedDiseases([]);
    setNomineeName("");
    setNomineeRelation("");
  }, [selectedPlanId, isTravel, isMotor, isHealth, isLife]);




  if (!isOpen) return null;

  const ALL_PREMIUM_TYPES = ["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL", "ONE_TIME"];
  const allowedTypes = isTravel ? ["ONE_TIME"] : ALL_PREMIUM_TYPES;

  // PED loading factor — computed from selected diseases (HEALTH only)
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
    if (type === "ONE_TIME") {
      if (isTravel) return Math.round(base);
      return Math.round(base * dur * 0.9);
    }
    return Math.round(base);
  };




  // Trip duration calculation for Travel
  let tripDays = 0;
  if (isTravel && startDate && endDate) {
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const diffTime = d2 - d1;
    tripDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  const handleSubmit = async () => {
    if (isIssueMode && !selectedCustomerId) {
      setError("Please select a customer.");
      return;
    }
    if (!selectedPlanId) {
      setError("Please select an insurance plan.");
      return;
    }

    if (isTravel) {
      if (!startDate || !endDate) {
        setError("Both Departure Date and Return Date are required for Travel policies.");
        return;
      }
      if (new Date(endDate) <= new Date(startDate)) {
        setError("Return date must be after departure date.");
        return;
      }
      if (currentPlan?.duration && tripDays > currentPlan.duration) {
        setError(
          `Selected trip duration (${tripDays} days) exceeds maximum allowed ${currentPlan.duration} days for this plan.`
        );
        return;
      }
    }

    if (isMotor) {
      if (!vehicleRegistrationNo || !vehicleMakeModel || !vehicleYear) {
        setError("Vehicle Registration No., Make & Model, and Year are required for Motor policies.");
        return;
      }

      const cleanedRegNo = vehicleRegistrationNo.replace(/[\s-]/g, "").toUpperCase().trim();
      const regNoPattern = /^[A-Z]{2}[0-9]{2}[A-Z]{1,3}[0-9]{4}$/;
      if (!regNoPattern.test(cleanedRegNo)) {
        setError(
          `Invalid vehicle registration number format: '${vehicleRegistrationNo}'. Standard format example: MH12AB1234 or DL01C1234.`
        );
        return;
      }

      const currentYr = new Date().getFullYear();
      const yrNum = Number(vehicleYear);
      if (yrNum > currentYr) {
        setError("Vehicle manufacturing year cannot be in the future.");
        return;
      }
      if (currentYr - yrNum > 15) {
        setError(`Vehicle manufactured in ${yrNum} is older than 15 years and is not eligible for insurance.`);
        return;
      }
    }

    if (isLife && nomineeName && /\d/.test(nomineeName)) {
      setError("Nominee name cannot contain numbers.");
      return;
    }

    setLoading(true);
    setError("");

    const payload = {
      ...(isIssueMode && { customerId: Number(selectedCustomerId) }),
      planId: Number(selectedPlanId),
      selectedPremiumType,
      startDate: startDate || getTodayDate(),
      ...(isTravel && { endDate }),
      ...(isMotor && {
        vehicleRegistrationNo: vehicleRegistrationNo.trim(),
        vehicleMakeModel: vehicleMakeModel.trim(),
        vehicleYear: Number(vehicleYear),
      }),
      // Health-only: include diseases only if any are selected
      ...(isHealth && selectedDiseases.length > 0 && { preExistingDiseases: selectedDiseases }),
      // Life-only: include nominee override fields if specified
      ...(isLife && nomineeName && { nomineeName: nomineeName.trim() }),
      ...(isLife && nomineeRelation && { nomineeRelation: nomineeRelation.trim() }),
    };




    try {
      if (isIssueMode) {
        await policyApi.issue(payload);
      } else {
        await policyApi.purchase(payload);
      }

      onClose();

      if (onSuccess) onSuccess();
    } catch (e) {
      setError(e.response?.data?.message || "Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title={isIssueMode ? "Issue Policy to Customer" : "Purchase a Policy"}
      icon={isIssueMode ? "policy" : "shopping_cart"}
      iconColor={isIssueMode ? "#16a34a" : "#6366f1"}
      headerStyle={{ padding: "16px 20px 12px" }}
      headerActions={<Button variant="ghost" icon="close" iconStyle={{ fontSize: 20 }} onClick={onClose} style={{ padding: 4 }} />}
      style={{ marginBottom: 20, border: `1.5px solid ${isIssueMode ? "#16a34a" : "#6366f1"}` }}
    >
      <div className="card-body" style={{ padding: "16px 20px 20px" }}>
        <Alert type="error" message={error} style={{ marginBottom: 14 }} />

        <div className="form-grid">
          {/* Customer Selection (Officer / Agent Issue Mode) */}
          {isIssueMode && (
            <div className="form-group full">
              <label className="form-label">Select Customer *</label>
              <select
                className="form-select"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                <option value="">Choose customer…</option>
                {customers.map((c) => (
                  <option key={c.customerId} value={c.customerId}>
                    {c.fullName} ({c.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Plan Selection */}
          <div className="form-group full">
            <label className="form-label">Select Plan *</label>
            <select
              className="form-select"
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
            >
              <option value="">Choose an insurance plan…</option>
              {plans.map((p) => (
                <option key={p.planId} value={p.planId}>
                  {p.planName} — {p.productName} — {formatINR(p.premiumAmount)} Base Premium (
                  {p.duration}{" "}
                  {p.productType?.toUpperCase() === "TRAVEL" ||
                    p.productName?.toLowerCase().includes("travel")
                    ? "days"
                    : "yrs"}
                  )
                </option>
              ))}
            </select>
          </div>

          {/* TRAVEL PRODUCT DYNAMIC FIELDS */}
          {currentPlan && isTravel && (
            <>
              <div className="form-group">
                <label className="form-label">Departure Date (Start Date) *</label>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  min={getTodayDate()}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Return Date (End Date) *</label>
                <input
                  type="date"
                  className="form-input"
                  value={endDate}
                  min={startDate || getTodayDate()}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="form-group full">
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: tripDays > (currentPlan.duration || 0) ? "#fef2f2" : "#f0fdf4",
                    border:
                      tripDays > (currentPlan.duration || 0)
                        ? "1px solid #fca5a5"
                        : "1px solid #bbf7d0",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                  }}
                >
                  <span
                    className="material-icons"
                    style={{
                      fontSize: 18,
                      color: tripDays > (currentPlan.duration || 0) ? "#ef4444" : "#16a34a",
                    }}
                  >
                    flight_takeoff
                  </span>
                  <span>
                    Selected Trip Duration: <strong>{tripDays > 0 ? tripDays : 0} days</strong> | Max Allowed:{" "}
                    <strong>{currentPlan.duration} days</strong>
                  </span>
                </div>
              </div>
            </>
          )}

          {/* MOTOR PRODUCT DYNAMIC FIELDS */}
          {currentPlan && isMotor && (
            <>
              <div className="form-group">
                <label className="form-label">Vehicle Reg. No. (e.g. MH12AB1234) *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="MH12AB1234"
                  value={vehicleRegistrationNo}
                  onChange={(e) => setVehicleRegistrationNo(e.target.value.toUpperCase())}
                />
                {vehicleRegistrationNo && !/^[A-Z]{2}[0-9]{2}[A-Z]{1,3}[0-9]{4}$/.test(vehicleRegistrationNo.replace(/[\s-]/g, "").toUpperCase()) && (
                  <span style={{ fontSize: 11, color: "#ef4444", marginTop: 4, display: "block" }}>
                    Format example: State (2 letters) + RTO (2 digits) + Series (1-3 letters) + Number (4 digits), e.g. MH12AB1234
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Vehicle Make & Model *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Maruti Swift VXi"
                  value={vehicleMakeModel}
                  onChange={(e) => setVehicleMakeModel(e.target.value)}
                />
              </div>

              <div className="form-group full">
                <label className="form-label">Manufacturing Year *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="2020"
                  min="2000"
                  step="1"
                  max={new Date().getFullYear()}
                  value={vehicleYear}
                  onKeyDown={(e) => {
                    if (e.key === "." || e.key === "," || e.key === "e" || e.key === "-" || e.key === "+") e.preventDefault();
                  }}
                  onChange={(e) => setVehicleYear(e.target.value.replace(/[^\d]/g, ""))}
                />
              </div>
            </>
          )}

          {/* HEALTH: PRE-EXISTING DISEASE SELECTOR */}
          {currentPlan && isHealth && (
            <div className="form-group full">
              <label className="form-label" style={{ fontWeight: 600, color: "#6366f1" }}>
                Pre-Existing Diseases (Optional)
              </label>
              <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 10, marginTop: 2 }}>
                Select any conditions you have. A risk loading will be added to your premium.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[
                  { key: "DIABETES",     label: "Diabetes",        loading: "+15%" },
                  { key: "HYPERTENSION", label: "Hypertension",    loading: "+10%" },
                  { key: "ASTHMA_COPD",  label: "Asthma / COPD",  loading: "+10%" },
                  { key: "THYROID",      label: "Thyroid",         loading: "+5%"  },
                  { key: "HEART_DISEASE",label: "Heart Disease",   loading: "+30%" },
                  { key: "KIDNEY_LIVER", label: "Kidney / Liver",  loading: "+25%" },
                  { key: "OTHER",        label: "Other",           loading: "+5%"  },
                ].map(({ key, label, loading: pct }) => {
                  const sel = selectedDiseases.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDiseases((prev) =>
                        sel ? prev.filter((d) => d !== key) : [...prev, key]
                      )}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 20,
                        border: sel ? "2px solid #6366f1" : "1px solid rgba(148,163,184,0.3)",
                        background: sel ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)",
                        color: sel ? "#818cf8" : "#94a3b8",
                        fontSize: 12,
                        fontWeight: sel ? 700 : 400,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        transition: "all 0.2s",
                      }}
                    >
                      {sel && <span className="material-icons" style={{ fontSize: 13 }}>check_circle</span>}
                      {label}
                      <span style={{
                        background: sel ? "#6366f1" : "rgba(148,163,184,0.2)",
                        color: sel ? "#fff" : "#94a3b8",
                        fontSize: 9, fontWeight: 700,
                        padding: "1px 5px", borderRadius: 10,
                      }}>{pct}</span>
                    </button>
                  );
                })}
              </div>
              {selectedDiseases.length > 0 && (
                <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", fontSize: 12, color: "#a5b4fc" }}>
                  <span className="material-icons" style={{ fontSize: 13, verticalAlign: "middle", marginRight: 4 }}>info</span>
                  Risk loading applied: <strong>+{Math.round((computePedFactor(selectedDiseases) - 1) * 100)}%</strong> on base premium
                </div>
              )}
            </div>
          )}

          {/* LIFE PRODUCT DYNAMIC FIELDS: NOMINEE OVERRIDE */}
          {currentPlan && isLife && (
            <div className="form-group full" style={{ background: "rgba(147,51,234,0.04)", padding: 14, borderRadius: 10, border: "1px solid rgba(147,51,234,0.15)" }}>
              <label className="form-label" style={{ fontWeight: 600, color: "#a855f7", display: "flex", alignItems: "center", gap: 6 }}>
                <span className="material-icons" style={{ fontSize: 18 }}>family_restroom</span>
                Nominee Details (Optional)
              </label>
              <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12, marginTop: 2 }}>
                Leave blank to automatically use the primary nominee registered in your profile.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: 12 }}>Nominee Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Defaults to profile nominee"
                    value={nomineeName}
                    onChange={(e) => setNomineeName(e.target.value.replace(/[0-9]/g, ""))}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: 12 }}>Nominee Relationship</label>
                  <select
                    className="form-select"
                    value={nomineeRelation}
                    onChange={(e) => setNomineeRelation(e.target.value)}
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

          {/* PAYMENT FREQUENCY SELECTOR CARDS */}



          {currentPlan && (
            <div className="form-group full">
              <label className="form-label" style={{ fontWeight: 600, color: "#6366f1" }}>
                {isTravel ? "Payment Frequency" : "Choose Preferred Payment Frequency *"}
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                  gap: 10,
                  marginTop: 6,
                }}
              >
                {allowedTypes.map((type) => {
                  const inst = calculateInstallment(currentPlan.premiumAmount, type, currentPlan.duration, selectedDiseases);
                  const isSelected = selectedPremiumType === type;

                  const discountTag =
                    type === "QUARTERLY"
                      ? "1.5% OFF"
                      : type === "SEMI_ANNUAL"
                        ? "3% OFF"
                        : type === "ANNUAL"
                          ? "5% OFF"
                          : type === "ONE_TIME" && !isTravel
                            ? "10% OFF"
                            : null;

                  return (
                    <div
                      key={type}
                      onClick={() => setSelectedPremiumType(type)}
                      className={`freq-card ${isSelected ? "selected" : ""}`}
                    >
                      <div className="freq-card-header">
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span className="freq-card-title">{type.replace("_", " ")}</span>
                          {discountTag && (
                            <span
                              style={{
                                background: "linear-gradient(135deg, #16a34a, #15803d)",
                                color: "#ffffff",
                                fontSize: "9px",
                                fontWeight: 700,
                                padding: "2px 5px",
                                borderRadius: "4px",
                                textTransform: "uppercase",
                              }}
                            >
                              {discountTag}
                            </span>
                          )}
                        </div>
                        <input
                          type="radio"
                          name="premiumType"
                          checked={isSelected}
                          onChange={() => setSelectedPremiumType(type)}
                        />
                      </div>
                      <div className="freq-card-amount">
                        {formatINR(inst)}
                        <span className="freq-card-period">
                          /
                          {type === "MONTHLY"
                            ? "month"
                            : type === "QUARTERLY"
                              ? "quarter"
                              : type === "SEMI_ANNUAL"
                                ? "half-year"
                                : type === "ONE_TIME"
                                  ? "one-time"
                                  : "year"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* COVERAGE & INSTALLMENT SUMMARY BOX */}
          {currentPlan && (
            <div className="form-group full policy-summary-box">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  marginBottom: 6,
                }}
              >
                <span>Coverage Sum Assured:</span>
                <strong>{formatINR(currentPlan.coverageAmount)}</strong>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  marginBottom: 6,
                }}
              >
                <span>Initial Installment Payable Now:</span>
                <strong style={{ color: "#6366f1", fontSize: 14 }}>
                  {formatINR(
                    calculateInstallment(currentPlan.premiumAmount, selectedPremiumType, currentPlan.duration, selectedDiseases)
                  )}
                </strong>

              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#94a3b8",
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span className="material-icons" style={{ fontSize: 15, color: "#10b981" }}>
                  verified_user
                </span>
                {selectedPremiumType === "MONTHLY"
                  ? "Includes 15-day Grace Period protection on monthly payment schedules."
                  : selectedPremiumType === "ONE_TIME"
                    ? "One-time lump sum payment providing full coverage duration."
                    : `Includes 30-day Grace Period protection on ${selectedPremiumType
                      .replace("_", " ")
                      .toLowerCase()} payment schedules.`}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 18,
            borderTop: "1px solid rgba(243, 244, 246, 0.1)",
            paddingTop: 14,
          }}
        >
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            {isIssueMode ? "Issue Policy" : "Purchase Policy"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
