import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const NOTIFICATIONS_LAST_SEEN_KEY = "student_notifications_last_seen";

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleBase = user?.role || "student";
  const isStudent = roleBase === "student";
  const isAdmin = roleBase === "admin";
  const isCanteenAdmin = isAdmin && Boolean(user?.canteenKey);

  useEffect(() => {
    if (!isStudent) return undefined;

    let mounted = true;

    const checkUnread = async () => {
      try {
        const stored = Number(localStorage.getItem(NOTIFICATIONS_LAST_SEEN_KEY) || 0);
        const [menuRes, groupsRes, walletRes] = await Promise.all([
          api.get("/food-ordering/menu"),
          api.get("/group-study"),
          api.get("/wallet/notifications"),
        ]);

        const menuItems = menuRes.data?.data?.items || [];
        const groups = groupsRes.data?.data?.groups || [];
        const walletNotifications = walletRes.data?.data?.notifications || [];

        const latestFoodTime = menuItems.reduce((max, item) => {
          const t = item.createdAt ? new Date(item.createdAt).getTime() : 0;
          return Math.max(max, t);
        }, 0);

        const latestGroupTime = groups.reduce((max, group) => {
          const t = group.createdAt ? new Date(group.createdAt).getTime() : 0;
          return Math.max(max, t);
        }, 0);

        const latestWalletTime = walletNotifications.reduce((max, notification) => {
          const t = notification.createdAt ? new Date(notification.createdAt).getTime() : 0;
          return Math.max(max, t);
        }, 0);

        if (mounted) {
          setHasUnreadNotifications(Math.max(latestFoodTime, latestGroupTime, latestWalletTime) > stored);
        }
      } catch {
        if (mounted) setHasUnreadNotifications(false);
      }
    };

    checkUnread();
    const id = setInterval(checkUnread, 60000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [isStudent]);

  if (isStudent) {
    return (
      <div className="student-shell">
        <header className="student-nav">
          <div className="student-nav-inner">
            <Link to="/student/dashboard" className="student-nav-brand">
              <BrandLogo className="student-nav-logo-img" />
              <span className="student-nav-title">Smart Campus System</span>
            </Link>
            <nav className="student-nav-links">
              <NavLink to="/student/dashboard">Home</NavLink>
              <NavLink to="/student/menu">Food Order</NavLink>
              <NavLink to="/student/food-assistant">AI Assistant</NavLink>
              <NavLink to="/student/wallet">Wallet</NavLink>
              <NavLink to="/student/group-study">Group Study</NavLink>
              <NavLink to="/student/food-sharing">Food Share</NavLink>
            </nav>
            <div className="student-nav-right">
              <NavLink
                to="/student/notifications"
                title="Notifications"
                aria-label="Open notifications"
                className={({ isActive }) =>
                  `student-nav-notify ${isActive ? "student-nav-notify--active" : ""}`
                }
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 4a4 4 0 0 0-4 4v1.6c0 .8-.3 1.5-.8 2.1L6 13.3V15h12v-1.7l-1.2-1.6c-.5-.6-.8-1.3-.8-2.1V8a4 4 0 0 0-4-4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M10 17a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                {hasUnreadNotifications && <span className="student-nav-notify-dot" />}
              </NavLink>
              <NavLink
                to="/student/profile"
                title={user?.name || "Profile"}
                aria-label="View profile details"
                className={({ isActive }) =>
                  `student-nav-avatar student-nav-profile-icon ${isActive ? "student-nav-profile-icon--active" : ""}`
                }
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.9" />
                  <path d="M4.5 20c1.4-3.9 4.1-5.8 7.5-5.8s6.1 1.9 7.5 5.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                </svg>
              </NavLink>
              <button onClick={handleLogout} className="student-nav-logout">
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="student-content">
          <Outlet />
        </main>

        <footer className="sd-footer">
          <div className="sd-footer-inner">
            <div className="sd-footer-col">
              <div className="sd-footer-brand">
                <span className="sd-footer-logo">🎓</span>
                <span>Student Portal</span>
              </div>
              <p className="sd-footer-desc">
                Smart Campus Food &amp; Student Support System. Your one-stop platform for campus dining and student services.
              </p>
              <div className="sd-footer-socials">
                <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </div>
            </div>

            <div className="sd-footer-col">
              <h4 className="sd-footer-heading">Quick Links</h4>
              <nav className="sd-footer-links">
                <Link to="/student/menu">Food Order</Link>
                <Link to="/student/wallet">Wallet</Link>
                <Link to="/student/group-study">Group Study</Link>
                <Link to="/student/food-sharing">Food Sharing</Link>
                <Link to="/student/complaints">Complaints</Link>
              </nav>
            </div>

            <div className="sd-footer-col">
              <h4 className="sd-footer-heading">Contact Us</h4>
              <div className="sd-footer-contact">
                <p>📍 ICBT | International College of Business and Technology</p>
                <p>📞 +94 11 544 5000</p>
                <p>✉️ support@icbtjaffna.lk</p>
                <p>🕐 Mon – Fri: 8:00 AM – 6:00 PM</p>
              </div>
            </div>
          </div>

          <div className="sd-footer-bottom">
            <p>© {new Date().getFullYear()} Jaffna Branch · Student Portal. All rights reserved.</p>
          </div>
        </footer>
      </div>
    );
  }

  if (isCanteenAdmin) {
    return (
      <div className="ad-shell">
        <aside className="ad-sidebar">
          <div className="ad-sidebar-brand">
            <BrandLogo className="ad-sidebar-logo-img" />
            <div>
              <h3 className="ad-sidebar-title">{user?.canteenLabel || "Smart Campus"}</h3>
              <span className="ad-sidebar-role">Admin Panel</span>
            </div>
          </div>

          <nav className="ad-sidebar-nav">
            <NavLink to="/admin/dashboard" className={({ isActive }) => `ad-sidebar-link ${isActive ? "ad-sidebar-link--active" : ""}`}>
              <span className="ad-sidebar-icon">📊</span>Dashboard
            </NavLink>
            <NavLink to="/admin/menu" className={({ isActive }) => `ad-sidebar-link ${isActive ? "ad-sidebar-link--active" : ""}`}>
              <span className="ad-sidebar-icon">📝</span>Menu
            </NavLink>
            <NavLink to="/admin/food-sharing" className={({ isActive }) => `ad-sidebar-link ${isActive ? "ad-sidebar-link--active" : ""}`}>
              <span className="ad-sidebar-icon">🍱</span>Food Sharing
            </NavLink>
          </nav>

          <div className="ad-sidebar-bottom">
            <div className="ad-sidebar-user">
              <div className="ad-sidebar-avatar">{(user?.name || "A")[0].toUpperCase()}</div>
              <div className="ad-sidebar-user-info">
                <span className="ad-sidebar-user-name">{user?.name || "Admin"}</span>
                <span className="ad-sidebar-user-role">Canteen Owner</span>
              </div>
            </div>
            <button type="button" onClick={handleLogout} className="ad-sidebar-logout">Logout</button>
          </div>
        </aside>

        <div className="ad-main-wrap">
          <main className="ad-main-content">
            <Outlet />
          </main>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="dashboard-shell">
        <aside className="sidebar">
          <div>
            <h2 className="sidebar-title">SUPER ADMIN PANEL</h2>
            <p className="sidebar-subtitle">{user?.name}</p>
          </div>
          <nav className="sidebar-nav">
            <NavLink to="/admin/dashboard">Dashboard</NavLink>
            <NavLink to="/admin/group-study-feedback">Group Feedback</NavLink>
            <NavLink to="/admin/user-activity">User Activity</NavLink>
          </nav>
        </aside>

        <div className="dashboard-main">
          <header className="dashboard-header">
            <p>
              Logged in as <strong>admin</strong>
            </p>
            <button type="button" onClick={handleLogout} className="btn-danger">
              Logout
            </button>
          </header>

          <section className="dashboard-content">
            <Outlet />
          </section>

          <footer className="app-footer">
            <div className="footer-inner">
              <p>Smart Campus Food and Student Support System</p>
              <p>© {new Date().getFullYear()} Smart Campus</p>
            </div>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div>
          <h2 className="sidebar-title">VENDOR PANEL</h2>
          <p className="sidebar-subtitle">{user?.name}</p>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/vendor/dashboard">Dashboard</NavLink>
          <NavLink to="/vendor/menu">Manage menu</NavLink>
          <NavLink to="/vendor/orders">Orders</NavLink>
          <NavLink to="/vendor/revenue">Revenue</NavLink>        </nav>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-header">
          <p>
            Logged in as <strong>vendor</strong>
          </p>
          <button type="button" onClick={handleLogout} className="btn-danger">
            Logout
          </button>
        </header>

        <section className="dashboard-content">
          <Outlet />
        </section>

        <footer className="app-footer">
          <div className="footer-inner">
            <p>Smart Campus Food and Student Support System</p>
            <p>© {new Date().getFullYear()} Canteen Management</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;




