import api from "../../../services/api";

export const submitComplaint = async (payload) => {
  const response = await api.post("/complaints", payload);
  return response.data.data.complaint;
};

export const fetchComplaints = async () => {
  const response = await api.get("/complaints");
  return response.data.data.complaints;
};

export const fetchComplaintById = async (complaintId) => {
  const response = await api.get(`/complaints/${complaintId}`);
  return response.data.data.complaint;
};

export const updateComplaintStatus = async (complaintId, payload) => {
  const response = await api.patch(`/complaints/${complaintId}/status`, payload);
  return response.data.data.complaint;
};
