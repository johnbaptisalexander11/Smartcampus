const StatsCard = ({ title, value }) => {
  return (
    <div className="card">
      <p style={{ margin: 0, color: "#6b7280" }}>{title}</p>
      <h3 style={{ marginTop: 6 }}>{value}</h3>
    </div>
  );
};

export default StatsCard;
