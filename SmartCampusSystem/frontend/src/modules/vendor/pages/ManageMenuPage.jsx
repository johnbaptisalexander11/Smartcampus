import { useEffect, useState } from "react";
import {
  createVendorMenuItem,
  deleteVendorMenuItem,
  fetchVendorMenu,
  updateVendorMenuItem,
} from "../services/vendorService";
import { fetchCategories } from "../../food-ordering/services/foodOrderingService";

const ManageMenuPage = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    canteen: "",
    category: "",
  });

  const load = async () => {
    const [menu, cats] = await Promise.all([fetchVendorMenu(), fetchCategories()]);
    setItems(menu);
    setCategories(cats);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    await createVendorMenuItem(form);
    setForm({ name: "", description: "", price: "", canteen: "", category: "" });
    await load();
  };

  const toggleAvailability = async (item) => {
    await updateVendorMenuItem(item._id, { isAvailable: !item.isAvailable });
    await load();
  };

  const handleDelete = async (itemId) => {
    await deleteVendorMenuItem(itemId);
    await load();
  };

  return (
    <div className="vm-page">
      <div className="vm-header">
        <div>
          <h2 className="vm-title">🍽️ Manage Menu</h2>
          <p className="vm-subtitle">Add and manage your food menu items</p>
        </div>
        <span className="vm-item-count">{items.length} items</span>
      </div>

      <form onSubmit={handleCreate} className="vm-form">
        <div className="vm-form-banner">
          <span className="vm-form-banner-icon">➕</span>
          <h3 className="vm-form-banner-title">Add New Menu Item</h3>
        </div>
        <div className="vm-form-body">
          <div className="vm-form-grid">
            <div className="vm-field">
              <label className="vm-field-label">🏷️ Item Name</label>
              <input className="vm-field-input" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Chicken Rice" required />
            </div>
            <div className="vm-field">
              <label className="vm-field-label">💰 Price (Rs.)</label>
              <input className="vm-field-input" type="number" name="price" value={form.price} onChange={handleChange} placeholder="350" required />
            </div>
            <div className="vm-field">
              <label className="vm-field-label">📍 Canteen</label>
              <input className="vm-field-input" name="canteen" value={form.canteen} onChange={handleChange} placeholder="e.g. Main Canteen" required />
            </div>
            <div className="vm-field">
              <label className="vm-field-label">📦 Category</label>
              <select className="vm-field-input" name="category" value={form.category} onChange={handleChange} required>
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="vm-field vm-field--full">
              <label className="vm-field-label">📝 Description</label>
              <input className="vm-field-input" name="description" value={form.description} onChange={handleChange} placeholder="Ingredients, size, special notes..." />
            </div>
          </div>
          <button type="submit" className="vm-submit-btn">🚀 Add Menu Item</button>
        </div>
      </form>

      <div className="vm-grid">
        {items.map((item) => (
          <div className="vm-card" key={item._id}>
            <div className="vm-card-body">
              <div className="vm-card-top">
                <h4 className="vm-card-name">{item.name}</h4>
                <span className={`vm-status ${item.isAvailable ? "vm-status--on" : "vm-status--off"}`}>
                  {item.isAvailable ? "Available" : "Unavailable"}
                </span>
              </div>
              <div className="vm-card-meta">
                <span className="vm-card-price">Rs. {item.price}</span>
                <span className="vm-card-canteen">📍 {item.canteen}</span>
              </div>
              <div className="vm-card-actions">
                <button type="button" className="vm-btn vm-btn--toggle" onClick={() => toggleAvailability(item)}>
                  {item.isAvailable ? "Disable" : "Enable"}
                </button>
                <button type="button" className="vm-btn vm-btn--delete" onClick={() => handleDelete(item._id)}>🗑️ Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageMenuPage;
