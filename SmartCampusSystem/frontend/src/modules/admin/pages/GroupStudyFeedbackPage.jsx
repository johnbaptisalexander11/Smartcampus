import { useEffect, useMemo, useState } from "react";
import { fetchGroupStudyFeedbackForAdmin } from "../services/adminService";

const GroupStudyFeedbackPage = () => {
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    fetchGroupStudyFeedbackForAdmin()
      .then(setGroups)
      .catch((apiError) => {
        setError(apiError.response?.data?.message || "Could not load group feedback");
      });
  }, []);

  const entries = useMemo(() => {
    const list = groups.flatMap((group) =>
      (group.feedbacks || []).map((feedback) => ({
        ...feedback,
        groupId: group._id,
        groupName: group.name,
        groupSubject: group.subject,
      }))
    );

    const filtered = typeFilter === "all" ? list : list.filter((entry) => entry.type === typeFilter);
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [groups, typeFilter]);

  return (
    <div className="gsf-page">
      <div className="gsf-header">
        <h2 className="gsf-title">Group Study Complaints & Feedback</h2>
        <p className="gsf-subtitle">Students can submit feedback per study group. Review all entries here.</p>
      </div>

      <div className="gsf-filter-row">
        <button
          className={`gsf-filter-btn ${typeFilter === "all" ? "gsf-filter-btn--active" : ""}`}
          onClick={() => setTypeFilter("all")}
        >
          All
        </button>
        <button
          className={`gsf-filter-btn ${typeFilter === "feedback" ? "gsf-filter-btn--active" : ""}`}
          onClick={() => setTypeFilter("feedback")}
        >
          Feedback
        </button>
        <button
          className={`gsf-filter-btn ${typeFilter === "complaint" ? "gsf-filter-btn--active" : ""}`}
          onClick={() => setTypeFilter("complaint")}
        >
          Complaints
        </button>
      </div>

      {error && <p className="gsf-error">{error}</p>}

      <div className="gsf-list">
        {!entries.length ? (
          <p className="gsf-empty">No entries yet.</p>
        ) : (
          entries.map((entry) => (
            <article key={entry._id} className="gsf-card">
              <div className="gsf-card-top">
                <div>
                  <h4 className="gsf-group-name">{entry.groupName}</h4>
                  <p className="gsf-group-sub">{entry.groupSubject}</p>
                </div>
                <span className={`gsf-type gsf-type--${entry.type}`}>{entry.type}</span>
              </div>

              <p className="gsf-message">{entry.message}</p>

              <div className="gsf-meta">
                <span>{entry.user?.name || "User"} ({entry.user?.email || "No email"})</span>
                <span>{new Date(entry.createdAt).toLocaleString()}</span>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
};

export default GroupStudyFeedbackPage;
