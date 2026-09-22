import api from "../../../services/api";

export const createStudyGroup = async (payload) => {
  const response = await api.post("/group-study", payload);
  return response.data.data.group;
};

export const fetchStudyGroups = async () => {
  const response = await api.get("/group-study");
  return response.data.data.groups;
};

export const fetchStudyGroupById = async (groupId) => {
  const response = await api.get(`/group-study/${groupId}`);
  return response.data.data.group;
};

export const joinStudyGroup = async (groupId) => {
  const response = await api.post(`/group-study/${groupId}/join`);
  return response.data.data.group;
};

export const addTaskToGroup = async (groupId, payload) => {
  const response = await api.post(`/group-study/${groupId}/tasks`, payload);
  return response.data.data.tasks;
};

export const updateTaskStatus = async (groupId, taskId, payload) => {
  const response = await api.patch(`/group-study/${groupId}/tasks/${taskId}`, payload);
  return response.data.data.task;
};

export const addSharedNote = async (groupId, payload) => {
  const response = await api.post(`/group-study/${groupId}/notes`, payload);
  return response.data.data.notes;
};

export const markAttendance = async (groupId, payload) => {
  const response = await api.post(`/group-study/${groupId}/attendance`, payload);
  return response.data.data.attendance;
};

export const updateRoomBookingPlaceholder = async (groupId, payload) => {
  const response = await api.patch(`/group-study/${groupId}/room-booking`, payload);
  return response.data.data.group;
};

export const createOnlineMeeting = async (groupId, payload = {}) => {
  const response = await api.post(`/group-study/${groupId}/online-meeting`, payload);
  return response.data.data.onlineMeeting;
};

export const uploadMaterial = async (groupId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post(`/group-study/${groupId}/materials`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data.materials;
};

export const deleteMaterial = async (groupId, materialId) => {
  const response = await api.delete(`/group-study/${groupId}/materials/${materialId}`);
  return response.data.data.materials;
};

export const fetchMessages = async (groupId, before) => {
  const params = before ? { before } : {};
  const response = await api.get(`/group-study/${groupId}/messages`, { params });
  return response.data.data.messages;
};

export const sendMessageRest = async (groupId, content) => {
  const response = await api.post(`/group-study/${groupId}/messages`, { content });
  return response.data.data.message;
};

export const updateSharedNote = async (groupId, noteId, data) => {
  const response = await api.patch(`/group-study/${groupId}/notes/${noteId}`, data);
  return response.data.data.notes;
};

export const deleteSharedNote = async (groupId, noteId) => {
  const response = await api.delete(`/group-study/${groupId}/notes/${noteId}`);
  return response.data.data.notes;
};

export const submitGroupFeedback = async (groupId, payload) => {
  const response = await api.post(`/group-study/${groupId}/feedback`, payload);
  return response.data.data.feedbacks;
};
