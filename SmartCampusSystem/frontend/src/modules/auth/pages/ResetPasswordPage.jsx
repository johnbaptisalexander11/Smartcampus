import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "../services/authService";
import loginBackground from "../../../img/login.jpg";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState(location.state?.token || "");
  const [email] = useState(location.state?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const errs = {};
    if (!token.trim()) errs.token = "Please verify the OTP again from the forgot password page";
    if (!newPassword) errs.newPassword = "Password is required";
    else if (newPassword.length < 6) errs.newPassword = "Password must be at least 6 characters";
    else if (!/[A-Z]/.test(newPassword)) errs.newPassword = "Must contain at least 1 uppercase letter";
    else if (!/[0-9]/.test(newPassword)) errs.newPassword = "Must contain at least 1 number";
    if (!confirmPassword) errs.confirmPassword = "Please confirm your password";
    else if (newPassword !== confirmPassword) errs.confirmPassword = "Passwords do not match";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not reset password");
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
        <h1 className="auth-ui-title">Reset Password</h1>
        <p className="auth-ui-subtitle">Set a new password for your account.</p>

        {success ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#059669", fontWeight: 600, marginBottom: 12 }}>
              Password reset successfully!
            </p>
            <button
              className="auth-ui-signin-btn"
              onClick={() => navigate("/login")}
            >
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-ui-form" noValidate>
            <div className="auth-ui-field">
              <input type="email" value={email} placeholder="Email" readOnly />
              {fieldErrors.token && <p style={{ color: "#dc2626", fontSize: "0.78rem", margin: "4px 0 0" }}>{fieldErrors.token}</p>}
            </div>

            <div className="auth-ui-field">
              <input
                type="password"
                placeholder="New Password (min 6, 1 uppercase, 1 number)"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setFieldErrors((p) => ({ ...p, newPassword: "" })); }}
                style={fieldErrors.newPassword ? { borderColor: "#dc2626" } : {}}
              />
              {fieldErrors.newPassword && <p style={{ color: "#dc2626", fontSize: "0.78rem", margin: "4px 0 0" }}>{fieldErrors.newPassword}</p>}
            </div>

            <div className="auth-ui-field">
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((p) => ({ ...p, confirmPassword: "" })); }}
                style={fieldErrors.confirmPassword ? { borderColor: "#dc2626" } : {}}
              />
              {fieldErrors.confirmPassword && <p style={{ color: "#dc2626", fontSize: "0.78rem", margin: "4px 0 0" }}>{fieldErrors.confirmPassword}</p>}
            </div>

            {error && <p className="auth-ui-error">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="auth-ui-signin-btn"
            >
              {loading ? "Resetting..." : "Reset Password"}
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

export default ResetPasswordPage;
