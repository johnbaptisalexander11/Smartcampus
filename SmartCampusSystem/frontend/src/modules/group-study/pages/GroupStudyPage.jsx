import { useEffect, useState } from "react";
import GroupCard from "../components/GroupCard";
import { createStudyGroup, fetchStudyGroups, joinStudyGroup } from "../services/groupStudyService";

const MAX_DESCRIPTION_WORDS = 20;

const countWords = (value = "") =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const GroupStudyPage = () => {
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    description: "",
    roomBookingNote: "",
    targetStudyYear: "",
    targetSemester: "",
    maxMembers: "",
    location: "",
    sessionTime: "",
  });

  const loadGroups = async () => {
    try {
      const data = await fetchStudyGroups();
      setGroups(data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not load study groups");
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const [formErrors, setFormErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateGroupForm = () => {
    const e = {};
    if (!formData.name.trim()) e.name = "Group name is required";
    else if (formData.name.trim().length < 3) e.name = "Name must be at least 3 characters";
    if (!formData.subject.trim()) e.subject = "Subject is required";
    if (!formData.targetStudyYear || Number(formData.targetStudyYear) < 1 || Number(formData.targetStudyYear) > 4) {
      e.targetStudyYear = "Year must be between 1 and 4";
    }
    if (!formData.targetSemester || ![1, 2].includes(Number(formData.targetSemester))) {
      e.targetSemester = "Semester must be 1 or 2";
    }
    if (!formData.maxMembers || Number(formData.maxMembers) < 2) e.maxMembers = "At least 2 members required";
    else if (Number(formData.maxMembers) > 50) e.maxMembers = "Maximum 50 members allowed";
    if (countWords(formData.description) > MAX_DESCRIPTION_WORDS) {
      e.description = `Description must be ${MAX_DESCRIPTION_WORDS} words or less`;
    }
    if (!formData.location.trim()) e.location = "Location is required";
    if (!formData.sessionTime) e.sessionTime = "Session time is required";
    else if (new Date(formData.sessionTime) <= new Date()) e.sessionTime = "Session time must be in the future";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const descriptionWordCount = countWords(formData.description);

  const handleCreate = async (event) => {
    event.preventDefault();
    setError("");
    if (!validateGroupForm()) {
      setError("Please fix the highlighted form errors before creating the group.");
      return;
    }
    try {
      await createStudyGroup(formData);
      setFormData({
        name: "",
        subject: "",
        description: "",
        roomBookingNote: "",
        targetStudyYear: "",
        targetSemester: "",
        maxMembers: "",
        location: "",
        sessionTime: "",
      });
      setShowForm(false);
      await loadGroups();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not create group");
    }
  };

  const handleJoin = async (groupId) => {
    try {
      await joinStudyGroup(groupId);
      await loadGroups();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not join group");
    }
  };

  return (
    <div className="gs-page">
      {/* Header */}
      <div className="gs-header">
        <div className="gs-header-text">
          <h2 className="gs-title">Group Study</h2>
          <p className="gs-subtitle">Find study groups or create your own</p>
        </div>
        <button
          type="button"
          className={`gs-toggle-btn ${showForm ? "gs-toggle-btn--close" : ""}`}
          onClick={() => setShowForm((p) => !p)}
        >
          {showForm ? "✕ Close" : "+ New Group"}
        </button>
      </div>

      {/* Stats strip */}
      <div className="gs-stats">
        <div className="gs-stat">
          <span className="gs-stat-num">{groups.length}</span>
          <span className="gs-stat-label">Groups</span>
        </div>
        <div className="gs-stat">
          <span className="gs-stat-num">
            {groups.reduce((s, g) => s + (g.members?.length || 0), 0)}
          </span>
          <span className="gs-stat-label">Members</span>
        </div>
        <div className="gs-stat">
          <span className="gs-stat-num">
            {groups.reduce((s, g) => s + (g.materials?.length || 0), 0)}
          </span>
          <span className="gs-stat-label">Materials</span>
        </div>
      </div>

      {error && <p className="gs-error">{error}</p>}

      {showForm && (
        <form onSubmit={handleCreate} className="gs-form" noValidate>
          <h3 className="gs-form-heading">Create a New Study Group</h3>
          <div className="gs-form-grid">
            <div>
              <input name="name" placeholder="Group name" value={formData.name} onChange={handleChange} required />
              {formErrors.name && <p className="gs-error">{formErrors.name}</p>}
            </div>
            <div>
              <input name="subject" placeholder="Subject" value={formData.subject} onChange={handleChange} required />
              {formErrors.subject && <p className="gs-error">{formErrors.subject}</p>}
            </div>
            <div>
              <select
                name="targetStudyYear"
                value={formData.targetStudyYear}
                onChange={handleChange}
                required
              >
                <option value="">Select year</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
              {formErrors.targetStudyYear && <p className="gs-error">{formErrors.targetStudyYear}</p>}
            </div>
            <div>
              <select
                name="targetSemester"
                value={formData.targetSemester}
                onChange={handleChange}
                required
              >
                <option value="">Select semester</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
              {formErrors.targetSemester && <p className="gs-error">{formErrors.targetSemester}</p>}
            </div>
            <div>
              <input
                name="maxMembers"
                type="number"
                min="2"
                placeholder="Max members"
                value={formData.maxMembers}
                onChange={handleChange}
                required
              />
              {formErrors.maxMembers && <p className="gs-error">{formErrors.maxMembers}</p>}
            </div>
            <div>
              <input
                name="location"
                placeholder="Location"
                value={formData.location}
                onChange={handleChange}
                required
              />
              {formErrors.location && <p className="gs-error">{formErrors.location}</p>}
            </div>
            <div>
              <input
                name="sessionTime"
                type="datetime-local"
                value={formData.sessionTime}
                onChange={handleChange}
                required
              />
              {formErrors.sessionTime && <p className="gs-error">{formErrors.sessionTime}</p>}
            </div>
            <div>
              <input
                name="roomBookingNote"
                placeholder="Room booking note (optional)"
                value={formData.roomBookingNote}
                onChange={handleChange}
              />
            </div>
          </div>
          <textarea
            name="description"
            placeholder="Description (optional)"
            value={formData.description}
            onChange={handleChange}
            rows={3}
          />
          <p style={{ marginTop: 6, fontSize: 13, color: descriptionWordCount > MAX_DESCRIPTION_WORDS ? "#c62828" : "#6b7280" }}>
            {descriptionWordCount}/{MAX_DESCRIPTION_WORDS} words
          </p>
          {formErrors.description && <p className="gs-error">{formErrors.description}</p>}
          <button type="submit" className="gs-create-btn">Create Group</button>
        </form>
      )}

      {/* Group grid */}
      <div className="gs-grid">
        {!groups.length && !error && (
          <div className="gs-empty">
            <span className="gs-empty-icon">📖</span>
            <p>No study groups yet</p>
            <span className="gs-empty-hint">Create one to get started!</span>
          </div>
        )}
        {groups.map((group) => (
          <GroupCard key={group._id} group={group} onJoin={handleJoin} />
        ))}
      </div>
    </div>
  );
};

export default GroupStudyPage;
