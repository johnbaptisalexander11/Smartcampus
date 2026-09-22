import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CartItemRow from "../components/CartItemRow";
import {
  clearMyCart,
  fetchCart,
  removeItemFromCart,
  updateItemInCart,
} from "../services/foodOrderingService";

const CartPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [summary, setSummary] = useState({ subtotal: 0 });
  const [error, setError] = useState("");

  const loadCart = async () => {
    try {
      const data = await fetchCart();
      setCart(data.cart);
      setSummary(data.summary);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not fetch cart");
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const handleUpdateQty = async (itemId, quantity) => {
    if (quantity < 1) return;
    await updateItemInCart({ itemId, quantity });
    await loadCart();
  };

  const handleRemove = async (itemId) => {
    await removeItemFromCart(itemId);
    await loadCart();
  };

  const handleClear = async () => {
    await clearMyCart();
    await loadCart();
  };

  return (
    <div>
      <h2>My Cart</h2>
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {!cart || cart.items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <div className="row-gap">
            {cart.items.map((item) => (
              <CartItemRow key={item.foodItem?._id} item={item} onUpdateQty={handleUpdateQty} onRemove={handleRemove} />
            ))}
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <h3>Subtotal: Rs. {summary.subtotal}</h3>
            <div className="row-gap">
              <button onClick={() => navigate("/student/checkout")}>Proceed to Checkout</button>
              <button onClick={handleClear} className="btn-danger">
                Clear Cart
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;
