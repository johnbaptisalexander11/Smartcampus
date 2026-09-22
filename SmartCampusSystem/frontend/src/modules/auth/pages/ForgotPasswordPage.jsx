import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword, verifyPasswordResetOtp } from "../services/authService";
import loginBackground from "../../../img/login.jpg";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneMasked, setPhoneMasked] = useState("");
  const [devOtpHint, setDevOtpHint] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldError("");
    const trimmed = email.trim();
    if (!trimmed) { setFieldError("Email is required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setFieldError("Enter a valid email address"); return; }
    setLoading(true);
    try {
      const result = await forgotPassword(email);
      const data = result.data?.data || {};
      setPhoneMasked(data.phoneMasked || "your phone");
      setDevOtpHint(data.devOtp ? `Testing OTP: ${data.devOtp}` : "");
      setError("");
      setFieldError("");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not process request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-ui-page"
      style={{ backgroundImage: `url(${loginBackground})` }}
    >
      <div className="auth-ui-card">
        <h1 className="auth-ui-title">Forgot Password</h1>
        <p className="auth-ui-subtitle">Verify your phone before resetting your password.</p>

        {!phoneMasked ? (
          <form onSubmit={handleSubmit} className="auth-ui-form">
            <div className="auth-ui-field">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldError(""); }}
                style={fieldError ? { borderColor: "#dc2626" } : {}}
              />
              {fieldError && <p style={{ color: "#dc2626", fontSize: "0.78rem", margin: "4px 0 0" }}>{fieldError}</p>}
            </div>

            {error && <p className="auth-ui-error">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="auth-ui-signin-btn"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              setError("");
              if (!/^\d{6}$/.test(otp.trim())) {
                setError("Enter the 6-digit OTP from your SMS");
                return;
              }
              setLoading(true);
              try {
                const result = await verifyPasswordResetOtp({ email, otp: otp.trim() });
                const token = result.data?.token;
                navigate("/reset-password", { state: { token, email: email.trim().toLowerCase() } });
              } catch (apiError) {
                setError(apiError.response?.data?.message || "Could not verify OTP");
              } finally {
                setLoading(false);
              }
            }}
            className="auth-ui-form"
          >
            <p>OTP sent to {phoneMasked}</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
            />
            {devOtpHint && <p style={{ color: "#92400e", fontSize: "0.82rem" }}>{devOtpHint}</p>}
            {error && <p className="auth-ui-error">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="auth-ui-signin-btn"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}

        <p className="auth-ui-register-text" style={{ marginTop: 16 }}>
          Remember your password? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
