const EMOJI_MAP = {
  beverages: "🥤",
  breakfast: "🍳",
  lunch: "🍛",
  dinner: "🍽️",
  snacks: "🍿",
  desserts: "🍰",
  rice: "🍚",
  noodles: "🍜",
  soup: "🍲",
  salad: "🥗",
  burger: "🍔",
  pizza: "🍕",
  sandwich: "🥪",
  juice: "🧃",
  coffee: "☕",
  tea: "🍵",
};

const getEmoji = (name) => {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(EMOJI_MAP)) {
    if (key.includes(k)) return v;
  }
  return "🍴";
};

const SearchFilters = ({
  category,
  categories,
  onCategoryChange,
}) => {
  return (
    <div className="mn-pills">
      <button
        className={`mn-pill ${!category ? "mn-pill--active" : ""}`}
        onClick={() => onCategoryChange("")}
      >
        <span className="mn-pill-dot" style={{ background: "#10b981" }} />
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat._id}
          className={`mn-pill ${category === cat._id ? "mn-pill--active" : ""}`}
          onClick={() => onCategoryChange(cat._id)}
        >
          <span className="mn-pill-emoji">{getEmoji(cat.name)}</span>
          {cat.name}
        </button>
      ))}
    </div>
  );
};

export default SearchFilters;
