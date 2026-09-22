import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";

const formatRole = (role = "") => {
  if (!role) return "-";
  return role.charAt(0).toUpperCase() + role.slice(1);
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    department: "",
    studyYear: "",
    semester: "",
    profileImage: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        department: user.department || "",
        studyYear: user.studyYear ?? "",
        semester: user.semester ?? "",
        profileImage: user.profileImage || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (!toast.visible) return;
    const timer = setTimeout(() => setToast({ visible: false, message: "" }), 2500);
    return () => clearTimeout(timer);
  }, [toast.visible]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      window.alert("Please choose an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((current) => ({ ...current, profileImage: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!updateProfile) return;

    if (passwordForm.newPassword && passwordForm.newPassword !== passwordForm.confirmPassword) {
      window.alert("New password and confirm password do not match.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        department: formData.department,
        studyYear: formData.studyYear === "" ? "" : Number(formData.studyYear),
        semester: formData.semester === "" ? "" : Number(formData.semester),
        profileImage: formData.profileImage,
      };

      if (passwordForm.currentPassword || passwordForm.newPassword || passwordForm.confirmPassword) {
        payload.currentPassword = passwordForm.currentPassword;
        payload.password = passwordForm.newPassword;
      }

      await updateProfile(payload);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setIsEditing(false);
      setToast({ visible: true, message: "Profile updated successfully" });
    } catch (error) {
      console.error("Profile update failed", error);
      window.alert(error?.response?.data?.message || "Profile update failed");
    } finally {
      setIsSaving(false);
    }
  };

  const profileInitial = (user?.name || "U")[0].toUpperCase();

  return (
    <div className="profile-page">
      {toast.visible && (
        <div className="profile-toast" role="status" aria-live="polite">
          {toast.message}
        </div>
      )}

      <section className="profile-card">
        <div className="profile-card-header">
          <div className="profile-avatar">
            {user?.profileImage ? <img src={user.profileImage} alt="Profile" className="profile-avatar-image" /> : profileInitial}
          </div>
          <div>
            <h2 className="profile-title">{user?.name || "Student Profile"}</h2>
            <p className="profile-subtitle">Profile details from your account</p>
          </div>
          {!isEditing && (
            <button type="button" className="profile-action-btn" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="profile-grid">
              <div className="profile-field profile-image-field">
                <label className="profile-label">Profile Image</label>
                <div className="profile-image-upload-wrap">
                  <div className="profile-avatar mini">
                    {formData.profileImage ? (
                      <img src={formData.profileImage} alt="Preview" className="profile-avatar-image" />
                    ) : (
                      profileInitial
                    )}
                  </div>
                  <label className="profile-upload-btn">
                    <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                    Upload New Photo
                  </label>
                </div>
              </div>

              <div className="profile-field">
                <label htmlFor="fullName" className="profile-label">Full Name</label>
                <input
                  id="fullName"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="profile-input"
                />
              </div>

              <div className="profile-field">
                <label htmlFor="phone" className="profile-label">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="profile-input"
                />
              </div>

              <div className="profile-field">
                <label htmlFor="department" className="profile-label">Department</label>
                <input
                  id="department"
                  name="department"
                  type="text"
                  value={formData.department}
                  onChange={handleChange}
                  className="profile-input"
                />
              </div>

              <div className="profile-field">
                <label htmlFor="studyYear" className="profile-label">Study Year</label>
                <select
                  id="studyYear"
                  name="studyYear"
                  value={formData.studyYear}
                  onChange={handleChange}
                  className="profile-input"
                >
                  <option value="">Select</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </div>

              <div className="profile-field">
                <label htmlFor="semester" className="profile-label">Semester</label>
                <select
                  id="semester"
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  className="profile-input"
                >
                  <option value="">Select</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                </select>
              </div>

              <div className="profile-field">
                <span className="profile-label">Email</span>
                <span className="profile-value">{user?.email || "-"}</span>
              </div>

              <div className="profile-field">
                <span className="profile-label">Role</span>
                <span className="profile-value">{formatRole(user?.role)}</span>
              </div>

              <div className="profile-field">
                <span className="profile-label">Joined On</span>
                <span className="profile-value">{formatDate(user?.createdAt)}</span>
              </div>
            </div>

            <div className="profile-field password-group">
              <label htmlFor="currentPassword" className="profile-label">Current Password</label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                className="profile-input"
                placeholder="Enter current password"
              />
            </div>

            <div className="profile-field password-group">
              <label htmlFor="newPassword" className="profile-label">New Password</label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                className="profile-input"
                placeholder="Enter new password"
              />
            </div>

            <div className="profile-field password-group">
              <label htmlFor="confirmPassword" className="profile-label">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                className="profile-input"
                placeholder="Confirm new password"
              />
            </div>

            <div className="profile-form-actions">
              <button type="button" className="profile-secondary-btn" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button type="submit" className="profile-primary-btn" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-grid">
            <div className="profile-field">
              <span className="profile-label">Email</span>
              <span className="profile-value">{user?.email || "-"}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Role</span>
              <span className="profile-value">{formatRole(user?.role)}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Phone</span>
              <span className="profile-value">{user?.phone || "-"}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Department</span>
              <span className="profile-value">{user?.department || "-"}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Study Year</span>
              <span className="profile-value">{user?.studyYear ?? "-"}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Semester</span>
              <span className="profile-value">{user?.semester ?? "-"}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Joined On</span>
              <span className="profile-value">{formatDate(user?.createdAt)}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Account Status</span>
              <span className="profile-value">{user?.isActive ? "Active" : "Inactive"}</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ProfilePage;
