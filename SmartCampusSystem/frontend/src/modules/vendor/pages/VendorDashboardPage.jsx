import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { fetchVendorDashboardStats } from "../services/vendorService";

const VendorDashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalMenuItems: 0,
    incomingOrders: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchVendorDashboardStats().then(setStats).catch(() => {});
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="vd-page">
      {/* ── Header ── */}
      <div className="vd-header">
        <div className="vd-header-left">
          <h2 className="vd-header-title">
            {greeting()}, {user?.name?.split(" ")[0] || "Owner"} 👋
          </h2>
          <p className="vd-header-sub">Canteen Owner Dashboard · Overview</p>
        </div>
        <Link to="/vendor/menu" className="vd-header-btn">+ Add Food Item</Link>
      </div>

      {/* ── KPI cards ── */}
      <div className="vd-kpi-row">
        <div className="vd-kpi vd-kpi--menu">
          <div className="vd-kpi-icon">🍽️</div>
          <div className="vd-kpi-body">
            <span className="vd-kpi-value">{stats.totalMenuItems}</span>
            <span className="vd-kpi-label">Menu Items</span>
          </div>
        </div>
        <div className="vd-kpi vd-kpi--orders">
          <div className="vd-kpi-icon">📦</div>
          <div className="vd-kpi-body">
            <span className="vd-kpi-value">{stats.incomingOrders}</span>
            <span className="vd-kpi-label">Active Orders</span>
          </div>
        </div>
        <div className="vd-kpi vd-kpi--revenue">
          <div className="vd-kpi-icon">💰</div>
          <div className="vd-kpi-body">
            <span className="vd-kpi-value">Rs. {stats.totalRevenue.toLocaleString()}</span>
            <span className="vd-kpi-label">Total Revenue</span>
          </div>
        </div>
      </div>

      {/* ── Main dashboard grid ── */}
      <div className="vd-grid">
        {/* Left column */}
        <div className="vd-col">
          {/* Quick Actions */}
          <div className="vd-card">
            <h3 className="vd-card-title">⚡ Quick Actions</h3>
            <div className="vd-actions">
              <Link to="/vendor/menu" className="vd-action">
                <span className="vd-action-icon">📝</span>
                <div className="vd-action-text">
                  <span className="vd-action-name">Manage Menu</span>
                  <span className="vd-action-desc">Add, edit, or disable items</span>
                </div>
                <span className="vd-action-arrow">→</span>
              </Link>
              <Link to="/vendor/orders" className="vd-action">
                <span className="vd-action-icon">📦</span>
                <div className="vd-action-text">
                  <span className="vd-action-name">Incoming Orders</span>
                  <span className="vd-action-desc">View and update order status</span>
                </div>
                <span className="vd-action-arrow">→</span>
              </Link>
              <Link to="/vendor/revenue" className="vd-action">
                <span className="vd-action-icon">📊</span>
                <div className="vd-action-text">
                  <span className="vd-action-name">Revenue Summary</span>
                  <span className="vd-action-desc">Monthly earnings breakdown</span>
                </div>
                <span className="vd-action-arrow">→</span>
              </Link>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="vd-card">
            <div className="vd-card-head">
              <h3 className="vd-card-title">📋 Recent Orders</h3>
              <Link to="/vendor/orders" className="vd-card-link">View all →</Link>
            </div>
            {stats.incomingOrders > 0 ? (
              <div className="vd-placeholder-box">
                <span className="vd-placeholder-icon">📦</span>
                <p className="vd-placeholder-text">
                  You have <strong>{stats.incomingOrders}</strong> active order{stats.incomingOrders !== 1 ? "s" : ""} waiting
                </p>
                <Link to="/vendor/orders" className="vd-placeholder-btn">Go to Orders</Link>
              </div>
            ) : (
              <div className="vd-placeholder-box">
                <span className="vd-placeholder-icon">✨</span>
                <p className="vd-placeholder-text">No active orders right now. Enjoy the break!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="vd-col">
          {/* Menu Overview */}
          <div className="vd-card">
            <div className="vd-card-head">
              <h3 className="vd-card-title">🍔 Menu Overview</h3>
              <Link to="/vendor/menu" className="vd-card-link">Manage →</Link>
            </div>
            <div className="vd-placeholder-box">
              <span className="vd-placeholder-icon">🍽️</span>
              <p className="vd-placeholder-text">
                {stats.totalMenuItems > 0
                  ? <><strong>{stats.totalMenuItems}</strong> item{stats.totalMenuItems !== 1 ? "s" : ""} on your menu</>
                  : "Your menu is empty. Add your first item!"}
              </p>
              <Link to="/vendor/menu" className="vd-placeholder-btn">
                {stats.totalMenuItems > 0 ? "Edit Menu" : "+ Add First Item"}
              </Link>
            </div>
          </div>

          {/* Revenue Summary */}
          <div className="vd-card">
            <div className="vd-card-head">
              <h3 className="vd-card-title">💰 Revenue</h3>
              <Link to="/vendor/revenue" className="vd-card-link">Details →</Link>
            </div>
            <div className="vd-revenue-highlight">
              <span className="vd-revenue-amount">Rs. {stats.totalRevenue.toLocaleString()}</span>
              <span className="vd-revenue-label">Total Earnings</span>
            </div>
          </div>

          {/* Tips */}
          <div className="vd-card vd-card--tips">
            <h3 className="vd-card-title">💡 Quick Tips</h3>
            <ul className="vd-tips-list">
              <li className="vd-tip">Keep your menu updated with accurate prices and availability</li>
              <li className="vd-tip">Process orders promptly to maintain good ratings</li>
              <li className="vd-tip">Check your revenue summary weekly to track performance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboardPage;
