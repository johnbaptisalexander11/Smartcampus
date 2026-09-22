const STATUS_CONFIG = {
  placed: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  accepted: { bg: "#ecfdf5", color: "#15803d", border: "#a7f3d0" },
  preparing: { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
  ready: { bg: "#f0fdf4", color: "#166534", border: "#86efac" },
  completed: { bg: "#f0f4ec", color: "#475569", border: "#e0e8df" },
  cancelled: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
};

const OrderStatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" };

  return (
    <span
      style={{
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        borderRadius: 10,
        padding: "5px 14px",
        fontSize: "0.8rem",
        fontWeight: 700,
        textTransform: "capitalize",
        letterSpacing: "0.3px",
        display: "inline-block",
      }}
    >
      {status}
    </span>
  );
};

export default OrderStatusBadge;
