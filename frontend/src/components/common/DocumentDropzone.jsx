import React from "react";
import Alert from "./Alert";
import Button from "./Button";

export function DocumentDropzone({
  file,
  onFileSelect,
  docType,
  onDocTypeChange,
  docName,
  onDocNameChange,
  onUpload,
  uploading,
  error,
}) {
  return (
    <div className="form-group full" style={{ borderTop: "0.5px solid #e5e7eb", paddingTop: 16, marginTop: 16 }}>
      <label className="form-label" style={{ fontWeight: 600 }}>
        Upload Supporting Document
      </label>
      <Alert type="error" message={error} style={{ margin: "8px 0", padding: "8px 12px" }} />

      <div className="form-grid" style={{ marginTop: 8 }}>
        <div className="form-group">
          <label className="form-label">Document Type</label>
          <select className="form-select" value={docType} onChange={(e) => onDocTypeChange(e.target.value)}>
            <optgroup label="PDF / Document Formats">
              <option value="CLAIM_FORM">Claim Form</option>
              <option value="MEDICAL_REPORT">Medical Report</option>
              <option value="HOSPITAL_BILL">Hospital Bill</option>
              <option value="POLICE_FIR">Police FIR / Report</option>
              <option value="DEATH_CERTIFICATE">Death Certificate</option>
              <option value="INSURANCE_POLICY">Insurance Policy copy</option>
              <option value="ID_PROOF">ID Proof</option>
              <option value="OTHER">Other PDF</option>
            </optgroup>
            <optgroup label="Image Formats">
              <option value="PHOTO">Photo</option>
              <option value="SELFIE">Selfie</option>
              <option value="SIGNATURE">Signature Image</option>
              <option value="PROPERTY_PHOTO">Property Photo</option>
              <option value="VEHICLE_PHOTO">Vehicle Photo</option>
            </optgroup>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Document Name *</label>
          <input
            className="form-input"
            placeholder="e.g. Medical Bills Dec"
            value={docName}
            onChange={(e) => onDocNameChange(e.target.value)}
          />
        </div>

        <div className="form-group full" style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <input
              id="dropzone-file-input"
              type="file"
              className="form-input"
              style={{ padding: "6px" }}
              accept="application/pdf,image/*"
              onChange={(e) => {
                const f = e.target.files[0];
                onFileSelect(f);
                if (f && !docName) {
                  const nameWithoutExt = f.name.substring(0, f.name.lastIndexOf(".")) || f.name;
                  onDocNameChange(nameWithoutExt);
                }
              }}
            />
          </div>
          <Button
            type="button"
            variant="outlined"
            onClick={onUpload}
            loading={uploading}
            icon="upload"
            style={{ height: 40, whiteSpace: "nowrap" }}
          >
            {uploading ? "Uploading…" : "Upload file"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DocumentDropzone;
