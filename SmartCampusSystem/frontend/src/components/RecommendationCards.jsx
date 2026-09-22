const RecommendationCards = ({ items = [], totalEstimate = 0, title = "Recommendations" }) => {
  if (!items.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.item} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="font-semibold text-slate-800">{item.item}</p>
            <p className="text-sm text-slate-600">Rs. {item.price}</p>
            <p className="mt-1 text-xs text-slate-500">{item.reason || "Good fit for your request"}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm font-medium text-emerald-700">Estimated Total: Rs. {totalEstimate}</p>
    </div>
  );
};

export default RecommendationCards;

