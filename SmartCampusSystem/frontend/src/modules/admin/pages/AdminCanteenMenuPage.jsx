import { useEffect, useState } from "react";
import {
  createCanteenMenuItem,
  deleteCanteenMenuItem,
  fetchCanteenMenu,
  updateCanteenMenuItem,
} from "../services/adminService";
import { fetchCategories } from "../../food-ordering/services/foodOrderingService";
import { useAuth } from "../../../context/AuthContext";

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const MAX_DESCRIPTION_WORDS = 15;

const countWords = (value = "") =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const getDescriptionError = (value = "") =>
  countWords(value) > MAX_DESCRIPTION_WORDS
    ? `Description must be ${MAX_DESCRIPTION_WORDS} words or less.`
    : "";

const emptyForm = () => ({
  name: "",
  description: "",
  price: "",
  category: "",
  imageUrl: "",
});

const AdminCanteenMenuPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saveError, setSaveError] = useState("");

  const load = async () => {
    const [menu, cats] = await Promise.all([fetchCanteenMenu(), fetchCategories()]);
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
    setSaveError("");
    const descriptionError = getDescriptionError(form.description);
    if (descriptionError) {
      setSaveError(descriptionError);
      return;
    }
    try {
      await createCanteenMenuItem({ ...form, imageUrl: form.imageUrl?.trim() || "" });
      setForm(emptyForm());
      setFileInputKey((k) => k + 1);
      await load();
    } catch (e) {
      const status = e.response?.status;
      setSaveError(
        status === 413
          ? "Request too large: use a smaller image or an image link (URL)."
          : e.response?.data?.message || "Could not save item."
      );
    }
  };

  const handleImageFileFixed = (event, target) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { window.alert("Please choose an image file."); return; }
    if (file.size > MAX_UPLOAD_BYTES) {
      window.alert(`Image is too large (max ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB).`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (target === "create") setForm((prev) => ({ ...prev, imageUrl: dataUrl }));
      else setEditForm((prev) => ({ ...prev, imageUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditForm({
      name: item.name,
      description: item.description || "",
      price: String(item.price),
      category: item.category?._id || item.category,
      imageUrl: item.imageUrl || "",
    });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const saveEdit = async (itemId) => {
    setSaveError("");
    const descriptionError = getDescriptionError(editForm.description);
    if (descriptionError) {
      setSaveError(descriptionError);
      return;
    }
    try {
      await updateCanteenMenuItem(itemId, {
        name: editForm.name,
        description: editForm.description,
        price: Number(editForm.price),
        category: editForm.category,
        imageUrl: editForm.imageUrl?.trim() || "",
      });
      cancelEdit();
      await load();
    } catch (e) {
      const status = e.response?.status;
      setSaveError(status === 413 ? "Request too large." : e.response?.data?.message || "Could not save.");
    }
  };

  const toggleAvailability = async (item) => {
    await updateCanteenMenuItem(item._id, { isAvailable: !item.isAvailable });
    await load();
  };

  const handleDelete = async (itemId) => {
    await deleteCanteenMenuItem(itemId);
    await load();
  };

  const descriptionWordCount = countWords(form.description);

  return (
    <div className="vm-page">
      {/* Header */}
      <div className="vm-header">
        <div>
          <h2 className="vm-title">🍽️ Manage Menu</h2>
          <p className="vm-subtitle">{user?.canteenLabel || "Your canteen"} — items appear on the student food menu</p>
        </div>
        <span className="vm-item-count">{items.length} items</span>
      </div>

      {saveError && <p className="vm-error">{saveError}</p>}

      {/* Add Form */}
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
            <div className="vm-field vm-field--full">
              <label className="vm-field-label">📝 Description</label>
              <textarea className="vm-field-textarea" name="description" value={form.description} onChange={handleChange} placeholder="Ingredients, size, special notes..." rows={2} />
              <p style={{ marginTop: 6, fontSize: 13, color: descriptionWordCount > MAX_DESCRIPTION_WORDS ? "#c62828" : "#6b7280" }}>
                {descriptionWordCount}/{MAX_DESCRIPTION_WORDS} words
              </p>
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
            <div className="vm-field">
              <label className="vm-field-label">🔗 Image URL (optional)</label>
              <input className="vm-field-input" name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="https://..." type="text" />
            </div>
          </div>

          <div className="vm-upload-row">
            <label className="vm-upload-label">
              <input key={fileInputKey} type="file" accept="image/*" onChange={(e) => handleImageFileFixed(e, "create")} style={{ display: "none" }} />
              <span className="vm-upload-btn">📸 Upload Image</span>
            </label>
            {form.imageUrl && (
              <div className="vm-preview-wrap">
                <img src={form.imageUrl} alt="" className="vm-preview-img" />
              </div>
            )}
          </div>

          <button type="submit" className="vm-submit-btn">🚀 Add Menu Item</button>
        </div>
      </form>

      {/* Menu Items Grid */}
      <div className="vm-grid">
        {items.map((item) => (
          <div className="vm-card" key={item._id}>
            {editingId === item._id ? (
              <div className="vm-edit-form">
                <input className="vm-field-input" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} placeholder="Name" />
                <textarea className="vm-field-textarea" value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" rows={2} />
                <input className="vm-field-input" type="number" value={editForm.price} onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))} placeholder="Price" />
                <select className="vm-field-input" value={editForm.category} onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
                <input className="vm-field-input" type="text" value={editForm.imageUrl} onChange={(e) => setEditForm((p) => ({ ...p, imageUrl: e.target.value }))} placeholder="Image URL" />
                <label className="vm-upload-label">
                  <input type="file" accept="image/*" onChange={(e) => handleImageFileFixed(e, "edit")} style={{ display: "none" }} />
                  <span className="vm-upload-btn">📸 Change Image</span>
                </label>
                {editForm.imageUrl && <img src={editForm.imageUrl} alt="" className="vm-preview-img" />}
                <div className="vm-edit-actions">
                  <button type="button" className="vm-btn vm-btn--save" onClick={() => saveEdit(item._id)}>Save</button>
                  <button type="button" className="vm-btn vm-btn--cancel" onClick={cancelEdit}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                {item.imageUrl && (
                  <div className="vm-card-img-wrap">
                    <img src={item.imageUrl} alt="" className="vm-card-img" />
                  </div>
                )}
                <div className="vm-card-body">
                  <div className="vm-card-top">
                    <h4 className="vm-card-name">{item.name}</h4>
                    <span className={`vm-status ${item.isAvailable ? "vm-status--on" : "vm-status--off"}`}>
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </div>
                  {item.description && <p className="vm-card-desc">{item.description}</p>}
                  <div className="vm-card-meta">
                    <span className="vm-card-price">Rs. {item.price}</span>
                    {item.canteen && <span className="vm-card-canteen">📍 {item.canteen}</span>}
                  </div>
                  <div className="vm-card-actions">
                    <button type="button" className="vm-btn vm-btn--edit" onClick={() => startEdit(item)}>✏️ Edit</button>
                    <button type="button" className="vm-btn vm-btn--toggle" onClick={() => toggleAvailability(item)}>
                      {item.isAvailable ? "Disable" : "Enable"}
                    </button>
                    <button type="button" className="vm-btn vm-btn--delete" onClick={() => handleDelete(item._id)}>🗑️</button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCanteenMenuPage;
