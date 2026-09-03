import { useEffect, useState } from "react";
import { userApi } from "../../api/userApi";
import AppLayout from "../../components/layout/AppLayout";
import CreateOfficerForm from "../../components/forms/CreateOfficerForm";
import StatusBadge, { ActiveBadge } from "../../components/common/StatusBadge";
import Pagination from "../../components/common/Pagination";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import { exportToCSV } from "../../utils/csv";
import "../../styles/shared.css";

const roleColors = { ADMIN: "badge-review", OFFICER: "badge-recommended", AGENT: "badge-recommended", CUSTOMER: "badge-submitted" };

function Users() {
  const [data, setData] = useState({ records: [], totalRecords: 0, totalPages: 0 });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userApi.getAllUsers(page, 10, "createdAt", "desc", roleFilter);
      setData(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const toggleUser = async (u) => {
    try {
      if (u.active) {
        await userApi.deactivate(u.id);
      } else {
        await userApi.activate(u.id);
      }
      fetchUsers();
    } catch (e) {
      alert(e.response?.data?.message || "Operation failed.");
    }
  };


  const handleExport = () => {
    exportToCSV("Users_List", data.records, {
      fullName: "Full Name",
      email: "Email Address",
      mobileNumber: "Mobile Number",
      role: "Role",
      active: "Status",
    });
  };

  return (
    <AppLayout>
      <div className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">User Management</h1>
          <p className="topbar-greeting">Manage customers, insurance officers, and admins</p>
        </div>
        <div className="topbar-actions">
          <Button variant="outlined" icon="download" onClick={handleExport}>
            Export CSV
          </Button>
          <Button variant="primary" icon={showCreate ? "close" : "person_add"} onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? "Close Form" : "Create Officer"}
          </Button>
        </div>
      </div>

      <div className="page-container">
        <CreateOfficerForm isOpen={showCreate} onClose={() => setShowCreate(false)} onSuccess={fetchUsers} />

        <div className="filter-bar" style={{ marginBottom: 20 }}>
          {["ALL", "CUSTOMER", "OFFICER", "ADMIN"].map((r) => (
            <button
              key={r}
              className={roleFilter === r ? "filter-chip active" : "filter-chip"}
              onClick={() => { setRoleFilter(r); setPage(0); }}
            >
              {r === "OFFICER" || r === "AGENT" ? "Insurance Officers" : r}
            </button>
          ))}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Users list</span>
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
                      <th>Name</th>
                      <th>Email</th>
                      <th>Mobile</th>
                      <th>Role</th>
                      <th>Active Tasks</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.records.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <EmptyState icon="manage_accounts" message="No users found" />
                        </td>
                      </tr>
                    ) : (
                      data.records.map((u) => (
                        <tr key={u.id}>
                          <td className="td-bold">{u.fullName}</td>
                          <td className="td-muted">{u.email}</td>
                          <td>{u.mobileNumber || "—"}</td>
                          <td>
                            <StatusBadge status={u.role} />
                          </td>
                          <td>
                            {u.role === "AGENT" || u.role === "OFFICER" ? (
                              <span className="badge badge-review" style={{ fontWeight: 600 }}>
                                {u.activeTaskCount ?? 0} active task{(u.activeTaskCount === 1) ? "" : "s"}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>
                            <ActiveBadge active={u.active} />
                          </td>
                          <td>
                            {u.role !== "ADMIN" && (
                              <button className={u.active ? "btn-danger" : "btn-success"} onClick={() => toggleUser(u)}>
                                {u.active ? "Deactivate" : "Activate"}
                              </button>
                            )}
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

export default Users;
