import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchOrderById, updateOrderStatus } from "../../food-ordering/services/foodOrderingService";

const STATUS_OPTIONS = ["accepted", "preparing", "ready", "completed", "cancelled"];

const STATUS_STYLE = {
  placed:    { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", icon: "📝" },
  accepted:  { bg: "#ecfdf5", color: "#15803d", border: "#a7f3d0", icon: "✅" },
  preparing: { bg: "#fffbeb", color: "#d97706", border: "#fde68a", icon: "👨‍🍳" },
  ready:     { bg: "#f0fdf4", color: "#166534", border: "#86efac", icon: "🔔" },
  completed: { bg: "#f0f4ec", color: "#475569", border: "#e0e8df", icon: "🎉" },
  cancelled: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", icon: "❌" },
};

const fmt = (v) => (v === null || v === undefined || v === "" ? "—" : String(v));

const AdminOrderDetailsPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    setError("");
    try {
      const data = await fetchOrderById(orderId);
      setOrder(data);
    } catch (e) {
      setError(e.response?.data?.message || "Could not load order");
      setOrder(null);
    }
  };

  useEffect(() => { load(); }, [orderId]);

  const handleStatusChange = async (status) => {
    if (!status) return;
    setUpdating(true);
    try {
      await updateOrderStatus(orderId, { status, note: `Set to ${status}` });
      await load();
    } catch {
      setError("Could not update status");
    } finally {
      setUpdating(false);
    }
  };

  if (error && !order) {
    return (
      <div className="od-page">
        <div className="od-error-state">
          <span className="od-error-icon">⚠️</span>
          <p className="od-error-msg">{error}</p>
          <Link to="/admin/orders" className="od-back-link">← Back to orders</Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="od-page">
        <div className="od-error-state">
          <span className="od-error-icon">📦</span>
          <p className="od-error-msg">Loading order…</p>
        </div>
      </div>
    );
  }

  const u = order.user;
  const st = STATUS_STYLE[order.status] || STATUS_STYLE.placed;

  return (
    <div className="od-page">
      {/* Back nav */}
      <Link to="/admin/orders" className="od-back-link">← Back to orders</Link>

      {/* ── Hero header ── */}
      <div className="od-hero">
        <div className="od-hero-accent" />
        <div className="od-hero-body">
          <div className="od-hero-top">
            <div className="od-hero-left">
              <h2 className="od-hero-title">Order Details</h2>
              <span className="od-hero-id">#{order._id?.slice(-8).toUpperCase()}</span>
            </div>
            <span
              className="od-status-badge"
              style={{ background: st.bg, color: st.color, borderColor: st.border }}
            >
              {st.icon} {order.status}
            </span>
          </div>

          <div className="od-hero-meta">
            <span className="od-hero-chip">🏪 {order.canteen || "—"}</span>
            <span className="od-hero-chip">📅 {order.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}</span>
            {order.orderCode && <span className="od-hero-chip">🔑 Code: {order.orderCode}</span>}
          </div>

          <div className="od-hero-summary">
            <div className="od-summary-item">
              <span className="od-summary-label">Subtotal</span>
              <span className="od-summary-value">Rs. {order.subtotal}</span>
            </div>
            <div className="od-summary-divider" />
            <div className="od-summary-item">
              <span className="od-summary-label">Delivery</span>
              <span className="od-summary-value">Rs. {order.deliveryFee}</span>
            </div>
            <div className="od-summary-divider" />
            <div className="od-summary-item od-summary-item--total">
              <span className="od-summary-label">Total</span>
              <span className="od-summary-value">Rs. {order.totalAmount}</span>
            </div>
          </div>

          {/* Status update action */}
          <div className="od-action-bar">
            <span className="od-action-label">Update Status</span>
            <div className="od-action-controls">
              <select
                className="od-status-select"
                value=""
                disabled={updating}
                onChange={(e) => {
                  handleStatusChange(e.target.value);
                  e.target.value = "";
                }}
              >
                <option value="">Choose new status…</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              {updating && <span className="od-updating-indicator">Updating…</span>}
            </div>
          </div>
        </div>
      </div>

      {error && <p className="od-alert">{error}</p>}

      {/* ── Two-column dashboard ── */}
      <div className="od-columns">
        {/* Left column */}
        <div className="od-col-left">
          {/* Food Items */}
          <div className="od-card">
            <div className="od-card-head">
              <h3 className="od-card-title">🍽️ Ordered Items</h3>
              <span className="od-card-count">{order.items?.length || 0} items</span>
            </div>

            <div className="od-items-list">
              {(order.items || []).map((line, idx) => (
                <div key={`${order._id}-${idx}`} className="od-item-row">
                  {line.foodItem?.imageUrl ? (
                    <img src={line.foodItem.imageUrl} alt="" className="od-item-img" />
                  ) : (
                    <div className="od-item-img-placeholder">🍔</div>
                  )}
                  <div className="od-item-info">
                    <span className="od-item-name">{line.name || line.foodItem?.name || "Item"}</span>
                    <span className="od-item-meta">Qty: {line.quantity} · Rs. {line.unitPrice} each</span>
                  </div>
                  <span className="od-item-total">Rs. {line.lineTotal}</span>
                </div>
              ))}
            </div>

            <div className="od-items-footer">
              <span>Total ({order.items?.length || 0} items)</span>
              <span className="od-items-footer-total">Rs. {order.totalAmount}</span>
            </div>
          </div>

          {/* Status Timeline */}
          {order.statusHistory?.length > 0 && (
            <div className="od-card">
              <div className="od-card-head">
                <h3 className="od-card-title">🕐 Status Timeline</h3>
              </div>
              <div className="od-timeline">
                {order.statusHistory.map((h, i) => {
                  const isLast = i === order.statusHistory.length - 1;
                  const hs = STATUS_STYLE[h.status] || STATUS_STYLE.placed;
                  return (
                    <div key={i} className={`od-tl-step ${isLast ? "od-tl-step--active" : ""}`}>
                      <div className="od-tl-indicator">
                        <div
                          className={`od-tl-dot ${isLast ? "od-tl-dot--active" : ""}`}
                          style={isLast ? { background: hs.color } : {}}
                        >
                          {hs.icon}
                        </div>
                        {!isLast && <div className="od-tl-line" />}
                      </div>
                      <div className="od-tl-content">
                        <span className="od-tl-status">{h.status}</span>
                        {h.changedAt && <span className="od-tl-time">{new Date(h.changedAt).toLocaleString()}</span>}
                        {h.note && <span className="od-tl-note">{h.note}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="od-col-right">
          {/* Student Info */}
          <div className="od-card">
            <div className="od-card-head">
              <h3 className="od-card-title">🎓 Student Information</h3>
            </div>
            <div className="od-info-grid">
              <div className="od-info-row">
                <span className="od-info-label">Name</span>
                <span className="od-info-value">{u?.name ?? "—"}</span>
              </div>
              <div className="od-info-row">
                <span className="od-info-label">Email</span>
                <span className="od-info-value">{u?.email ?? "—"}</span>
              </div>
              <div className="od-info-row">
                <span className="od-info-label">Phone</span>
                <span className="od-info-value">{fmt(u?.phone)}</span>
              </div>
              <div className="od-info-row">
                <span className="od-info-label">Department</span>
                <span className="od-info-value">{fmt(u?.department)}</span>
              </div>
              <div className="od-info-row">
                <span className="od-info-label">Study Year</span>
                <span className="od-info-value">{fmt(u?.studyYear)}</span>
              </div>
              <div className="od-info-row">
                <span className="od-info-label">Semester</span>
                <span className="od-info-value">{fmt(u?.semester)}</span>
              </div>
            </div>
          </div>

          {/* Order Summary card */}
          <div className="od-card od-card--summary">
            <div className="od-card-head">
              <h3 className="od-card-title">💰 Payment Summary</h3>
            </div>
            <div className="od-pay-rows">
              <div className="od-pay-row">
                <span>Subtotal</span>
                <span>Rs. {order.subtotal}</span>
              </div>
              <div className="od-pay-row">
                <span>Delivery Fee</span>
                <span>Rs. {order.deliveryFee}</span>
              </div>
              <div className="od-pay-row od-pay-row--total">
                <span>Total</span>
                <span>Rs. {order.totalAmount}</span>
              </div>
            </div>
            <div className="od-pay-method">
              <span className="od-info-label">Payment Method</span>
              <span className="od-info-value">
                {order.paymentMethod === "wallet" ? "💳 Wallet" : "💵 Cash on Delivery"}
              </span>
            </div>
            <div className="od-pay-method">
              <span className="od-info-label">Payment Status</span>
              <span
                className="od-pay-status-badge"
                style={{
                  background: order.paymentStatus === "paid" ? "#f0fdf4" : "#fffbeb",
                  color: order.paymentStatus === "paid" ? "#16a34a" : "#d97706",
                  borderColor: order.paymentStatus === "paid" ? "#bbf7d0" : "#fde68a",
                }}
              >
                {order.paymentStatus === "paid" ? "✅ Paid" : "⏳ " + (order.paymentStatus || "Pending")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetailsPage;
