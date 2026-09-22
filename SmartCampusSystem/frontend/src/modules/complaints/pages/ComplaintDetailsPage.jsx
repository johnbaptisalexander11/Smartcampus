import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import ComplaintStatusBadge from "../components/ComplaintStatusBadge";
import { fetchComplaintById, updateComplaintStatus } from "../services/complaintService";

const ComplaintDetailsPage = () => {
  const { complaintId } = useParams();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [status, setStatus] = useState("open");
  const [adminNote, setAdminNote] = useState("");
  const [error, setError] = useState("");

  const loadComplaint = async () => {
    try {
      const data = await fetchComplaintById(complaintId);
      setComplaint(data);
      setStatus(data.status);
      setAdminNote(data.adminNote || "");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not load complaint");
    }
  };

  useEffect(() => {
    loadComplaint();
  }, [complaintId]);

  const handleStatusUpdate = async () => {
    setError("");
    try {
      await updateComplaintStatus(complaintId, { status, adminNote });
      await loadComplaint();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not update status");
    }
  };

  if (!complaint) {
    return <p>{error || "Loading complaint..."}</p>;
  }

  return (
    <div>
      <h2>Complaint Status Tracking</h2>
      <div className="card">
        <h4>{complaint.title}</h4>
        <p>{complaint.description}</p>
        <p>
          Category: {complaint.category} | Status: <ComplaintStatusBadge status={complaint.status} />
        </p>
        <p>Admin Note: {complaint.adminNote || "No note yet"}</p>
      </div>

      {user?.role === "admin" && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3>Admin Update Status</h3>
          <div className="row-gap">
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
            <textarea
              placeholder="Admin note"
              rows={3}
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
            />
            <button onClick={handleStatusUpdate}>Update Complaint</button>
          </div>
        </div>
      )}

      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </div>
  );
};

export default ComplaintDetailsPage;
