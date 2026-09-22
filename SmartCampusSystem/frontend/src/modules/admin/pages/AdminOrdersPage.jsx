import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAdminOrders } from "../services/adminService";
import { updateOrderStatus, verifyOrderCode, markOrderDelivered } from "../../food-ordering/services/foodOrderingService";

const STATUS_OPTIONS = ["accepted", "preparing", "ready", "completed", "cancelled"];

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [codeInput, setCodeInput] = useState("");
  const [verifiedOrder, setVerifiedOrder] = useState(null);
  const [codeError, setCodeError] = useState("");
  const [delivering, setDelivering] = useState(false);

  const load = () => fetchAdminOrders().then(setOrders).catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const handleStatusChange = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, { status, note: `Set to ${status}` });
      await load();
    } catch {
      // ignore
    } finally {
      setUpdatingId(null);
    }
  };

  const handleVerifyCode = async () => {
    if (!codeInput.trim()) return;
    setCodeError("");
    setVerifiedOrder(null);
    try {
      const order = await verifyOrderCode(codeInput.trim());
      setVerifiedOrder(order);
    } catch (err) {
      setCodeError(err.response?.data?.message || "Invalid Order Code");
    }
  };

  const handleMarkDelivered = async () => {
    if (!verifiedOrder) return;
    setDelivering(true);
    try {
      const updated = await markOrderDelivered(verifiedOrder.orderCode);
      setVerifiedOrder(updated);
      await load();
    } catch (err) {
      setCodeError(err.response?.data?.message || "Could not mark as delivered");
    } finally {
      setDelivering(false);
    }
  };

  return (
    <div>
      <h2>Orders</h2>

      {/* Order Code Verification */}
      <div className="oc-verify-card">
        <h3 className="oc-verify-title">Verify Order Code</h3>
        <p className="oc-verify-subtitle">Enter the student's order code to verify and deliver</p>
        <div className="oc-verify-row">
          <input
            type="text"
            className="oc-verify-input"
            placeholder="Enter 5-digit order code"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            maxLength={6}
            onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
          />
          <button className="oc-verify-btn" onClick={handleVerifyCode}>Verify</button>
        </div>

        {codeError && <p className="oc-verify-error">{codeError}</p>}

        {verifiedOrder && (
          <div className="oc-verify-result">
            <div className="oc-verify-result-header">
              <span className="oc-verify-check">&#10003;</span>
              <span>Order Found — Code: <strong>{verifiedOrder.orderCode}</strong></span>
            </div>
            <p><strong>Student:</strong> {verifiedOrder.user?.name || "-"} ({verifiedOrder.user?.phone || "no phone"})</p>
            <p><strong>Total:</strong> Rs. {verifiedOrder.totalAmount}</p>
            <p><strong>Status:</strong> {verifiedOrder.status}</p>
            <p><strong>Items:</strong></p>
            <ul className="oc-verify-items">
              {verifiedOrder.items.map((item, i) => (
                <li key={i}>{item.name} x {item.quantity} = Rs. {item.lineTotal}</li>
              ))}
            </ul>
            {verifiedOrder.status !== "completed" && verifiedOrder.status !== "cancelled" && (
              <button className="oc-deliver-btn" onClick={handleMarkDelivered} disabled={delivering}>
                {delivering ? "Processing..." : "Mark as Delivered"}
              </button>
            )}
            {verifiedOrder.status === "completed" && (
              <p className="oc-delivered-badge">Already Delivered</p>
            )}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <table className="simple-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>User</th>
              <th>Canteen</th>
              <th>Total</th>
              <th>Status</th>
              <th>Details</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td><strong>{order.orderCode || "-"}</strong></td>
                <td>{order.user?.name || "-"}</td>
                <td>{order.canteen}</td>
                <td>Rs. {order.totalAmount}</td>
                <td>{order.status}</td>
                <td>
                  <Link to={`/admin/orders/${order._id}`}>View</Link>
                </td>
                <td>
                  <select
                    value=""
                    disabled={updatingId === order._id}
                    onChange={(e) => {
                      const next = e.target.value;
                      if (next) handleStatusChange(order._id, next);
                      e.target.value = "";
                    }}
                    aria-label={`Update status for order ${order._id}`}
                  >
                    <option value="">Set status…</option>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrdersPage;
