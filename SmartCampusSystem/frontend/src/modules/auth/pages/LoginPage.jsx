import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import BrandLogo from "../../../components/BrandLogo";
import { useAuth } from "../../../context/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "", role: "student" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errors = {};
    if (!formData.role) errors.role = "Select your account role";
    const email = formData.email.trim();
    if (!email) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address";
    if (!formData.password) errors.password = "Password is required";
    else if (formData.password.length < 6) errors.password = "Password must be at least 6 characters";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);

    try {
      const result = await login({
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      });
      const role = result.data.data.user.role;

      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
        return;
      }

      if (role === "admin") navigate("/admin/dashboard", { replace: true });
      else if (role === "vendor") navigate("/vendor/dashboard", { replace: true });
      else navigate("/student/dashboard", { replace: true });
    } catch (apiError) {
      setError(
        apiError.response?.data?.message || apiError.message || "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg-page">
      {/* Left – branding panel */}
      <div className="lg-brand">
        <div className="lg-brand-content">
          <BrandLogo className="lg-brand-logo" />
            <h1 className="lg-brand-title">Smart Campus System</h1>
          <ul className="lg-features">
            <li className="lg-feature">
              <span className="lg-feature-icon">📦</span>
              <div>
                <span className="lg-feature-name">Track Orders</span>
                <span className="lg-feature-desc">Real-time order tracking & status updates</span>
              </div>
            </li>
            <li className="lg-feature">
              <span className="lg-feature-icon">📝</span>
              <div>
                <span className="lg-feature-name">Manage Menu</span>
                <span className="lg-feature-desc">Add, edit, and organize food items easily</span>
              </div>
            </li>
            <li className="lg-feature">
              <span className="lg-feature-icon">📊</span>
              <div>
                <span className="lg-feature-name">Monitor Revenue</span>
                <span className="lg-feature-desc">Daily, monthly analytics at your fingertips</span>
              </div>
            </li>
            <li className="lg-feature">
              <span className="lg-feature-icon">🤝</span>
              <div>
                <span className="lg-feature-name">Share Food</span>
                <span className="lg-feature-desc">Connect students through food sharing</span>
              </div>
            </li>
          </ul>
        </div>

        {/* Decorative shapes */}
        <div className="lg-brand-deco lg-brand-deco--1" />
        <div className="lg-brand-deco lg-brand-deco--2" />
        <div className="lg-brand-deco lg-brand-deco--3" />
      </div>

      {/* Right – login form */}
      <div className="lg-form-side">
        <div className="lg-form-card">
          <div className="lg-form-header">
            <h2 className="lg-form-title">Welcome Back</h2>
            <p className="lg-form-subtitle">Sign in to your canteen account</p>
          </div>

          <form onSubmit={handleSubmit} className="lg-form" noValidate>
            <div className="lg-field">
              <label className="lg-label">Account Type</label>
              <div className={`lg-input-wrap ${fieldErrors.role ? "lg-input-wrap--error" : ""}`}>
                <span className="lg-input-icon">🎓</span>
                <select name="role" value={formData.role} onChange={handleChange} className="lg-input lg-select">
                  <option value="student">Student</option>
                  <option value="vendor">Vendor</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              {fieldErrors.role && <span className="lg-field-error">{fieldErrors.role}</span>}
            </div>

            <div className="lg-field">
              <label className="lg-label">Email Address</label>
              <div className={`lg-input-wrap ${fieldErrors.email ? "lg-input-wrap--error" : ""}`}>
                <span className="lg-input-icon">✉️</span>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="lg-input"
                />
              </div>
              {fieldErrors.email && <span className="lg-field-error">{fieldErrors.email}</span>}
            </div>

            <div className="lg-field">
              <label className="lg-label">Password</label>
              <div className={`lg-input-wrap ${fieldErrors.password ? "lg-input-wrap--error" : ""}`}>
                <span className="lg-input-icon">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="lg-input"
                />
                <button
                  type="button"
                  className="lg-toggle-pwd"
                  onClick={() => setShowPassword((p) => !p)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {fieldErrors.password && <span className="lg-field-error">{fieldErrors.password}</span>}
            </div>

            <div className="lg-row-between">
              <label className="lg-remember">
                <input type="checkbox" className="lg-checkbox" />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="lg-forgot">Forgot password?</Link>
            </div>

            {error && <p className="lg-error">{error}</p>}

            <button type="submit" disabled={loading} className="lg-submit">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="lg-register-text">
            Don&apos;t have an account? <Link to="/register" className="lg-register-link">Register Now</Link>
          </p>
        </div>

        <p className="lg-footer">© {new Date().getFullYear()} Smart Campus System</p>
      </div>
    </div>
  );
};

export default LoginPage;
