const ComboCard = ({ combo }) => {
  if (!combo || combo.type !== "combo") return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
      <h3 className="text-base font-semibold text-amber-900">Suggested Combo</h3>
      <ul className="mt-2 space-y-1 text-sm text-amber-900">
        {(combo.items || []).map((item) => (
          <li key={item.item} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
            <span>{item.item}</span>
            <span className="font-semibold">Rs. {item.price}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm font-semibold text-amber-900">Total: Rs. {combo.totalEstimate || 0}</p>
      {combo.reason ? <p className="mt-1 text-xs text-amber-800">{combo.reason}</p> : null}
    </div>
  );
};

export default ComboCard;

