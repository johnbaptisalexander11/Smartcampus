import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchFilters from "../components/SearchFilters";
import MenuItemCard from "../components/MenuItemCard";
import ReviewSection from "../components/ReviewSection";
import CartSidebar from "../components/CartSidebar";
import {
  addItemToCart,
  fetchCart,
  fetchCategories,
  fetchMenu,
  removeItemFromCart,
  updateItemInCart,
  clearMyCart,
} from "../services/foodOrderingService";

const MenuPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [canteen, setCanteen] = useState("");
  const [selectedReviewItemId, setSelectedReviewItemId] = useState("");
  const [error, setError] = useState("");

  const [cart, setCart] = useState(null);
  const [summary, setSummary] = useState({ subtotal: 0 });

  const loadMenu = async () => {
    try {
      const menuData = await fetchMenu({ search, category, canteen });
      setItems(menuData);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not load menu");
    }
  };

  const loadCart = async () => {
    try {
      const data = await fetchCart();
      setCart(data.cart);
      setSummary(data.summary);
    } catch {
      /* cart not loaded yet */
    }
  };

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
    loadCart();
  }, []);

  useEffect(() => {
    loadMenu();
  }, [search, category, canteen]);

  const handleAddToCart = async (foodItemId) => {
    try {
      await addItemToCart({ foodItemId, quantity: 1 });
      await loadCart();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not add item to cart");
    }
  };

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
    <div className="mn-layout">
      <div className="mn-main">
        {/* Categories */}
        <section className="mn-categories">
          <div className="mn-search-bar">
            <svg className="mn-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              placeholder="Search for dishes, cuisines..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="mn-cat-header">
            <h2 className="mn-cat-title">Categories</h2>
            <select
              className="mn-canteen-select"
              value={canteen}
              onChange={(e) => setCanteen(e.target.value)}
            >
              <option value="">All Canteens</option>
              <option value="1st Canteen">1st Canteen</option>
              <option value="2nd Canteen">2nd Canteen</option>
              <option value="3rd Canteen">3rd Canteen</option>
              <option value="4th Canteen">4th Canteen</option>
            </select>
          </div>
          <SearchFilters
            category={category}
            canteen={canteen}
            categories={categories}
            onCategoryChange={setCategory}
            onCanteenChange={setCanteen}
          />
        </section>

        {error && <p className="mn-error">{error}</p>}

        {/* Food Grid */}
        <div className="mn-grid">
          {items.map((item) => (
            <MenuItemCard
              key={item._id}
              item={item}
              onAddToCart={handleAddToCart}
              onOpenReviews={setSelectedReviewItemId}
            />
          ))}
          {items.length === 0 && !error && (
            <p className="mn-empty">No items found. Try a different search or category.</p>
          )}
        </div>

        {selectedReviewItemId && (
          <div style={{ marginTop: 16 }}>
            <ReviewSection itemId={selectedReviewItemId} />
          </div>
        )}
      </div>

      <CartSidebar
        cart={cart}
        summary={summary}
        onUpdateQty={handleUpdateQty}
        onRemove={handleRemove}
        onClear={handleClear}
        onCheckout={() => navigate("/student/checkout")}
      />
    </div>
  );
};

export default MenuPage;
