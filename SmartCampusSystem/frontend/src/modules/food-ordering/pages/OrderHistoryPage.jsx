import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import OrderStatusBadge from "../components/OrderStatusBadge";
import { fetchOrderHistory } from "../services/foodOrderingService";

const getQueueStatus = (status) => {
  if (status === "ready" || status === "completed") {
    return { label: "Ready", className: "oh-queue-badge oh-queue-badge--ready" };
  }
  if (status === "cancelled") {
    return { label: "Cancelled", className: "oh-queue-badge oh-queue-badge--cancelled" };
  }
  return { label: "In Process", className: "oh-queue-badge oh-queue-badge--processing" };
};

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrderHistory()
      .then((data) => setOrders(data))
      .catch((apiError) => setError(apiError.response?.data?.message || "Could not load order history"));
  }, []);

  return (
    <div className="oh-page">
      <div className="oh-header">
        <h2>Food Order History</h2>
        <p>All your orders with code, food details, and preparation status.</p>
      </div>

      {error && <p className="oh-error">{error}</p>}

      {orders.length === 0 ? (
        <div className="oh-empty">
          <h3>No orders yet</h3>
          <p>Your placed food orders will appear here.</p>
        </div>
      ) : (
        <div className="oh-grid">
          {orders.map((order) => (
            <article key={order._id} className="oh-card">
              <div className="oh-card-top">
                <div>
                  <p className="oh-card-id">Order ID: {order._id}</p>
                  {order.orderCode && (
                    <p className="oh-code-row">
                      Order Code: <strong className="oc-inline-code">{order.orderCode}</strong>
                    </p>
                  )}
                </div>
                <span className={getQueueStatus(order.status).className}>
                  {getQueueStatus(order.status).label}
                </span>
              </div>

              <div className="oh-meta">
                <div className="oh-meta-item">
                  <span className="oh-meta-label">Placed On</span>
                  <span className="oh-meta-value">{new Date(order.createdAt).toLocaleString()}</span>
                </div>
                <div className="oh-meta-item">
                  <span className="oh-meta-label">Total</span>
                  <span className="oh-meta-value">Rs. {order.totalAmount}</span>
                </div>
                <div className="oh-meta-item">
                  <span className="oh-meta-label">Current Status</span>
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>

              <div className="oh-items">
                <h4>Food Details</h4>
                {order.items?.length ? (
                  <div className="oh-items-list">
                    {order.items.map((item, index) => (
                      <div key={`${order._id}-item-${index}`} className="oh-item-row">
                        <span className="oh-item-name">{item.name}</span>
                        <span className="oh-item-qty">x{item.quantity}</span>
                        <span className="oh-item-price">Rs. {item.lineTotal}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="oh-items-empty">Food item details not available.</p>
                )}
              </div>

              <div className="oh-actions">
                <Link to={`/student/orders/${order._id}`} className="oh-track-btn">
                  View full tracking
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;
