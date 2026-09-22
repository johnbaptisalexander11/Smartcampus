import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOrder, fetchCheckout } from "../services/foodOrderingService";
import { fetchWallet, payOrderFromWallet } from "../../wallet/services/walletService";
import { useAuth } from "../../../context/AuthContext";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checkoutData, setCheckoutData] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [smsPhone, setSmsPhone] = useState("");
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [smsStatus, setSmsStatus] = useState(null);

  useEffect(() => {
    fetchCheckout()
      .then((data) => setCheckoutData(data))
      .catch((apiError) =>
        setError(apiError.response?.data?.message || "Could not load checkout")
      );

    fetchWallet()
      .then((wallet) => setWalletBalance(wallet.balance))
      .catch(() => setWalletBalance(0));
  }, []);

  useEffect(() => {
    if (user?.phone) setSmsPhone(user.phone);
  }, [user]);

  const insufficientBalance =
    paymentMethod === "wallet" &&
    walletBalance !== null &&
    checkoutData &&
    walletBalance < checkoutData.totalAmount;

  const handlePlaceOrder = async () => {
    setPlacing(true);
    setError("");
    setSmsStatus(null);
    try {
      const result = await createOrder(paymentMethod, smsPhone.trim());
      const order = result.order;

      if (paymentMethod === "wallet") {
        try {
          await payOrderFromWallet(order._id);
        } catch (walletErr) {
          setError(
            walletErr.response?.data?.message ||
              "Wallet payment failed. Order created but unpaid — retry from order details."
          );
          setPlacing(false);
          return;
        }
      }

      if (!result.smsSent) {
        const warning = result.smsError
          ? `Order placed, but SMS failed: ${result.smsError}`
          : `Order placed! SMS could not be sent. Your order code: ${order.orderCode}`;
        setSmsStatus(warning);
        navigate(`/student/orders/${order._id}`, { state: { smsWarning: warning } });
        return;
      }

      navigate(`/student/orders/${order._id}`);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not place order");
    } finally {
      setPlacing(false);
    }
  };

  if (!checkoutData) {
    return (
      <div className="co-loading-state">
        {error ? (
          <>
            <div className="co-loading-icon">⚠️</div>
            <p className="co-loading-error">{error}</p>
            <button onClick={() => navigate("/student/menu")} className="co-cta-btn">
              Go to Menu
            </button>
          </>
        ) : (
          <>
            <div className="co-loading-icon">🛒</div>
            <p className="co-loading-text">Loading checkout...</p>
          </>
        )}
      </div>
    );
  }

  const cartItems = checkoutData.cart?.items || [];

  return (
    <div className="co-page">
      {/* ── Left: Order Summary ── */}
      <div className="co-card co-summary-card">
        <div className="co-card-header">
          <h2 className="co-card-title">
            <span className="co-card-title-icon">📋</span>
            Order Summary
          </h2>
          <span className="co-item-count">{cartItems.length} item{cartItems.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="co-items">
          {cartItems.map((item, idx) => (
            <div key={idx} className="co-item">
              <div className="co-item-left">
                <span className="co-item-dot" />
                <div className="co-item-info">
                  <span className="co-item-name">{item.foodItem?.name || "Item"}</span>
                  <span className="co-item-qty">×{item.quantity}</span>
                </div>
              </div>
              <span className="co-item-price">
                Rs. {item.priceAtAddTime * item.quantity}
              </span>
            </div>
          ))}
        </div>

        <div className="co-divider" />

        <div className="co-totals">
          <div className="co-totals-row">
            <span>Items</span>
            <span>Rs. {checkoutData.subtotal}</span>
          </div>
          <div className="co-totals-row">
            <span>Delivery Fee</span>
            <span>Rs. {checkoutData.deliveryFee}</span>
          </div>
          <div className="co-totals-row co-totals-row--grand">
            <span>Total Amount</span>
            <span>Rs. {checkoutData.totalAmount}</span>
          </div>
        </div>
      </div>

      {/* ── Right: Payment ── */}
      <div className="co-card co-payment-card">
        <div className="co-card-header">
          <h3 className="co-card-title">
            <span className="co-card-title-icon">💳</span>
            Payments
          </h3>
        </div>

        {/* Payment toggle */}
        <div className="co-toggle-wrap">
          <div className="co-toggle">
            <button
              className={`co-toggle-btn ${paymentMethod === "cash" ? "co-toggle-btn--active" : ""}`}
              onClick={() => setPaymentMethod("cash")}
            >
              💵 Cash
            </button>
            <button
              className={`co-toggle-btn ${paymentMethod === "wallet" ? "co-toggle-btn--active" : ""}`}
              onClick={() => setPaymentMethod("wallet")}
            >
              👛 E-Wallet
            </button>
          </div>
        </div>

        {paymentMethod === "wallet" && (
          <div className="co-wallet-info">
            <div className="co-wallet-balance">
              <span>Wallet Balance</span>
              <strong>Rs. {walletBalance !== null ? walletBalance : "..."}</strong>
            </div>
            {insufficientBalance && (
              <p className="co-wallet-warning">
                ⚠️ Insufficient balance. Please top up or switch to Cash.
              </p>
            )}
          </div>
        )}

        <div className="co-field-group">
          <div className="co-canteen-row">
            <span className="co-canteen-label">📍 Canteen</span>
            <strong className="co-canteen-value">{checkoutData.canteen}</strong>
          </div>
        </div>

        <div className="co-field-group">
          <label className="co-field-label">SMS Notification Number</label>
          <div className="co-input-wrap">
            <span className="co-input-icon">📱</span>
            <input
              type="tel"
              className="co-field-input"
              placeholder="+94 123 456 7890"
              value={smsPhone}
              onChange={(e) => setSmsPhone(e.target.value)}
            />
          </div>
          <p className="co-field-hint">Order code will be sent to this number via SMS</p>
        </div>

        {error && <div className="co-alert co-alert--error">{error}</div>}
        {smsStatus && <div className="co-alert co-alert--warning">{smsStatus}</div>}

        <button
          onClick={handlePlaceOrder}
          disabled={placing || insufficientBalance}
          className="co-cta-btn"
        >
          {placing
            ? "Placing order..."
            : paymentMethod === "wallet"
            ? `Pay Rs. ${checkoutData.totalAmount} from Wallet`
            : "Place Order"}
          {!placing && <span className="co-cta-arrow">→</span>}
        </button>
      </div>
    </div>
  );
};

export default CheckoutPage;
