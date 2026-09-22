import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import OrderStatusBadge from "../components/OrderStatusBadge";
import { fetchOrderById } from "../services/foodOrderingService";
import {
  fetchWallet,
  payOrderFromWalletWithPoints,
  refundCancelledOrder,
  sanitizeRewardPointsInput,
} from "../../wallet/services/walletService";

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [wallet, setWallet] = useState({ rewardPoints: 0 });
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [useRewardPoints, setUseRewardPoints] = useState("");

  useEffect(() => {
    Promise.all([fetchOrderById(orderId), fetchWallet()])
      .then(([orderData, walletData]) => {
        setOrder(orderData);
        setWallet(walletData || { rewardPoints: 0 });
      })
      .catch((apiError) => setError(apiError.response?.data?.message || "Could not load order"));
  }, [orderId]);

  if (!order) {
    return (
      <div className="ot-loading">
        {error ? (
          <>
            <span className="ot-loading-icon">⚠️</span>
            <p className="ot-loading-error">{error}</p>
          </>
        ) : (
          <>
            <span className="ot-loading-icon">📦</span>
            <p>Loading order...</p>
          </>
        )}
      </div>
    );
  }

  const availableRewardPoints = Number(wallet?.rewardPoints || 0);
  const normalizedRewardPoints = sanitizeRewardPointsInput(useRewardPoints, availableRewardPoints);
  const rewardPointsTooHigh = Number(useRewardPoints || 0) > availableRewardPoints;

  const handlePay = async () => {
    setPaying(true);
    setError("");
    try {
      const points = sanitizeRewardPointsInput(useRewardPoints, availableRewardPoints);
      if (points > availableRewardPoints) {
        setError(`You can use up to ${availableRewardPoints} reward points for this order.`);
        return;
      }
      await payOrderFromWalletWithPoints(order._id, { useRewardPoints: points });
      setUseRewardPoints("");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not pay for this order");
    } finally {
      setPaying(false);
    }
  };

  const handleRefund = async () => {
    setRefunding(true);
    setError("");
    try {
      await refundCancelledOrder(order._id);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not process refund");
    } finally {
      setRefunding(false);
    }
  };

  const STATUS_ICONS = {
    placed: "📝",
    accepted: "✅",
    preparing: "👨‍🍳",
    ready: "🔔",
    completed: "🎉",
    cancelled: "❌",
  };

  return (
    <div className="ot-page">
      <h2 className="ot-page-title">
        <span>📦</span> Order Status Tracking
      </h2>
      {location.state?.smsWarning && <div className="ot-alert">{location.state.smsWarning}</div>}

      {/* ── Order Code Hero ── */}
      {order.orderCode && (
        <div className="ot-code-hero">
          <div className="ot-code-hero-bg" />
          <div className="ot-code-content">
            <span className="ot-code-label">YOUR ORDER CODE</span>
            <div className="ot-code-digits">
              {order.orderCode.split("").map((d, i) => (
                <span key={i} className="ot-code-digit">{d}</span>
              ))}
            </div>
            <span className="ot-code-hint">
              🏪 Show this code at the canteen to collect your order
            </span>
          </div>
        </div>
      )}

      {/* ── Order Details Card ── */}
      <div className="ot-card">
        <h3 className="ot-card-title">
          <span>📋</span> Order Details
        </h3>

        <div className="ot-details-grid">
          <div className="ot-detail-block">
            <span className="ot-detail-label">Status</span>
            <OrderStatusBadge status={order.status} />
          </div>

          <div className="ot-detail-block">
            <span className="ot-detail-label">Total</span>
            <span className="ot-detail-value ot-detail-value--total">Rs. {order.totalAmount}</span>
          </div>

          <div className="ot-detail-block">
            <span className="ot-detail-label">Payment</span>
            <span className="ot-detail-value">
              {order.paymentMethod === "wallet" ? "💳 Wallet" : "💵 Cash on Delivery"}
            </span>
          </div>

          <div className="ot-detail-block">
            <span className="ot-detail-label">Payment Status</span>
            {order.status === "cancelled" ? (
              <button className="ot-refund-btn" onClick={handleRefund} disabled={refunding}>
                {refunding ? "Processing refund..." : "Refund Wallet"}
              </button>
            ) : order.paymentStatus !== "paid" ? (
              <div className="ot-pay-section">
                <input
                  type="number"
                  min={0}
                  max={availableRewardPoints}
                  placeholder="Use reward points (optional)"
                  value={useRewardPoints}
                  onChange={(e) => {
                    if (e.target.value === "") {
                      setUseRewardPoints("");
                      return;
                    }
                    const nextValue = sanitizeRewardPointsInput(e.target.value, availableRewardPoints);
                    setUseRewardPoints(String(nextValue));
                  }}
                  className="ot-reward-input"
                />
                <small className="ot-detail-hint">Available: {availableRewardPoints} pts</small>
                <button
                  className="ot-pay-btn"
                  onClick={handlePay}
                  disabled={paying || rewardPointsTooHigh}
                >
                  {paying ? "Processing..." : "Pay with Wallet"}
                </button>
              </div>
            ) : (
              <span className="ot-paid-badge">✅ Payment completed</span>
            )}
          </div>
        </div>

        {error && <div className="ot-alert">{error}</div>}

        {/* Items */}
        <div className="ot-items-section">
          <h4 className="ot-items-title">
            <span>🍽️</span> Items
          </h4>
          <div className="ot-items-list">
            {order.items.map((item) => (
              <div key={item.foodItem} className="ot-item-row">
                <div className="ot-item-left">
                  <span className="ot-item-dot" />
                  <span className="ot-item-name">{item.name}</span>
                  <span className="ot-item-qty">×{item.quantity}</span>
                </div>
                <span className="ot-item-price">Rs. {item.lineTotal}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Timeline Card ── */}
      <div className="ot-card">
        <h3 className="ot-card-title">
          <span>🕐</span> Status Timeline
        </h3>

        <div className="ot-timeline">
          {order.statusHistory.map((entry, index) => {
            const isLast = index === order.statusHistory.length - 1;
            return (
              <div key={`${entry.status}-${index}`} className={`ot-tl-step ${isLast ? "ot-tl-step--active" : ""}`}>
                <div className="ot-tl-indicator">
                  <div className={`ot-tl-dot ${isLast ? "ot-tl-dot--active" : ""}`}>
                    {STATUS_ICONS[entry.status] || "•"}
                  </div>
                  {!isLast && <div className="ot-tl-line" />}
                </div>
                <div className="ot-tl-content">
                  <span className="ot-tl-status">{entry.status}</span>
                  <span className="ot-tl-time">{new Date(entry.changedAt).toLocaleString()}</span>
                  {entry.note && <span className="ot-tl-note">{entry.note}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;


