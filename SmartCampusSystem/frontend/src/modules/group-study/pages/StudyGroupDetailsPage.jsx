import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import {
  addSharedNote,
  addTaskToGroup,
  fetchStudyGroupById,
  markAttendance,
  updateRoomBookingPlaceholder,
  updateTaskStatus,
  uploadMaterial,
  deleteMaterial,
  updateSharedNote,
  deleteSharedNote,
  submitGroupFeedback,
} from "../services/groupStudyService";
import GroupChat from "../components/GroupChat";

const TASK_BADGE = {
  todo: { label: "To Do", bg: "#fffbeb", color: "#d97706" },
  in_progress: { label: "In Progress", bg: "#f0fdf4", color: "#16a34a" },
  done: { label: "Done", bg: "#dcfce7", color: "#166534" },
};

const NAV_ITEMS = [
  { key: "chat", icon: "💬", label: "Group Chat" },
  { key: "tasks", icon: "📋", label: "Task Tracking" },
  { key: "notes", icon: "🗒️", label: "Shared Notes" },
  { key: "materials", icon: "📎", label: "Study Materials" },
  { key: "attendance", icon: "✅", label: "Attendance" },
  { key: "room", icon: "🏫", label: "Room Booking" },
  { key: "feedback", icon: "FB", label: "Feedback & Complaints" },
];


const MATERIAL_CATEGORIES = [
  { value: "other", label: "All" },
  { value: "notes", label: "Notes" },
  { value: "past-papers", label: "Past Papers" },
  { value: "slides", label: "Slides" },
];

const CATEGORY_BADGE = {
  notes: { bg: "#dbeafe", color: "#1e40af" },
  "past-papers": { bg: "#fef3c7", color: "#92400e" },
  slides: { bg: "#ede9fe", color: "#5b21b6" },
  other: { bg: "#f3f4f6", color: "#374151" },
};

