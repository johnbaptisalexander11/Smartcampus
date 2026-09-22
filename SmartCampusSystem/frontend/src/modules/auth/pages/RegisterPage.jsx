import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BrandLogo from "../../../components/BrandLogo";
import { useAuth } from "../../../context/AuthContext";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, verifyOtp, resendOtp } = useAuth();

  const [step, setStep] = useState("details");
  const [formData, setFormData] = useState({
    name: "",
    role: "student",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    department: "",
    studyYear: "",
    semester: "",
    canteenKey: "",
  });
  const [otp, setOtp] = useState("");
  const [phoneMasked, setPhoneMasked] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [devOtpHint, setDevOtpHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordChecks = {
    length: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    lower: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[^A-Za-z0-9]/.test(formData.password),
  };

  const isStrongPassword = Object.values(passwordChecks).every(Boolean);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errors = {};

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      errors.name = "Full name is required";
    } else if (trimmedName.length < 2) {
      errors.name = "Name must be at least 2 characters";
    } else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s.'-]+$/.test(trimmedName)) {
      errors.name = "Name can only contain letters, spaces, dots, hyphens";
    }

    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = "Enter a valid email address";
    }

    if (!formData.role) {
      errors.role = "Choose an account type";
    }

    if (formData.role === "vendor" && !formData.canteenKey) {
      errors.canteenKey = "Select the canteen you manage";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (!isStrongPassword) {
      errors.password = "Use a strong password (8+ chars, upper, lower, number, special)";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Confirm password is required";
    } else if (formData.confirmPassword !== formData.password) {
      errors.confirmPassword = "Passwords do not match";
    }

    const trimmedPhone = formData.phone.trim();
    if (!trimmedPhone) {
      errors.phone = "Phone number is required for OTP";
    } else {
      const digitsOnly = trimmedPhone.replace(/\D/g, "");
      let local = digitsOnly;
      if (local.startsWith("94")) local = local.slice(2);
      if (local.startsWith("0")) local = local.slice(1);
      if (!/^\d{9}$/.test(local)) {
        errors.phone = "Use a valid Sri Lankan number (e.g. 0771234567)";
      }
    }

    if (formData.studyYear && (Number(formData.studyYear) < 1 || Number(formData.studyYear) > 4)) {
      errors.studyYear = "Study year must be between 1 and 4";
    }

    if (formData.semester && (Number(formData.semester) < 1 || Number(formData.semester) > 2)) {
      errors.semester = "Semester must be 1 or 2";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const goToDashboard = (role) => {
    if (role === "admin") navigate("/admin/dashboard", { replace: true });
    else if (role === "vendor") navigate("/vendor/dashboard", { replace: true });
    else navigate("/student/dashboard", { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");
    setDevOtpHint("");

    if (!validate()) return;

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        password: formData.password,
        phone: formData.phone.trim(),
        department: formData.department.trim(),
        studyYear: formData.studyYear || "",
        semester: formData.semester || "",
        canteenKey: formData.canteenKey || "",
      };

      const result = await register(payload);
      const data = result.data?.data || {};

      if (data.requiresOtp) {
        setPendingEmail(data.email || payload.email);
        setPhoneMasked(data.phoneMasked || "");
        setInfo(
          data.smsSent
            ? `OTP sent to ${data.phoneMasked || "your phone"}. Enter it to activate your account.`
            : `Account created. SMS may be delayed — enter the OTP sent to ${data.phoneMasked || "your phone"}.`
        );
        if (data.devOtp) {
          setDevOtpHint(`Testing OTP: ${data.devOtp}`);
        }
        setStep("otp");
        return;
      }

      const role = data.user?.role || "student";
      goToDashboard(role);
    } catch (apiError) {
      setError(apiError.response?.data?.message || apiError.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");

    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Enter the 6-digit OTP from your SMS");
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOtp({
        email: pendingEmail,
        otp: otp.trim(),
      });
      const role = result.data?.data?.user?.role || "student";
      goToDashboard(role);
    } catch (apiError) {
      setError(apiError.response?.data?.message || apiError.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setInfo("");
    setDevOtpHint("");
    setLoading(true);
    try {
      const result = await resendOtp({ email: pendingEmail });
      const data = result.data?.data || {};
      setPhoneMasked(data.phoneMasked || phoneMasked);
      setInfo(
        data.smsSent
          ? `A new OTP was sent to ${data.phoneMasked || "your phone"}.`
          : "New OTP generated. If SMS failed, check the testing hint below."
      );
      if (data.devOtp) {
        setDevOtpHint(`Testing OTP: ${data.devOtp}`);
      }
    } catch (apiError) {
      setError(apiError.response?.data?.message || apiError.message || "Could not resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rg-page">
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

        <div className="lg-brand-deco lg-brand-deco--1" />
        <div className="lg-brand-deco lg-brand-deco--2" />
        <div className="lg-brand-deco lg-brand-deco--3" />
      </div>

      <div className="rg-form-side">
        <div className="rg-form-card">
          <div className="rg-form-header">
            <h2 className="rg-form-title">{step === "otp" ? "Verify Phone" : "Create Account"}</h2>
            <p className="rg-form-subtitle">
              {step === "otp"
                ? `Enter the OTP sent to ${phoneMasked || "your phone"}`
                : "Join the canteen platform today"}
            </p>
          </div>

          {step === "details" ? (
            <form onSubmit={handleSubmit} className="rg-form" noValidate>
              <div className="rg-field">
                <label className="rg-label">Account Type</label>
                <div className={`rg-input-wrap ${fieldErrors.role ? "rg-input-wrap--error" : ""}`}>
                  <span className="rg-input-icon">🎓</span>
                  <select className="rg-input rg-select" name="role" value={formData.role} onChange={handleChange}>
                    <option value="student">Student</option>
                    <option value="vendor">Vendor</option>
                  </select>
                </div>
                {fieldErrors.role && <span className="rg-field-error">{fieldErrors.role}</span>}
              </div>

              {formData.role === "vendor" && (
                <div className="rg-field">
                  <label className="rg-label">Canteen</label>
                  <div className={`rg-input-wrap ${fieldErrors.canteenKey ? "rg-input-wrap--error" : ""}`}>
                    <span className="rg-input-icon">🍽️</span>
                    <select className="rg-input rg-select" name="canteenKey" value={formData.canteenKey} onChange={handleChange}>
                      <option value="">Select your canteen</option>
                      <option value="canteen1">1st Canteen</option>
                      <option value="canteen2">2nd Canteen</option>
                      <option value="canteen3">3rd Canteen</option>
                      <option value="canteen4">4th Canteen</option>
                    </select>
                  </div>
                  {fieldErrors.canteenKey && <span className="rg-field-error">{fieldErrors.canteenKey}</span>}
                </div>
              )}

              <div className="rg-field">
                <label className="rg-label">Full Name</label>
                <div className={`rg-input-wrap ${fieldErrors.name ? "rg-input-wrap--error" : ""}`}>
                  <span className="rg-input-icon">👤</span>
                  <input className="rg-input" type="text" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} />
                </div>
                {fieldErrors.name && <span className="rg-field-error">{fieldErrors.name}</span>}
              </div>

              <div className="rg-row">
                <div className="rg-field">
                  <label className="rg-label">Email Address</label>
                  <div className={`rg-input-wrap ${fieldErrors.email ? "rg-input-wrap--error" : ""}`}>
                    <span className="rg-input-icon">✉️</span>
                    <input className="rg-input" type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} />
                  </div>
                  {fieldErrors.email && <span className="rg-field-error">{fieldErrors.email}</span>}
                </div>
                <div className="rg-field">
                  <label className="rg-label">Phone Number *</label>
                  <div className={`rg-input-wrap ${fieldErrors.phone ? "rg-input-wrap--error" : ""}`}>
                    <span className="rg-input-icon">📱</span>
                    <input className="rg-input" type="tel" name="phone" placeholder="0771234567" value={formData.phone} onChange={handleChange} />
                  </div>
                  {fieldErrors.phone && <span className="rg-field-error">{fieldErrors.phone}</span>}
                </div>
              </div>

              <div className="rg-field">
                <label className="rg-label">Department</label>
                <div className={`rg-input-wrap ${fieldErrors.department ? "rg-input-wrap--error" : ""}`}>
                  <span className="rg-input-icon">🏛️</span>
                  <input className="rg-input" type="text" name="department" placeholder="Computer Science" value={formData.department} onChange={handleChange} />
                </div>
                {fieldErrors.department && <span className="rg-field-error">{fieldErrors.department}</span>}
              </div>

              <div className="rg-row">
                <div className="rg-field">
                  <label className="rg-label">Password</label>
                  <div className={`rg-input-wrap ${fieldErrors.password ? "rg-input-wrap--error" : ""}`}>
                    <span className="rg-input-icon">🔒</span>
                    <input
                      className="rg-input"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Strong password"
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                    />
                    <button type="button" className="rg-toggle-pwd" onClick={() => setShowPassword((p) => !p)}>
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {fieldErrors.password && <span className="rg-field-error">{fieldErrors.password}</span>}
                </div>
                <div className="rg-field">
                  <label className="rg-label">Confirm Password</label>
                  <div className={`rg-input-wrap ${fieldErrors.confirmPassword ? "rg-input-wrap--error" : ""}`}>
                    <span className="rg-input-icon">🔒</span>
                    <input
                      className="rg-input"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                    />
                    <button type="button" className="rg-toggle-pwd" onClick={() => setShowConfirmPassword((p) => !p)}>
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && <span className="rg-field-error">{fieldErrors.confirmPassword}</span>}
                </div>
              </div>

              <ul className="rg-password-rules" aria-label="Password requirements">
                <li className={passwordChecks.length ? "ok" : ""}>At least 8 characters</li>
                <li className={passwordChecks.upper ? "ok" : ""}>One uppercase letter (A-Z)</li>
                <li className={passwordChecks.lower ? "ok" : ""}>One lowercase letter (a-z)</li>
                <li className={passwordChecks.number ? "ok" : ""}>One number (0-9)</li>
                <li className={passwordChecks.special ? "ok" : ""}>One special character (!@#$...)</li>
              </ul>

              <div className="rg-row">
                <div className="rg-field">
                  <label className="rg-label">Study Year</label>
                  <div className={`rg-input-wrap ${fieldErrors.studyYear ? "rg-input-wrap--error" : ""}`}>
                    <span className="rg-input-icon">📅</span>
                    <select className="rg-input rg-select" name="studyYear" value={formData.studyYear} onChange={handleChange}>
                      <option value="">Select year</option>
                      <option value="1">Year 1</option>
                      <option value="2">Year 2</option>
                      <option value="3">Year 3</option>
                      <option value="4">Year 4</option>
                    </select>
                  </div>
                  {fieldErrors.studyYear && <span className="rg-field-error">{fieldErrors.studyYear}</span>}
                </div>
                <div className="rg-field">
                  <label className="rg-label">Semester</label>
                  <div className={`rg-input-wrap ${fieldErrors.semester ? "rg-input-wrap--error" : ""}`}>
                    <span className="rg-input-icon">📚</span>
                    <select className="rg-input rg-select" name="semester" value={formData.semester} onChange={handleChange}>
                      <option value="">Select semester</option>
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                    </select>
                  </div>
                  {fieldErrors.semester && <span className="rg-field-error">{fieldErrors.semester}</span>}
                </div>
              </div>

              {error && <p className="rg-error">{error}</p>}

              <button type="submit" disabled={loading} className="rg-submit">
                {loading ? "Sending OTP..." : "Create Account & Send OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="rg-form" noValidate>
              <div className="rg-field">
                <label className="rg-label">6-digit OTP</label>
                <div className="rg-input-wrap">
                  <span className="rg-input-icon">🔐</span>
                  <input
                    className="rg-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                </div>
              </div>

              {info && <p className="rg-info">{info}</p>}
              {devOtpHint && <p className="rg-info">{devOtpHint}</p>}
              {error && <p className="rg-error">{error}</p>}

              <button type="submit" disabled={loading} className="rg-submit">
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>

              <button
                type="button"
                className="rg-resend"
                disabled={loading}
                onClick={handleResendOtp}
              >
                Resend OTP
              </button>

              <button
                type="button"
                className="rg-back"
                disabled={loading}
                onClick={() => {
                  setStep("details");
                  setOtp("");
                  setError("");
                  setInfo("");
                  setDevOtpHint("");
                }}
              >
                Back to details
              </button>
            </form>
          )}

          <p className="rg-login-text">
            Already have an account? <Link to="/login" className="rg-login-link">Sign In</Link>
          </p>
        </div>

        <p className="lg-footer">© {new Date().getFullYear()} Smart Campus System</p>
      </div>
    </div>
  );
};

export default RegisterPage;
