import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitComplaint } from "../services/complaintService";

const SubmitComplaintPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "other",
  });
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await submitComplaint(formData);
      navigate("/student/complaints");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not submit complaint");
    }
  };

  return (
    <div>
      <h2>Submit Complaint</h2>
      <form onSubmit={handleSubmit} className="card row-gap">
        <input
          name="title"
          placeholder="Complaint title"
          value={formData.title}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Describe your complaint..."
          value={formData.description}
          onChange={handleChange}
          rows={4}
          required
        />
        <select name="category" value={formData.category} onChange={handleChange}>
          <option value="food">Food</option>
          <option value="order">Order</option>
          <option value="wallet">Wallet</option>
          <option value="vendor">Vendor</option>
          <option value="other">Other</option>
        </select>

        <button type="submit">Submit</button>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
      </form>
    </div>
  );
};

export default SubmitComplaintPage;
