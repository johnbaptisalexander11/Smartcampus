import { Link } from "react-router-dom";

const SUBJECT_COLORS = [
  { bg: "#f0fdf4", color: "#166534" },
  { bg: "#ecfdf5", color: "#065f46" },
  { bg: "#fffbeb", color: "#92400e" },
  { bg: "#fef3c7", color: "#d97706" },
  { bg: "#dcfce7", color: "#15803d" },
  { bg: "#fff7ed", color: "#9a3412" },
  { bg: "#f0fdf4", color: "#16a34a" },
];

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const GroupCard = ({ group, onJoin }) => {
  const memberCount = group.members?.length || 0;
  const materialCount = group.materials?.length || 0;
  const maxMembers = group.maxMembers || 1;
  const fillPercent = Math.min((memberCount / maxMembers) * 100, 100);
  const isFull = memberCount >= maxMembers;

  const sessionDisplay = group.sessionTime
    ? new Date(group.sessionTime).toLocaleString()
    : "Not scheduled";

  const sc = SUBJECT_COLORS[hashStr(group.subject || "") % SUBJECT_COLORS.length];

  return (
    <div className="gc-card">
      {/* Accent header */}
      <div className="gc-accent" />

      <div className="gc-body">
        {/* Subject tag + material badge */}
        <div className="gc-tags-row">
          <span className="gc-subject-tag" style={{ background: sc.bg, color: sc.color }}>
            {group.subject}
          </span>
          {materialCount > 0 && (
            <span className="gc-file-badge">📎 {materialCount}</span>
          )}
        </div>

        {/* Title */}
        <h4 className="gc-name">{group.name}</h4>

        {/* Description */}
        {group.description && <p className="gc-desc">{group.description}</p>}

        {/* Inline metadata */}
        <div className="gc-meta-row">
          <span className="gc-meta-chip">📍 {group.location || "TBD"}</span>
          <span className="gc-meta-chip">🕐 {sessionDisplay}</span>
          <span className="gc-meta-chip">Year {group.targetStudyYear || "-"} � Sem {group.targetSemester || "-"}</span>
        </div>

        {/* Member progress */}
        <div className="gc-progress-area">
          <div className="gc-progress-header">
            <span className="gc-progress-label">
              👥 {memberCount} / {maxMembers} members
            </span>
            {isFull && <span className="gc-full-tag">Full</span>}
          </div>
          <div className="gc-progress-track">
            <div
              className={`gc-progress-fill ${isFull ? "gc-progress-fill--full" : ""}`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="gc-actions">
          <button className="gc-btn gc-btn--join" onClick={() => onJoin(group._id)}>
            Join
          </button>
          <Link to={`/student/group-study/${group._id}`} className="gc-btn gc-btn--open">
            Open
          </Link>
          <Link to={`/student/group-study/${group._id}?tab=materials`} className="gc-btn gc-btn--upload">
            Upload
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GroupCard;

