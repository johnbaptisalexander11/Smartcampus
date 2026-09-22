import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ComplaintStatusBadge from "../components/ComplaintStatusBadge";
import { fetchComplaints } from "../services/complaintService";

const ComplaintListPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchComplaints()
      .then(setComplaints)
      .catch((apiError) => setError(apiError.response?.data?.message || "Could not load complaints"));
  }, []);

  return (
    <div>
      <h2>Complaint List</h2>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <div className="row-gap">
        {complaints.map((complaint) => (
          <div key={complaint._id} className="card">
            <h4>{complaint.title}</h4>
            <p>{complaint.description}</p>
            <p>
              Status: <ComplaintStatusBadge status={complaint.status} />
            </p>
            <Link to={`/complaints/${complaint._id}`}>Track complaint</Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComplaintListPage;
