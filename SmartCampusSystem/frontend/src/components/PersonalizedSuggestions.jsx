const PersonalizedSuggestions = ({ items = [], totalEstimate = 0 }) => {
  if (!items.length) return null;

  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm">
      <h3 className="text-base font-semibold text-indigo-900">Personalized Suggestions</h3>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item.item} className="rounded-lg bg-white px-3 py-2">
            <p className="text-sm font-semibold text-slate-800">{item.item}</p>
            <p className="text-xs text-slate-600">Rs. {item.price} - {item.reason || "Based on your history"}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm font-medium text-indigo-900">Estimated Total: Rs. {totalEstimate}</p>
    </div>
  );
};

export default PersonalizedSuggestions;

