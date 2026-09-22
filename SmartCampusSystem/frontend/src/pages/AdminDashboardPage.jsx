import { Link } from "react-router-dom";

const AdminDashboardPage = () => {
  return (
    <div>
      <h2>Admin Dashboard</h2>
      <p>Manage users, vendors, complaints, and platform settings.</p>
      <div className="row-gap">
        <Link to="/admin/complaints">Manage Complaints</Link>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
