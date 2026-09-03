import { useEffect, useState } from "react";
import { customerApi } from "../../api/customerApi";
import AppLayout from "../../components/layout/AppLayout";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import { useAuth } from "../../hooks/useAuth";
import "../../styles/shared.css";

const emptyForm = {
  dateOfBirth: "", address: "", city: "", state: "",
  pincode: "", nomineeName: "", nomineeRelation: "",
};

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const NOMINEE_RELATIONS = [
  "Spouse", "Father", "Mother", "Son", "Daughter", "Brother", "Sister", "Husband", "Wife", "Other"
];

function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await customerApi.getMyProfile();
      setProfile(res.data);
      setForm({
        dateOfBirth: res.data.dateOfBirth || "",
        address: res.data.address || "",
        city: res.data.city || "",
        state: res.data.state || "",
        pincode: res.data.pincode || "",
        nomineeName: res.data.nomineeName || "",
        nomineeRelation: res.data.nomineeRelation || "",
      });
    } catch (e) {
      if (e.response?.status === 404 || e.response?.status === 400) {
        setIsNew(true); setEditing(true);
      }
    } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchProfile(); }, []);

  const handleSave = async () => {
    if (!form.dateOfBirth || !form.address || !form.city || !form.state || !form.pincode || !form.nomineeName || !form.nomineeRelation) {
      setError("All fields are required."); return;
    }
    const today = new Date().toISOString().split("T")[0];
    if (form.dateOfBirth >= today) {
      setError("Date of birth must be in the past"); return;
    }
    if (/\d/.test(form.city)) {
      setError("City name must not contain numbers."); return;
    }
    if (/\d/.test(form.nomineeName)) {
      setError("Nominee name must not contain numbers."); return;
    }
    setSaving(true); setError(""); setSuccess(false);
    try {
      if (isNew) {
        await customerApi.createProfile(form);
        setIsNew(false);
      } else {
        await customerApi.updateMyProfile(form);
      }
      setEditing(false);
      setSuccess(true);
      fetchProfile();
    } catch (e) {

      let errMsg = "Save failed.";
      if (e.response?.data) {
        const data = e.response.data;
        if (data.message) errMsg = data.message;
        else if (data.errors && typeof data.errors === "object") {
          errMsg = Object.entries(data.errors)
            .map(([field, msg]) => `${field.replace(/([A-Z])/g, ' $1')}: ${msg}`)
            .join("; ");
        }
      }
      setError(errMsg);
    } finally { setSaving(false); }
  };

  const f = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <AppLayout>
      <header className="topbar">
          <div className="topbar-left">
            <h1 className="topbar-title">My Profile</h1>
            <p className="topbar-greeting">Manage your personal and nominee details</p>
          </div>
          {!editing && (
            <Button variant="outlined" icon="edit" onClick={() => { setEditing(true); setSuccess(false); setError(""); }}>
              Edit Profile
            </Button>
          )}
        </header>

        <div className="page-container">
          {loading ? <Loader /> : (
            <>
              {success && <Alert type="success" message="Profile saved successfully!" />}
              <Alert type="error" message={error} />
              {isNew && (
                <Alert type="warning" icon="info" message="Please complete your profile to purchase policies and file claims." />
              )}

              {/* Account Info */}
              <Card title="Account Information">
                <div className="card-body">
                  <div className="info-grid">
                    <div className="info-item"><span className="info-label">Full Name</span><span className="info-value">{profile?.fullName || user?.fullName || localStorage.getItem("fullName") || localStorage.getItem("name") || "—"}</span></div>
                    <div className="info-item"><span className="info-label">Email</span><span className="info-value">{profile?.email || user?.email || localStorage.getItem("email") || "—"}</span></div>
                    <div className="info-item"><span className="info-label">Mobile</span><span className="info-value">{profile?.mobileNumber || user?.mobileNumber || localStorage.getItem("mobileNumber") || "—"}</span></div>
                  </div>
                </div>
              </Card>

              {/* Editable Profile */}
              <Card title={isNew ? "Create Profile" : (editing ? "Edit Profile" : "Personal Details")}>
                <div className="card-body">
                  {editing ? (
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Date of Birth *</label>
                        <input type="date" className="form-input" value={form.dateOfBirth} onChange={f("dateOfBirth")} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Pincode * (6 digits)</label>
                        <input className="form-input" placeholder="110001" maxLength={6} value={form.pincode} onChange={f("pincode")} />
                      </div>
                      <div className="form-group full">
                        <label className="form-label">Address * (5–300 chars)</label>
                        <input className="form-input" placeholder="Street address" value={form.address} onChange={f("address")} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">City *</label>
                        <input className="form-input" placeholder="Mumbai" value={form.city} onChange={e => setForm(prev => ({ ...prev, city: e.target.value.replace(/\d/g, "") }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">State *</label>
                        <select className="form-select" value={form.state} onChange={f("state")}>
                          <option value="">Select state…</option>
                          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Nominee Name *</label>
                        <input className="form-input" placeholder="Full name" value={form.nomineeName} onChange={e => setForm(prev => ({ ...prev, nomineeName: e.target.value.replace(/\d/g, "") }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Nominee Relation *</label>
                        <select className="form-select" value={form.nomineeRelation} onChange={f("nomineeRelation")}>
                          <option value="">Select relation…</option>
                          {NOMINEE_RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div style={{ gridColumn: "1/-1", display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
                        {!isNew && <Button variant="outlined" onClick={() => { setEditing(false); setError(""); }}>Cancel</Button>}
                        <Button variant="primary" onClick={handleSave} loading={saving}>
                          {isNew ? "Create Profile" : "Save Profile"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="info-grid">
                      <div className="info-item"><span className="info-label">Date of Birth</span><span className="info-value">{profile?.dateOfBirth || "—"}</span></div>
                      <div className="info-item"><span className="info-label">Pincode</span><span className="info-value">{profile?.pincode || "—"}</span></div>
                      <div className="info-item" style={{ gridColumn: "1/-1" }}><span className="info-label">Address</span><span className="info-value">{[profile?.address, profile?.city, profile?.state].filter(Boolean).join(", ") || "—"}</span></div>
                      <div className="info-item"><span className="info-label">Nominee Name</span><span className="info-value">{profile?.nomineeName || "—"}</span></div>
                      <div className="info-item"><span className="info-label">Nominee Relation</span><span className="info-value">{profile?.nomineeRelation || "—"}</span></div>
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
    </AppLayout>
  );
}

export default Profile;
