import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { fetchAdminDashboardStats, fetchAdminOrders, fetchCanteenMenu } from "../services/adminService";

const STATUS_STYLE = {
  placed:    { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  accepted:  { bg: "#ecfdf5", color: "#15803d", border: "#a7f3d0" },
  preparing: { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
  ready:     { bg: "#f0fdf4", color: "#166534", border: "#86efac" },
  completed: { bg: "#f0f4ec", color: "#475569", border: "#e0e8df" },
  cancelled: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
};

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(true);

  const isCanteenOwner = Boolean(user?.canteenKey);
  const isSuperAdmin = user?.role === "admin" && !isCanteenOwner;

  useEffect(() => {
    fetchAdminDashboardStats().then(setStats).catch(() => {});

    if (isCanteenOwner) {
      fetchAdminOrders()
        .then((o) => setOrders(o || []))
        .catch(() => {})
        .finally(() => setLoadingOrders(false));

      fetchCanteenMenu()
        .then((m) => setMenuItems(m || []))
        .catch(() => {})
        .finally(() => setLoadingMenu(false));
    }
  }, []);

  if (isSuperAdmin) {
    return (
      <div className="ad-page">
        <div className="ad-header">
          <div>
            <h2 className="ad-header-title">Welcome, {user?.name?.split(" ")[0] || "Admin"}</h2>
            <p className="ad-header-sub">Platform Overview</p>
          </div>
        </div>

        <div className="ad-kpi-row">
          <div className="ad-kpi">
            <div className="ad-kpi-icon ad-kpi-icon--green">👥</div>
            <div className="ad-kpi-body">
              <span className="ad-kpi-value">{stats?.totalUsers ?? 0}</span>
              <span className="ad-kpi-label">Total Users</span>
            </div>
          </div>
          <div className="ad-kpi">
            <div className="ad-kpi-icon ad-kpi-icon--blue">📦</div>
            <div className="ad-kpi-body">
              <span className="ad-kpi-value">{stats?.totalOrders ?? 0}</span>
              <span className="ad-kpi-label">Total Orders</span>
            </div>
          </div>
          <div className="ad-kpi">
            <div className="ad-kpi-icon ad-kpi-icon--amber">⚠️</div>
            <div className="ad-kpi-body">
              <span className="ad-kpi-value">{stats?.openComplaints ?? 0}</span>
              <span className="ad-kpi-label">Open Complaints</span>
            </div>
          </div>
          <div className="ad-kpi">
            <div className="ad-kpi-icon ad-kpi-icon--emerald">🍱</div>
            <div className="ad-kpi-body">
              <span className="ad-kpi-value">{stats?.sharedFoodPosts ?? 0}</span>
              <span className="ad-kpi-label">Available Food Shares</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isCanteenOwner) {
    return (
      <div className="ad-page">
        <div className="ad-empty-state">
          <span className="ad-empty-icon">⚠️</span>
          <p>This account is not mapped to a canteen. Please contact support.</p>
        </div>
      </div>
    );
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const pendingOrders = orders.filter((o) => ["placed", "accepted", "preparing"].includes(o.status));
  const recentOrders = orders.slice(0, 6);
  const recentMenu = menuItems.slice(0, 5);
  const disabledItems = menuItems.filter((m) => !m.isAvailable);

  const menuCount = stats?.menuItems ?? 0;
  const totalOrders = stats?.totalOrders ?? 0;
  const totalRevenue = stats?.totalRevenue ?? 0;

  return (
    <div className="ad-page">
      {/* Header */}
      <div className="ad-header">
        <div>
          <h2 className="ad-header-title">{greeting()}, {user?.name?.split(" ")[0] || "Admin"} 👋</h2>
          <p className="ad-header-sub">Canteen Operations Dashboard · {user?.canteenLabel || "Overview"}</p>
        </div>
        <Link to="/admin/menu" className="ad-header-btn">+ Add Food Item</Link>
      </div>

      {/* KPI row */}
      <div className="ad-kpi-row">
        <div className="ad-kpi">
          <div className="ad-kpi-icon ad-kpi-icon--green">🍽️</div>
          <div className="ad-kpi-body">
            <span className="ad-kpi-value">{menuCount}</span>
            <span className="ad-kpi-label">Menu Items</span>
          </div>
        </div>
        <div className="ad-kpi">
          <div className="ad-kpi-icon ad-kpi-icon--blue">📦</div>
          <div className="ad-kpi-body">
            <span className="ad-kpi-value">{totalOrders}</span>
            <span className="ad-kpi-label">Total Orders</span>
          </div>
        </div>
        <div className="ad-kpi">
          <div className="ad-kpi-icon ad-kpi-icon--emerald">💰</div>
          <div className="ad-kpi-body">
            <span className="ad-kpi-value">Rs. {totalRevenue.toLocaleString()}</span>
            <span className="ad-kpi-label">Total Revenue</span>
          </div>
        </div>
        <div className="ad-kpi">
          <div className="ad-kpi-icon ad-kpi-icon--amber">⏳</div>
          <div className="ad-kpi-body">
            <span className="ad-kpi-value">{pendingOrders.length}</span>
            <span className="ad-kpi-label">Pending Orders</span>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="ad-grid">
        {/* Left column */}
        <div className="ad-col">

          {/* Recent Orders */}
          <div className="ad-card">
            <div className="ad-card-head">
              <h3 className="ad-card-title">📋 Recent Orders</h3>
              <Link to="/admin/orders" className="ad-card-link">View All →</Link>
            </div>
            {loadingOrders ? (
              <p className="ad-loading-text">Loading orders…</p>
            ) : recentOrders.length > 0 ? (
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Student</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o) => {
                      const st = STATUS_STYLE[o.status] || STATUS_STYLE.placed;
                      return (
                        <tr key={o._id}>
                          <td className="ad-table-code">{o.orderCode || o._id?.slice(-6)}</td>
                          <td>{o.user?.name || "—"}</td>
                          <td className="ad-table-amount">Rs. {o.totalAmount}</td>
                          <td>
                            <span className="ad-status-pill" style={{ background: st.bg, color: st.color, borderColor: st.border }}>{o.status}</span>
                          </td>
                          <td>
                            <Link to={`/admin/orders/${o._id}`} className="ad-table-action">View</Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="ad-empty-box">
                <span className="ad-empty-box-icon">📦</span>
                <p>No orders yet</p>
              </div>
            )}
          </div>

          {/* Menu Overview */}
          <div className="ad-card">
            <div className="ad-card-head">
              <h3 className="ad-card-title">🍔 Menu Overview</h3>
              <Link to="/admin/menu" className="ad-card-link">Manage Menu →</Link>
            </div>
            {loadingMenu ? (
              <p className="ad-loading-text">Loading menu…</p>
            ) : recentMenu.length > 0 ? (
              <div className="ad-menu-list">
                {recentMenu.map((item) => (
                  <div key={item._id} className="ad-menu-row">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="ad-menu-img" />
                    ) : (
                      <div className="ad-menu-img-placeholder">🍽️</div>
                    )}
                    <div className="ad-menu-info">
                      <span className="ad-menu-name">{item.name}</span>
                      <span className="ad-menu-price">Rs. {item.price}</span>
                    </div>
                    <span
                      className="ad-menu-status"
                      style={{
                        background: item.isAvailable ? "#f0fdf4" : "#fffbeb",
                        color: item.isAvailable ? "#16a34a" : "#d97706",
                        borderColor: item.isAvailable ? "#bbf7d0" : "#fde68a",
                      }}
                    >
                      {item.isAvailable ? "Available" : "Disabled"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ad-empty-box">
                <span className="ad-empty-box-icon">🍽️</span>
                <p>No menu items yet</p>
                <Link to="/admin/menu" className="ad-empty-box-btn">+ Add First Item</Link>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="ad-col ad-col--side">

          {/* Quick Actions */}
          <div className="ad-card">
            <h3 className="ad-card-title" style={{ marginBottom: "0.75rem" }}>⚡ Quick Actions</h3>
            <div className="ad-quick-actions">
              <Link to="/admin/menu" className="ad-qa">
                <span className="ad-qa-icon">➕</span>
                <span className="ad-qa-label">Add Food Item</span>
              </Link>
              <Link to="/admin/menu" className="ad-qa">
                <span className="ad-qa-icon">📝</span>
                <span className="ad-qa-label">Manage Menu</span>
              </Link>
              <Link to="/admin/orders" className="ad-qa">
                <span className="ad-qa-icon">📦</span>
                <span className="ad-qa-label">View Orders</span>
              </Link>
              <Link to="/admin/orders" className="ad-qa">
                <span className="ad-qa-icon">🔑</span>
                <span className="ad-qa-label">Verify Order</span>
              </Link>
            </div>
          </div>

          {/* Alerts */}
          <div className="ad-card ad-card--alerts">
            <h3 className="ad-card-title" style={{ marginBottom: "0.75rem" }}>🔔 Needs Attention</h3>
            <div className="ad-alerts-list">
              {pendingOrders.length > 0 && (
                <div className="ad-alert-row ad-alert-row--warn">
                  <span className="ad-alert-icon">📦</span>
                  <div className="ad-alert-text">
                    <span className="ad-alert-title">{pendingOrders.length} Pending Order{pendingOrders.length !== 1 ? "s" : ""}</span>
                    <span className="ad-alert-desc">Orders waiting to be processed</span>
                  </div>
                  <Link to="/admin/orders" className="ad-alert-action">View</Link>
                </div>
              )}
              {disabledItems.length > 0 && (
                <div className="ad-alert-row ad-alert-row--info">
                  <span className="ad-alert-icon">⚠️</span>
                  <div className="ad-alert-text">
                    <span className="ad-alert-title">{disabledItems.length} Disabled Item{disabledItems.length !== 1 ? "s" : ""}</span>
                    <span className="ad-alert-desc">Menu items currently unavailable</span>
                  </div>
                  <Link to="/admin/menu" className="ad-alert-action">Fix</Link>
                </div>
              )}
              {pendingOrders.length === 0 && disabledItems.length === 0 && (
                <div className="ad-alert-empty">
                  <span>✅</span>
                  <p>All clear! No issues need attention.</p>
                </div>
              )}
            </div>
          </div>

          {/* Revenue Summary */}
          <div className="ad-card">
            <h3 className="ad-card-title" style={{ marginBottom: "0.75rem" }}>💰 Revenue Summary</h3>
            <div className="ad-revenue-box">
              <span className="ad-revenue-amount">Rs. {totalRevenue.toLocaleString()}</span>
              <span className="ad-revenue-label">Total Earnings</span>
            </div>
            <div className="ad-revenue-stats">
              <div className="ad-revenue-stat">
                <span className="ad-revenue-stat-val">{totalOrders}</span>
                <span className="ad-revenue-stat-lbl">Orders</span>
              </div>
              <div className="ad-revenue-stat">
                <span className="ad-revenue-stat-val">Rs. {totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0}</span>
                <span className="ad-revenue-stat-lbl">Avg. Order</span>
              </div>
              <div className="ad-revenue-stat">
                <span className="ad-revenue-stat-val">{menuCount}</span>
                <span className="ad-revenue-stat-lbl">Items</span>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="ad-card ad-card--tips">
            <h3 className="ad-card-title" style={{ marginBottom: "0.6rem" }}>💡 Admin Tips</h3>
            <ul className="ad-tips">
              <li className="ad-tip">Process pending orders quickly for better student experience</li>
              <li className="ad-tip">Keep menu availability updated to avoid confusion</li>
              <li className="ad-tip">Use order verification codes for secure delivery</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
