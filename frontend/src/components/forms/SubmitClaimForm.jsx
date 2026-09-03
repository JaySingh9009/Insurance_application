import { useState } from "react";
import { claimApi } from "../../api/claimApi";
import { getTodayDate } from "../../utils/formatters";
import Alert from "../common/Alert";
import Button from "../common/Button";
import Card from "../common/Card";
import DocumentDropzone from "../common/DocumentDropzone";

export default function SubmitClaimForm({ isOpen, onClose, policies = [], onSuccess }) {
  const [claimForm, setClaimForm] = useState({ policyId: "", claimAmount: "", claimReason: "", incidentDate: "" });
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState("");

  // Upload states
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDocType, setUploadDocType] = useState("CLAIM_FORM");
  const [uploadDocName, setUploadDocName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  if (!isOpen) return null;

  const handleClose = () => {
    setClaimForm({ policyId: "", claimAmount: "", claimReason: "", incidentDate: "" });
    setUploadedDocs([]);
    setUploadFile(null);
    setUploadDocName("");
    setClaimError("");
    setUploadError("");
    onClose();
  };

  const handleUploadFile = async () => {
    if (!uploadFile) {
      setUploadError("Please select a file first.");
      return;
    }
    if (!uploadDocName.trim()) {
      setUploadError("Please enter a document name.");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("documentName", uploadDocName);
      formData.append("documentType", uploadDocType);

      const res = await claimApi.uploadDocument(formData);

      setUploadedDocs((prev) => [
        ...prev,
        {
          documentName: res.data.documentName,
          documentType: res.data.documentType,
          documentUrl: res.data.documentUrl,
          publicId: res.data.publicId,
        },
      ]);

      setUploadFile(null);
      setUploadDocName("");
      const fileInput = document.getElementById("claim-file-input-inline");
      if (fileInput) fileInput.value = "";
    } catch (e) {
      setUploadError(
        e.response?.data?.message || "File upload failed. Ensure the format is correct and size < 10MB."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleClaim = async () => {
    if (!claimForm.policyId || !claimForm.claimAmount || !claimForm.claimReason || !claimForm.incidentDate) {
      setClaimError("All fields are required.");
      return;
    }
    const selectedPolicy = policies.find((p) => String(p.policyId) === String(claimForm.policyId));
    if (selectedPolicy?.productType === "MOTOR" && !claimForm.claimCategory) {
      setClaimError("Please select a claim category for your motor policy.");
      return;
    }
    const today = getTodayDate();
    if (claimForm.incidentDate > today) {
      setClaimError("Incident date must not be a future date");
      return;
    }
    const maxAllowedLimit = (selectedPolicy?.idvAmount && selectedPolicy?.idvAmount > 0)
      ? selectedPolicy.idvAmount
      : selectedPolicy?.coverageAmount;

    if (maxAllowedLimit && Number(claimForm.claimAmount) > maxAllowedLimit) {
      const limitLabel = (selectedPolicy?.idvAmount && selectedPolicy?.idvAmount > 0) ? "IDV (Insured Declared Value)" : "Coverage Sum Assured";
      setClaimError(`Claim amount cannot exceed policy ${limitLabel} of ₹${maxAllowedLimit.toLocaleString('en-IN')}.`);
      return;
    }
    if (claimForm.claimReason.length < 10) {
      setClaimError("Reason must be at least 10 characters.");
      return;
    }
    if (uploadedDocs.length === 0) {
      setClaimError("Please upload at least one supporting document (e.g. Medical Bill, FIR, or Claim Form).");
      return;
    }
    setClaimLoading(true);
    try {
      const payload = {
        policyId: Number(claimForm.policyId),
        claimAmount: Number(claimForm.claimAmount),
        claimReason: claimForm.claimReason,
        incidentDate: claimForm.incidentDate,
        documents: uploadedDocs,
      };
      if (selectedPolicy?.productType === "MOTOR") {
        payload.claimCategory = claimForm.claimCategory;
      }
      await claimApi.submit(payload);
      handleClose();
      if (onSuccess) onSuccess();

    } catch (e) {
      let errMsg = "Claim submission failed.";
      if (e.response?.data) {
        const data = e.response.data;
        if (data.message) errMsg = data.message;
        else if (data.errors && typeof data.errors === "object") {
          errMsg = Object.entries(data.errors)
            .map(([field, msg]) => `${field.replace(/([A-Z])/g, " $1")}: ${msg}`)
            .join("; ");
        }
      }
      setClaimError(errMsg);
    } finally {
      setClaimLoading(false);
    }
  };

  const activePolicies = policies.filter((p) => p.status === "ACTIVE");

  return (
    <Card
      title="Submit a New Claim"
      icon="add_task"
      iconColor="#534AB7"
      headerStyle={{ padding: "16px 20px 12px" }}
      headerActions={<Button variant="ghost" icon="close" iconStyle={{ fontSize: 20 }} onClick={handleClose} style={{ padding: 4 }} />}
      style={{ marginBottom: 20, border: "1.5px solid #534AB7" }}
    >

      <div className="card-body" style={{ padding: "16px 20px 20px" }}>
        <Alert type="error" message={claimError} style={{ marginBottom: 14 }} />

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Policy *</label>
            <select
              className="form-select"
              value={claimForm.policyId}
              onChange={(e) => {
                const polId = e.target.value;
                setClaimForm((f) => ({ ...f, policyId: polId, claimCategory: "" }));
              }}
            >
              <option value="">Select policy…</option>
              {activePolicies.map((p) => (
                <option key={p.policyId} value={p.policyId}>
                  {p.policyNumber} — {p.planName} {p.productType ? `(${p.productType})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Motor Claim Category (only when policy is MOTOR) */}
          {(() => {
            const selPol = activePolicies.find((p) => String(p.policyId) === String(claimForm.policyId));
            if (selPol?.productType === "MOTOR") {
              return (
                <div className="form-group">
                  <label className="form-label">Claim Category (Motor) *</label>
                  <select
                    className="form-select"
                    value={claimForm.claimCategory || ""}
                    onChange={(e) => setClaimForm((f) => ({ ...f, claimCategory: e.target.value }))}
                  >
                    <option value="">Select category…</option>
                    <option value="ACCIDENT">🚗 Accident / Collision</option>
                    <option value="THIRD_PARTY_DAMAGE">👥 Third-Party Liability / Damage</option>
                    <option value="THEFT">🔒 Theft / Total Loss</option>
                    <option value="NATURAL_CALAMITY">🌊 Natural Calamity (Flood / Storm)</option>
                    <option value="FIRE">🔥 Fire / Explosion</option>
                    <option value="BREAKDOWN">🔧 Engine / Mechanical Damage</option>
                    <option value="OTHER">📋 Other</option>
                  </select>
                </div>
              );
            }
            return null;
          })()}

          <div className="form-group">
            <label className="form-label">Claim Amount (₹) *</label>
            <input
              type="number"
              min="1"
              step="1"
              className="form-input"
              placeholder="e.g. 50000"
              value={claimForm.claimAmount}
              onKeyDown={(e) => {
                if (e.key === "." || e.key === "," || e.key === "e" || e.key === "-" || e.key === "+") {
                  e.preventDefault();
                }
              }}
              onChange={(e) => setClaimForm((f) => ({ ...f, claimAmount: e.target.value.replace(/[^\d]/g, "") }))}
            />
          </div>
          <div className="form-group full">
            <label className="form-label">Incident Date *</label>
            <input
              type="date"
              className="form-input"
              value={claimForm.incidentDate}
              onChange={(e) => setClaimForm((f) => ({ ...f, incidentDate: e.target.value }))}
            />
          </div>
          <div className="form-group full">
            <label className="form-label">Claim Reason * (min 10 chars)</label>
            <textarea
              className="form-textarea"
              placeholder="Describe the incident in detail…"
              value={claimForm.claimReason}
              onChange={(e) => setClaimForm((f) => ({ ...f, claimReason: e.target.value }))}
            />
          </div>
        </div>

        {/* Uploaded Documents List */}
        {uploadedDocs.length > 0 && (
          <div className="form-group full" style={{ marginTop: 16 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>
              Attached Documents ({uploadedDocs.length})
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
              {uploadedDocs.map((doc, idx) => (
                <div
                  key={idx}
                  className="attached-doc-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#f9fafb",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "0.5px solid #e5e7eb",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="material-icons" style={{ color: "#534AB7", fontSize: 18 }}>
                      {["PHOTO", "SELFIE", "SIGNATURE", "PROPERTY_PHOTO", "VEHICLE_PHOTO"].includes(
                        doc.documentType?.toUpperCase()
                      )
                        ? "image"
                        : "description"}
                    </span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1f2937" }}>{doc.documentName}</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>{doc.documentType}</div>
                    </div>
                  </div>
                  <button
                    className="btn-ghost"
                    style={{ padding: 4, color: "#dc2626" }}
                    onClick={() => setUploadedDocs((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <span className="material-icons" style={{ fontSize: 18 }}>
                      delete
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inline Document Upload Controls */}
        <DocumentDropzone
          file={uploadFile}
          onFileSelect={setUploadFile}
          docType={uploadDocType}
          onDocTypeChange={setUploadDocType}
          docName={uploadDocName}
          onDocNameChange={setUploadDocName}
          onUpload={handleUploadFile}
          uploading={uploading}
          error={uploadError}
        />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18, borderTop: "1px solid #f3f4f6", paddingTop: 14 }}>
          <Button variant="ghost" onClick={handleClose} disabled={claimLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleClaim} loading={claimLoading}>
            Submit Claim
          </Button>
        </div>
      </div>
    </Card>
  );
}
