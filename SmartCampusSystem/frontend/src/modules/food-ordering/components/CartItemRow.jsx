const CartItemRow = ({ item, onUpdateQty, onRemove }) => {
  return (
    <div className="card cart-row">
      <div>
        <h4>{item.foodItem?.name}</h4>
        <p>Price: Rs. {item.priceAtAddTime}</p>
      </div>
      <div className="row-gap">
        <input
          type="number"
          min={1}
          value={item.quantity}
          onChange={(event) => onUpdateQty(item.foodItem?._id, Number(event.target.value))}
          style={{ width: 70 }}
        />
        <button onClick={() => onRemove(item.foodItem?._id)} className="btn-danger">
          Remove
        </button>
      </div>
    </div>
  );
};

export default CartItemRow;
