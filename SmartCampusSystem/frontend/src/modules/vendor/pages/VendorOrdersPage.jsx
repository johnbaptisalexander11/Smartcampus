import { useEffect, useState } from "react";
import { fetchVendorOrders, updateVendorOrderStatus } from "../services/vendorService";
import { verifyOrderCode, markOrderDelivered } from "../../food-ordering/services/foodOrderingService";

const VendorOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [codeInput, setCodeInput] = useState("");
  const [verifiedOrder, setVerifiedOrder] = useState(null);
  const [codeError, setCodeError] = useState("");
  const [delivering, setDelivering] = useState(false);

  const load = () => fetchVendorOrders().then(setOrders).catch(() => {});
  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (orderId, status) => {
    await updateVendorOrderStatus(orderId, { status });
    await load();
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
      <h2>Manage Incoming Orders</h2>

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

      <div className="row-gap" style={{ marginTop: 16 }}>
        {orders.map((order) => (
          <div key={order._id} className="card">
            {order.orderCode && <p><strong>Code: {order.orderCode}</strong></p>}
            <p>Order: {order._id}</p>
            <p>User: {order.user?.name || "-"}</p>
            <p>Total: Rs. {order.totalAmount}</p>
            <p>Status: {order.status}</p>
            <select value={order.status} onChange={(event) => updateStatus(order._id, event.target.value)}>
              <option value="placed">placed</option>
              <option value="accepted">accepted</option>
              <option value="preparing">preparing</option>
              <option value="ready">ready</option>
              <option value="completed">completed</option>
              <option value="cancelled">cancelled</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VendorOrdersPage;
