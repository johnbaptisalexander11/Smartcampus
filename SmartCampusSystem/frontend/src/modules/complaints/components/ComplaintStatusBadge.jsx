const colorMap = {
  open: "#2563eb",
  in_progress: "#ea580c",
  resolved: "#16a34a",
  rejected: "#dc2626",
};

const ComplaintStatusBadge = ({ status }) => {
  return (
    <span
      style={{
        backgroundColor: colorMap[status] || "#6b7280",
        color: "#fff",
        padding: "0.2rem 0.5rem",
        borderRadius: 999,
        fontSize: 12,
      }}
    >
      {status}
    </span>
  );
};

export default ComplaintStatusBadge;
