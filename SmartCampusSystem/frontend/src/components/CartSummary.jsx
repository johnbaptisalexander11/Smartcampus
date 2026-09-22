const CartSummary = ({ order = null, onAddToCart, addingToCart }) => {
  if (!order || order.type !== "order") return null;

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
      <h3 className="text-base font-semibold text-emerald-900">Order Preview</h3>
      <ul className="mt-3 space-y-2">
        {(order.items || []).map((item) => (
          <li key={`${item.item}-${item.qty}`} className="rounded-lg bg-white px-3 py-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-800">{item.item} x {item.qty}</span>
              <span className="font-semibold text-slate-800">Rs. {item.subtotal}</span>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm font-semibold text-emerald-900">Total: Rs. {order.totalEstimate || 0}</p>

      {order.warnings?.length ? (
        <div className="mt-2 rounded-lg bg-amber-100 p-2 text-xs text-amber-900">
          {order.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onAddToCart}
        disabled={!order.canAddToCart || addingToCart}
        className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {addingToCart ? "Adding..." : "Add to Cart"}
      </button>
    </div>
  );
};

export default CartSummary;

