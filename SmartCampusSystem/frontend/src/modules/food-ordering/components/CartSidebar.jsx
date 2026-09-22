import { getLocalFoodImage } from "../utils/foodImages";

const CartSidebar = ({ cart, summary, onUpdateQty, onRemove, onClear, onCheckout }) => {
  const items = cart?.items || [];
  const hasItems = items.length > 0;
  const serviceFee = hasItems ? Math.round(summary.subtotal * 0.05) : 0;
  const total = summary.subtotal + serviceFee;

  return (
    <aside className="mn-sidebar">
      <div className="mn-sidebar-head">
        <h3 className="mn-sidebar-title">My Order 🛒</h3>
        {hasItems && (
          <span className="mn-sidebar-badge">{items.length} ITEMS</span>
        )}
      </div>

      {!hasItems ? (
        <div className="mn-sidebar-empty">
          <span className="mn-sidebar-empty-icon">🛒</span>
          <p>Your cart is empty</p>
          <span className="mn-sidebar-empty-hint">Add items from the menu</span>
        </div>
      ) : (
        <>
          <div className="mn-sidebar-list">
            {items.map((item) => {
              const img =
                getLocalFoodImage(item.foodItem?.name) || item.foodItem?.imageUrl || "";
              return (
                <div key={item.foodItem?._id} className="mn-sidebar-item">
                  <div className="mn-sidebar-item-img">
                    {img ? (
                      <img src={img} alt={item.foodItem?.name} />
                    ) : (
                      <span className="mn-sidebar-item-ph">🍽️</span>
                    )}
                  </div>
                  <div className="mn-sidebar-item-detail">
                    <span className="mn-sidebar-item-name">{item.foodItem?.name}</span>
                    <span className="mn-sidebar-item-price">
                      Rs.{item.priceAtAddTime}
                    </span>
                  </div>
                  <div className="mn-sidebar-item-qty">
                    <button
                      className="mn-qty-btn"
                      onClick={() => onUpdateQty(item.foodItem?._id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <span className="mn-qty-val">{item.quantity}</span>
                    <button
                      className="mn-qty-btn"
                      onClick={() => onUpdateQty(item.foodItem?._id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="mn-sidebar-item-remove"
                    onClick={() => onRemove(item.foodItem?._id)}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mn-sidebar-totals">
            <div className="mn-sidebar-row">
              <span>Subtotal</span>
              <span>Rs.{summary.subtotal.toFixed(2)}</span>
            </div>
            <div className="mn-sidebar-row">
              <span>Service Fee</span>
              <span>Rs.{serviceFee.toFixed(2)}</span>
            </div>
            <div className="mn-sidebar-row mn-sidebar-row--total">
              <span>Total</span>
              <span>Rs.{total.toFixed(2)}</span>
            </div>
          </div>

          <button className="mn-sidebar-checkout" onClick={onCheckout}>
            Checkout Now
          </button>

          <button className="mn-sidebar-clear" onClick={onClear}>
            Clear Cart
          </button>

          <p className="mn-sidebar-secure">🔒 Secure transaction with CampusPay</p>
        </>
      )}
    </aside>
  );
};

export default CartSidebar;
