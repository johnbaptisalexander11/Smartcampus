import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAdminComplaints } from "../services/adminService";

const AdminComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    fetchAdminComplaints().then(setComplaints).catch(() => {});
  }, []);

  return (
    <div>
      <h2>Complaints Management</h2>
      <div className="row-gap">
        {complaints.map((complaint) => (
          <div className="card" key={complaint._id}>
            <h4>{complaint.title}</h4>
            <p>{complaint.description}</p>
            <p>Status: {complaint.status}</p>
            <Link to={`/complaints/${complaint._id}`}>Open Complaint</Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminComplaintsPage;
