import { useEffect, useState } from "react";
import { authApi } from "../../api/authApi";
import AppLayout from "../../components/layout/AppLayout";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";
import "../../styles/shared.css";

function OfficerProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await authApi.getProfile();
      setProfile(res.data);
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  };


  const getInitials = (name) => {
    if (!name) return "OF";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <AppLayout>
      <header className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">My Profile</h1>
          <p className="topbar-greeting">Insurance Officer Account Details</p>
        </div>
      </header>

      <div className="page-container" style={{ maxWidth: 900 }}>
        {loading ? (
          <Loader />
        ) : profile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Main Profile Card */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {/* Profile Header Hero */}
              <div className="profile-hero" style={{ padding: "28px 32px", background: "linear-gradient(135deg, rgba(83,74,183,0.06), rgba(124,111,205,0.03))" }}>
                <div className="profile-avatar" style={{ width: 72, height: 72, fontSize: 28 }}>
                  {getInitials(profile.fullName)}
                </div>
                <div className="profile-hero-info">
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <h2 className="profile-hero-name" style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
                      {profile.fullName}
                    </h2>
                    <span className="badge badge-recommended" style={{ fontSize: 11, padding: "4px 12px" }}>
                      {profile.role === "OFFICER" || profile.role === "AGENT" ? "INSURANCE OFFICER" : profile.role}
                    </span>
                    <span className="badge badge-active" style={{ fontSize: 11, padding: "4px 12px" }}>
                      ● Active Officer
                    </span>
                  </div>
                  <p className="profile-hero-email" style={{ fontSize: 13.5, margin: "4px 0 0 0" }}>
                    {profile.email}
                  </p>
                </div>
              </div>

              {/* Profile Details Grid */}
              <div className="card-header" style={{ padding: "16px 28px 12px", borderTop: "1px solid #f3f4f6" }}>
                <span className="card-title" style={{ fontSize: 15, fontWeight: 700 }}>
                  Officer Information
                </span>
              </div>

              <div className="profile-fields" style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                <div className="profile-field" style={{ padding: "20px 28px" }}>
                  <div className="profile-field-icon" style={{ background: "#ede9fe", color: "#534AB7" }}>
                    <span className="material-icons">person</span>
                  </div>
                  <div className="profile-field-content">
                    <span className="profile-field-label">Full Name</span>
                    <span className="profile-field-value">{profile.fullName}</span>
                  </div>
                </div>

                <div className="profile-field" style={{ padding: "20px 28px" }}>
                  <div className="profile-field-icon" style={{ background: "#dbeafe", color: "#2563eb" }}>
                    <span className="material-icons">email</span>
                  </div>
                  <div className="profile-field-content">
                    <span className="profile-field-label">Email Address</span>
                    <span className="profile-field-value">{profile.email}</span>
                  </div>
                </div>

                <div className="profile-field" style={{ padding: "20px 28px" }}>
                  <div className="profile-field-icon" style={{ background: "#dcfce7", color: "#16a34a" }}>
                    <span className="material-icons">phone</span>
                  </div>
                  <div className="profile-field-content">
                    <span className="profile-field-label">Mobile Number</span>
                    <span className="profile-field-value">{profile.mobileNumber || "—"}</span>
                  </div>
                </div>

                <div className="profile-field" style={{ padding: "20px 28px" }}>
                  <div className="profile-field-icon" style={{ background: "#fef3c7", color: "#b45309" }}>
                    <span className="material-icons">admin_panel_settings</span>
                  </div>
                  <div className="profile-field-content">
                    <span className="profile-field-label">Assigned Role</span>
                    <span className="profile-field-value">{profile.role === "OFFICER" || profile.role === "AGENT" ? "INSURANCE OFFICER" : profile.role}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Portal Access Overview Card */}
            <div className="card" style={{ padding: 24 }}>
              <div className="card-header" style={{ padding: "0 0 16px 0", borderBottom: "1px solid #f3f4f6", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="material-icons" style={{ color: "#534AB7" }}>verified_user</span>
                  <span className="card-title" style={{ fontSize: 15, fontWeight: 700 }}>
                    Portal Authorization & Access
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                <div style={{ background: "#f9fafb", borderRadius: 10, padding: "16px 18px", border: "1px solid #f3f4f6" }} className="access-box">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span className="material-icons" style={{ fontSize: 18, color: "#16a34a" }}>check_circle</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Policy Issuance</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>Authorized to create and issue insurance policies to customers</p>
                </div>

                <div style={{ background: "#f9fafb", borderRadius: 10, padding: "16px 18px", border: "1px solid #f3f4f6" }} className="access-box">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span className="material-icons" style={{ fontSize: 18, color: "#16a34a" }}>check_circle</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Claim Review</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>Review assigned claims and make approval recommendations</p>
                </div>

                <div style={{ background: "#f9fafb", borderRadius: 10, padding: "16px 18px", border: "1px solid #f3f4f6" }} className="access-box">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span className="material-icons" style={{ fontSize: 18, color: "#16a34a" }}>check_circle</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Customer Lookup</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>Access customer directory and policyholder details</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 24 }}>
            <Alert type="error" message="Failed to load profile details." />
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default OfficerProfile;
