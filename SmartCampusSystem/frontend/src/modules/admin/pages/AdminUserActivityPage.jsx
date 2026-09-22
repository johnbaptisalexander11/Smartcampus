import { useEffect, useState } from "react";
import {
  fetchAdminUserActivity,
  fetchUserActivityDetails,
  updateUserAccountStatus,
} from "../services/adminService";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspend" },
  { value: "blocked", label: "Block" },
];

const AdminUserActivityPage = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: "active", reason: "", suspendedUntil: "" });

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchAdminUserActivity({
        q: search || undefined,
        status: statusFilter,
        role: roleFilter,
      });
      setUsers(data || []);
      if (!selectedUserId && data?.length) {
        setSelectedUserId(data[0]._id);
      }
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not load user activity");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!selectedUserId) return;
    fetchUserActivityDetails(selectedUserId)
      .then((data) => {
        setSelectedDetails(data);
        setStatusForm({
          status: data.user?.accountStatus || "active",
          reason: data.user?.statusReason || "",
          suspendedUntil: data.user?.suspendedUntil
            ? new Date(data.user.suspendedUntil).toISOString().slice(0, 16)
            : "",
        });
      })
      .catch(() => {});
  }, [selectedUserId]);

  const handleApplyFilter = async () => {
    await load();
  };

  const handleStatusUpdate = async () => {
    if (!selectedUserId) return;
    try {
      setSaving(true);
      await updateUserAccountStatus(selectedUserId, {
        status: statusForm.status,
        reason: statusForm.reason,
        suspendedUntil: statusForm.status === "suspended" ? statusForm.suspendedUntil || null : null,
      });
      await load();
      const refreshed = await fetchUserActivityDetails(selectedUserId);
      setSelectedDetails(refreshed);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not update user status");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ad-page">
      <div className="ad-header">
        <div>
          <h2 className="ad-header-title">User Activity & Access Control</h2>
          <p className="ad-header-sub">Track user activity and manage active / suspended / blocked status.</p>
        </div>
      </div>

      {error && <p className="gd-error">{error}</p>}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="gd-input-row">
          <input
            className="gd-input"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="gd-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="blocked">Blocked</option>
          </select>
          <select className="gd-input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
            <option value="vendor">Vendor</option>
          </select>
          <button className="gd-btn-add" onClick={handleApplyFilter}>Filter</button>
        </div>
      </div>

      <div className="ad-grid">
        <div className="ad-col">
          <div className="card">
            {loading ? (
              <p>Loading users...</p>
            ) : (
              <table className="simple-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Activity</th>
                    <th>Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user._id}
                      style={{ cursor: "pointer", background: selectedUserId === user._id ? "#f8fafc" : "transparent" }}
                      onClick={() => setSelectedUserId(user._id)}
                    >
                      <td>
                        <strong>{user.name}</strong>
                        <div style={{ fontSize: 12, opacity: 0.8 }}>{user.email}</div>
                      </td>
                      <td>{user.role}</td>
                      <td>{user.accountStatus || (user.isActive ? "active" : "blocked")}</td>
                      <td>{user.lastActivityAt ? new Date(user.lastActivityAt).toLocaleString() : "No activity"}</td>
                      <td>
                        O:{user.activityCounts?.orders || 0} · W:{user.activityCounts?.walletTransactions || 0} · C:{user.activityCounts?.complaints || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="ad-col ad-col--side">
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Selected User Controls</h3>
            {selectedDetails?.user ? (
              <>
                <p style={{ marginBottom: 8 }}>
                  <strong>{selectedDetails.user.name}</strong> ({selectedDetails.user.email})
                </p>
                <div className="gd-input-row">
                  <select
                    className="gd-input"
                    value={statusForm.status}
                    onChange={(e) => setStatusForm((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                {statusForm.status === "suspended" && (
                  <div className="gd-input-row" style={{ marginTop: 8 }}>
                    <input
                      className="gd-input"
                      type="datetime-local"
                      value={statusForm.suspendedUntil}
                      onChange={(e) => setStatusForm((prev) => ({ ...prev, suspendedUntil: e.target.value }))}
                    />
                  </div>
                )}
                <div className="gd-input-row" style={{ marginTop: 8 }}>
                  <input
                    className="gd-input"
                    placeholder="Reason for status change"
                    value={statusForm.reason}
                    onChange={(e) => setStatusForm((prev) => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
                <button className="gd-btn-add" style={{ marginTop: 8 }} disabled={saving} onClick={handleStatusUpdate}>
                  {saving ? "Updating..." : "Update Status"}
                </button>
              </>
            ) : (
              <p>Select a user to manage status.</p>
            )}
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <h3 style={{ marginTop: 0 }}>Recent Activity Timeline</h3>
            {selectedDetails?.recentActivities?.length ? (
              <div style={{ display: "grid", gap: 8 }}>
                {selectedDetails.recentActivities.map((entry, index) => (
                  <div key={`${entry.type}-${index}`} style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}>
                    <div style={{ fontWeight: 600 }}>{entry.title}</div>
                    <div style={{ fontSize: 13, opacity: 0.8 }}>{entry.meta}</div>
                    <div style={{ fontSize: 12, opacity: 0.6 }}>{new Date(entry.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserActivityPage;