const StudyGroupDetailsPage = () => {
  const { groupId } = useParams();
  const [searchParams] = useSearchParams();
  const materialsRef = useRef(null);
  const [group, setGroup] = useState(null);
  const [error, setError] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [roomBookingNote, setRoomBookingNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [activeNav, setActiveNav] = useState("chat");

  // Notes editing state
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editNoteTitle, setEditNoteTitle] = useState("");
  const [editNoteContent, setEditNoteContent] = useState("");

  // Materials category state
  const [uploadCategory, setUploadCategory] = useState("other");
  const [filterCategory, setFilterCategory] = useState("other");
  const [feedbackType, setFeedbackType] = useState("feedback");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const loadGroup = async () => {
    try {
      const data = await fetchStudyGroupById(groupId);
      setGroup(data);
      setRoomBookingNote(data.roomBookingNote || "");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not load study group");
    }
  };

  useEffect(() => { loadGroup(); }, [groupId]);

  useEffect(() => {
    if (group && searchParams.get("tab") === "materials") {
      setActiveNav("materials");
    }
  }, [group, searchParams]);

  const handleAddTask = async () => {
    if (!taskTitle.trim()) return;
    await addTaskToGroup(groupId, { title: taskTitle });
    setTaskTitle("");
    await loadGroup();
  };

  const handleUpdateTaskStatus = async (taskId, status) => {
    await updateTaskStatus(groupId, taskId, { status });
    await loadGroup();
  };

  const handleAddNote = async () => {
    if (!noteTitle.trim()) return;
    await addSharedNote(groupId, { title: noteTitle, content: noteContent });
    setNoteTitle("");
    setNoteContent("");
    await loadGroup();
  };

  const handleEditNote = (note) => {
    setEditingNoteId(note._id);
    setEditNoteTitle(note.title);
    setEditNoteContent(note.content || "");
  };

  const handleSaveNote = async () => {
    if (!editNoteTitle.trim()) return;
    try {
      await updateSharedNote(groupId, editingNoteId, {
        title: editNoteTitle,
        content: editNoteContent,
      });
      setEditingNoteId(null);
      setEditNoteTitle("");
      setEditNoteContent("");
      await loadGroup();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not update note");
    }
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setEditNoteTitle("");
    setEditNoteContent("");
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      await deleteSharedNote(groupId, noteId);
      await loadGroup();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not delete note");
    }
  };

  const handleMarkAttendance = async () => {
    const memberIds = (group?.members || []).map((m) => m.user?._id).filter(Boolean);
    await markAttendance(groupId, { presentMembers: memberIds });
    await loadGroup();
  };

  const handleUpdateRoomBooking = async () => {
    await updateRoomBookingPlaceholder(groupId, { roomBookingNote });
    await loadGroup();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", uploadCategory);
      const token = JSON.parse(localStorage.getItem("canteen_auth"))?.token;
      const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_URL}/group-study/${groupId}/materials`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Upload failed");
      }
      await loadGroup();
    } catch (apiError) {
      setError(apiError.message || "File upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    try {
      await deleteMaterial(groupId, materialId);
      await loadGroup();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not delete material");
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) return;
    try {
      await submitGroupFeedback(groupId, {
        type: feedbackType,
        message: feedbackMessage.trim(),
      });
      setFeedbackMessage("");
      await loadGroup();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not submit feedback");
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType === "application/pdf") return "📄";
    if (fileType?.includes("presentation") || fileType?.includes("powerpoint")) return "📊";
    return "📝";
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const API_BASE = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace("/api", "")
    : "http://localhost:5000";

  if (!group) {
    return (
      <div className="gd-page">
        <div className="gd-loading">{error || "Loading study group..."}</div>
      </div>
    );
  }

  const memberCount = group.members?.length || 0;
  const sessionDisplay = group.sessionTime
    ? new Date(group.sessionTime).toLocaleString()
    : "Not scheduled";

  const filteredMaterials = filterCategory === "other"
    ? (group.materials || [])
    : (group.materials || []).filter((m) => m.category === filterCategory);

  return (
    <div className="gd-page">
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <Link to="/student/group-study" className="gd-back">Back to Groups</Link>
        {group.onlineMeeting?.isActive && group.onlineMeeting?.meetingUrl && (
          <button
            className="gd-btn-add"
            onClick={() => window.open(group.onlineMeeting.meetingUrl, "_blank", "noopener,noreferrer")}
          >
            Join Meeting
          </button>
        )}
      </div>

      <div className="gd-layout">
        {/* Sidebar */}
        <aside className="gd-sidebar">
          <div className="gd-sidebar-header">
            <span className="gd-sidebar-logo">📚</span>
            <h3 className="gd-sidebar-title">{group.name}</h3>
          </div>

          <nav className="gd-nav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                className={`gd-nav-item ${activeNav === item.key ? "gd-nav-item--active" : ""}`}
                onClick={() => setActiveNav(item.key)}
              >
                <span className="gd-nav-icon">{item.icon}</span>
                <span className="gd-nav-label">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="gd-sidebar-footer">
            <p className="gd-sidebar-members">👥 {memberCount}/{group.maxMembers}</p>
            <p className="gd-sidebar-members-label">Members</p>
            <div className="gd-sidebar-chips">
              <span className="gd-sidebar-chip">📍 {group.location || "TBD"}</span>
              <span className="gd-sidebar-chip">🕐 {sessionDisplay}</span>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="gd-main">
          {error && <p className="gd-error">{error}</p>}

          {/* Chat */}
          {activeNav === "chat" && (
            <GroupChat groupId={groupId} />
          )}

          {/* Tasks */}
          {activeNav === "tasks" && (
            <div className="gd-section">
              <div className="wallet-card" style={{ marginBottom: 12 }}>
                <h3 className="gd-card-title" style={{ marginBottom: 6 }}>Task Tracking Purpose</h3>
                <p className="wallet-small" style={{ marginBottom: 8 }}>
                  Split study work, track progress, and keep every member clear on pending and completed tasks.
                </p>
                <div className="wallet-list" style={{ gap: 8 }}>
                  <div className="wallet-list-item">
                    <span className="wallet-list-date">Total</span>
                    <span className="wallet-list-amount">{group.tasks?.length || 0}</span>
                  </div>
                  <div className="wallet-list-item">
                    <span className="wallet-list-date">To Do</span>
                    <span className="wallet-list-amount">{(group.tasks || []).filter((t) => t.status === "todo").length}</span>
                  </div>
                  <div className="wallet-list-item">
                    <span className="wallet-list-date">In Progress</span>
                    <span className="wallet-list-amount">{(group.tasks || []).filter((t) => t.status === "in_progress").length}</span>
                  </div>
                  <div className="wallet-list-item">
                    <span className="wallet-list-date">Done</span>
                    <span className="wallet-list-amount">{(group.tasks || []).filter((t) => t.status === "done").length}</span>
                  </div>
                </div>
              </div>
              <div className="gd-card-head">
                <h3 className="gd-card-title">📋 Task Tracking</h3>
                <span className="gd-card-count">{group.tasks?.length || 0}</span>
              </div>
              <div className="gd-input-row">
                <input className="gd-input" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Add a new study task (e.g., Revise Unit 3 summary)" />
                <button className="gd-btn-add" onClick={handleAddTask}>Add</button>
              </div>
              {group.tasks?.length > 0 ? (
                <div className="gd-task-list">
                  {group.tasks.map((task) => {
                    const badge = TASK_BADGE[task.status] || TASK_BADGE.todo;
                    return (
                      <div key={task._id} className="gd-task-item">
                        <div className="gd-task-info">
                          <span className="gd-task-name">{task.title}</span>
                          <span className="gd-task-badge" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                        </div>
                        <select className="gd-task-select" value={task.status} onChange={(e) => handleUpdateTaskStatus(task._id, e.target.value)}>
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="gd-empty-text">No tasks yet</p>
              )}
            </div>
          )}

          {/* Notes — enhanced with edit/delete */}
          {activeNav === "notes" && (
            <div className="gd-section">
              <div className="gd-card-head">
                <h3 className="gd-card-title">🗒️ Shared Notes</h3>
                <span className="gd-card-count">{group.notes?.length || 0}</span>
              </div>
              <div className="gd-note-form">
                <input className="gd-input" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Note title..." />
                <textarea className="gd-textarea" value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Write your note..." rows={3} />
                <button className="gd-btn-add" onClick={handleAddNote}>Add Note</button>
              </div>
              {group.notes?.length > 0 ? (
                <div className="gd-notes-list">
                  {group.notes.map((note) => (
                    <div key={note._id} className="gd-note-item">
                      {editingNoteId === note._id ? (
                        <div className="gd-note-edit">
                          <input
                            className="gd-input"
                            value={editNoteTitle}
                            onChange={(e) => setEditNoteTitle(e.target.value)}
                            placeholder="Note title..."
                          />
                          <textarea
                            className="gd-textarea"
                            value={editNoteContent}
                            onChange={(e) => setEditNoteContent(e.target.value)}
                            placeholder="Note content..."
                            rows={3}
                          />
                          <div className="gd-note-edit-actions">
                            <button className="gd-btn-add" onClick={handleSaveNote}>Save</button>
                            <button className="gd-btn-secondary" onClick={handleCancelEditNote}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="gd-note-header">
                            <h5 className="gd-note-title">{note.title}</h5>
                            <div className="gd-note-actions">
                              <button className="gd-note-action-btn" onClick={() => handleEditNote(note)} title="Edit">✏️</button>
                              <button className="gd-note-action-btn gd-note-action-btn--del" onClick={() => handleDeleteNote(note._id)} title="Delete">🗑️</button>
                            </div>
                          </div>
                          <p className="gd-note-content">{note.content}</p>
                          {note.uploadedBy && (
                            <span className="gd-note-author">Last edited by: {note.uploadedBy.name || "Unknown"}</span>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="gd-empty-text">No notes yet</p>
              )}
            </div>
          )}

          {/* Materials — enhanced with categories */}
          {activeNav === "materials" && (
            <div className="gd-section" ref={materialsRef}>
              <div className="gd-card-head">
                <h3 className="gd-card-title">📎 Study Materials</h3>
                <span className="gd-card-count">{group.materials?.length || 0}</span>
              </div>

              <div className="gd-mat-upload-row">
                <div className="gd-mat-upload-left">
                  <p className="gd-hint">Upload PDF, Word, or PowerPoint files (max 10 MB)</p>
                  <label className="gd-upload-label">
                    <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={handleFileUpload} disabled={uploading} style={{ display: "none" }} />
                    <span className={`gd-upload-btn ${uploading ? "gd-upload-btn--busy" : ""}`}>{uploading ? "Uploading..." : "📁 Choose File"}</span>
                  </label>
                </div>
                <div className="gd-mat-category-select">
                  <label className="gd-mat-cat-label">Category:</label>
                  <select className="gd-task-select" value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)}>
                    <option value="notes">Notes</option>
                    <option value="past-papers">Past Papers</option>
                    <option value="slides">Slides</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="gd-mat-filter-row">
                {MATERIAL_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    className={`gd-mat-filter-btn ${filterCategory === cat.value ? "gd-mat-filter-btn--active" : ""}`}
                    onClick={() => setFilterCategory(cat.value)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {filteredMaterials.length > 0 ? (
                <div className="gd-materials-list">
                  {filteredMaterials.map((mat) => {
                    const catBadge = CATEGORY_BADGE[mat.category] || CATEGORY_BADGE.other;
                    return (
                      <div key={mat._id} className="gd-mat-item">
                        <span className="gd-mat-icon">{getFileIcon(mat.fileType)}</span>
                        <div className="gd-mat-info">
                          <a href={`${API_BASE}/uploads/${mat.filename}`} target="_blank" rel="noopener noreferrer" className="gd-mat-name">{mat.originalName}</a>
                          <span className="gd-mat-meta">
                            {formatFileSize(mat.fileSize)} · {mat.uploadedBy?.name || "Unknown"}
                            <span className="gd-mat-cat-badge" style={{ background: catBadge.bg, color: catBadge.color }}>
                              {mat.category || "other"}
                            </span>
                          </span>
                        </div>
                        <button className="gd-mat-delete" onClick={() => handleDeleteMaterial(mat._id)} title="Delete">🗑️</button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="gd-empty-text">
                  {filterCategory !== "other" ? `No ${filterCategory} materials` : "No materials uploaded yet"}
                </p>
              )}
            </div>
          )}

          {/* Attendance */}
          {activeNav === "attendance" && (
            <div className="gd-section">
              <div className="gd-card-head">
                <h3 className="gd-card-title">✅ Attendance</h3>
                <span className="gd-card-count">{group.attendance?.length || 0}</span>
              </div>
              <button className="gd-btn-action" onClick={handleMarkAttendance}>Mark Current Session</button>
              {group.attendance?.length > 0 ? (
                <div className="gd-attend-list">
                  {group.attendance.map((entry) => (
                    <div key={entry._id} className="gd-attend-item">
                      <span className="gd-attend-date">{new Date(entry.sessionDate).toLocaleDateString()}</span>
                      <span className="gd-attend-count">{entry.presentMembers.length} present</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="gd-empty-text">No attendance records yet</p>
              )}
            </div>
          )}

          {/* Room Booking */}
          {activeNav === "room" && (
            <div className="gd-section">
              <div className="gd-card-head">
                <h3 className="gd-card-title">🏫 Room Booking</h3>
              </div>
              <div className="gd-input-row">
                <input className="gd-input" value={roomBookingNote} onChange={(e) => setRoomBookingNote(e.target.value)} placeholder="Room booking note..." />
                <button className="gd-btn-add" onClick={handleUpdateRoomBooking}>Update</button>
              </div>

              {group.onlineMeeting?.isActive && group.onlineMeeting?.meetingUrl && (
                <div className="gd-note-item" style={{ marginTop: "0.6rem" }}>
                  <p className="gd-note-content">
                    Online meeting ready:{" "}
                    <a href={group.onlineMeeting.meetingUrl} target="_blank" rel="noreferrer">
                      {group.onlineMeeting.meetingUrl}
                    </a>
                  </p>
                  {group.onlineMeeting.scheduledAt && (
                    <p className="gd-note-content" style={{ marginTop: 6 }}>
                      Scheduled: {new Date(group.onlineMeeting.scheduledAt).toLocaleString()}
                    </p>
                  )}
                  <div style={{ marginTop: 8 }}>
                    <button
                      className="gd-btn-add"
                      onClick={() => window.open(group.onlineMeeting.meetingUrl, "_blank", "noopener,noreferrer")}
                    >
                      Join Meeting
                    </button>
                  </div>
                </div>
              )}

              {group.roomBookingNote && (
                <div className="gd-note-item" style={{ marginTop: "0.6rem" }}>
                  <p className="gd-note-content">📌 {group.roomBookingNote}</p>
                </div>
              )}
            </div>
          )}

          {/* Feedback and Complaints */}
          {activeNav === "feedback" && (
            <div className="gd-section">
              <div className="gd-card-head">
                <h3 className="gd-card-title">Feedback and Complaints</h3>
                <span className="gd-card-count">{group.feedbacks?.length || 0}</span>
              </div>
              <div className="gd-feedback-form">
                <select
                  className="gd-task-select"
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value)}
                >
                  <option value="feedback">Feedback</option>
                  <option value="complaint">Complaint</option>
                </select>
                <textarea
                  className="gd-textarea"
                  rows={4}
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="Write your feedback or complaint about this group..."
                />
                <button className="gd-btn-add" onClick={handleSubmitFeedback}>Submit</button>
              </div>

              {group.feedbacks?.length ? (
                <div className="gd-feedback-list">
                  {[...group.feedbacks]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map((entry) => (
                      <div key={entry._id} className="gd-feedback-item">
                        <div className="gd-feedback-head">
                          <span className={`gd-feedback-type gd-feedback-type--${entry.type}`}>{entry.type}</span>
                          <span className="gd-feedback-meta">
                            {entry.user?.name || "User"} · {new Date(entry.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="gd-feedback-message">{entry.message}</p>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="gd-empty-text">No feedback submitted yet for this group.</p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudyGroupDetailsPage;



