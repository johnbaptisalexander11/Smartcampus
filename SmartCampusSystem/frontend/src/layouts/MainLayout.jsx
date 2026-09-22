import { Outlet } from "react-router-dom";

const MainLayout = () => {
  return (
    <div className="main-layout">
      <header className="topbar">
        <div className="container row-between">
          <h1 className="brand">Smart Campus</h1>
        </div>
      </header>

      <main className="container content-area">
        <Outlet />
      </main>

      <footer className="app-footer">
        <div className="container footer-inner">
          <p>Smart Campus Food and Student Support System</p>
          <p>© {new Date().getFullYear()} Smart Campus</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
