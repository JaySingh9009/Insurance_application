import { useState } from "react";
import { userApi } from "../../api/userApi";
import Alert from "../common/Alert";
import Button from "../common/Button";
import Card from "../common/Card";

export default function CreateOfficerForm({ isOpen, onClose, onSuccess }) {
  const emptyForm = { fullName: "", email: "", password: "", mobileNumber: "" };
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setForm(emptyForm);
    setFormError("");
    onClose();
  };

  const handleCreateOfficer = async () => {
    if (!form.fullName || !form.fullName.trim()) {
      setFormError("Full Name is required.");
      return;
    }
    if (/\d/.test(form.fullName)) {
      setFormError("Full Name must not contain numbers.");
      return;
    }
    if (/[^a-zA-Z\s]/.test(form.fullName)) {
      setFormError("Full Name must not contain special characters.");
      return;
    }
    if (!form.email || !form.email.trim()) {
      setFormError("Email address is required.");
      return;
    }
    if (!form.mobileNumber) {
      setFormError("Mobile number is required.");
      return;
    }
    if (form.mobileNumber.startsWith("-") || form.mobileNumber.includes("-")) {
      setFormError("Mobile number must not start with a minus sign.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(form.mobileNumber)) {
      setFormError("Mobile number must be a valid 10-digit number starting with 6, 7, 8, or 9.");
      return;
    }
    if (!form.password || form.password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      try {
        await userApi.createOfficer(form);
      } catch {
        await userApi.createAgent(form);
      }
      handleClose();
      if (onSuccess) onSuccess();

    } catch (e) {
      setFormError(e.response?.data?.message || "Failed to create officer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      title="Create Insurance Officer"
      icon="person_add"
      iconColor="#16a34a"
      headerStyle={{ padding: "16px 20px 12px" }}
      headerActions={<Button variant="ghost" icon="close" iconStyle={{ fontSize: 20 }} onClick={handleClose} style={{ padding: 4 }} />}
      style={{ marginBottom: 20, border: "1.5px solid #16a34a" }}
    >

      <div className="card-body" style={{ padding: "16px 20px 20px" }}>
        <Alert type="error" message={formError} style={{ marginBottom: 14 }} />

        <div className="form-grid">
          <div className="form-group full">
            <label className="form-label">Full Name *</label>
            <input
              className="form-input"
              placeholder="John Doe"
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value.replace(/[^a-zA-Z\s]/g, "") }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              type="email"
              className="form-input"
              placeholder="officer@example.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mobile (10 digits) *</label>
            <input
              className="form-input"
              placeholder="9876543210"
              maxLength={10}
              value={form.mobileNumber}
              onChange={(e) => setForm((f) => ({ ...f, mobileNumber: e.target.value.replace(/\D/g, "") }))}
            />
          </div>
          <div className="form-group full">
            <label className="form-label">Password * (min 8 chars)</label>
            <input
              type="password"
              className="form-input"
              placeholder="Min 8 characters"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18, borderTop: "1px solid #f3f4f6", paddingTop: 14 }}>
          <Button variant="ghost" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreateOfficer} loading={saving}>
            Create Officer
          </Button>
        </div>
      </div>
    </Card>
  );
}
