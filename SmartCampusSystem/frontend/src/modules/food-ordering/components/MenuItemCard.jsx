import { useEffect, useMemo, useState } from "react";
import { getLocalFoodImage } from "../utils/foodImages";

const DEFAULT_FOOD_IMAGES = [
  "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=900",
  "https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=900",
  "https://images.pexels.com/photos/70497/pexels-photo-70497.jpeg?auto=compress&cs=tinysrgb&w=900",
  "https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=900",
];

const getFallbackByName = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return DEFAULT_FOOD_IMAGES[Math.abs(hash) % DEFAULT_FOOD_IMAGES.length];
};

const normalizeImageUrl = (rawUrl = "", fallback) => {
  const url = String(rawUrl || "").trim();
  if (!url) return fallback;

  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:image/")) {
    return url;
  }

  const base = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace("/api", "")
    : "http://localhost:5000";

  return `${base}/${url.replace(/^\/+/, "")}`;
};

const resolveFoodImage = (item) => {
  const local = getLocalFoodImage(item?.name);
  if (local) return local;

  const fallback = getFallbackByName(item?.name || "");
  return normalizeImageUrl(item?.imageUrl, fallback);
};

const MenuItemCard = ({ item, onAddToCart, onOpenReviews }) => {
  const resolvedImage = useMemo(() => resolveFoodImage(item), [item?.name, item?.imageUrl]);
  const [imageSrc, setImageSrc] = useState(resolvedImage);

  useEffect(() => {
    setImageSrc(resolvedImage);
  }, [resolvedImage]);

  return (
    <div className="mn-card">
      <div className="mn-card-img-wrap">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={item.name}
            className="mn-card-img"
            onError={() => setImageSrc(getFallbackByName(item?.name || ""))}
          />
        ) : (
          <div className="mn-card-img-placeholder">???</div>
        )}
        {item.averageRating >= 4 && (
          <span className="mn-card-badge mn-card-badge--popular">POPULAR</span>
        )}
      </div>

      <div className="mn-card-body">
        <div className="mn-card-row">
          <h4 className="mn-card-name">{item.name}</h4>
          <span className="mn-card-price">Rs.{item.price}</span>
        </div>

        <p className="mn-card-desc">
          {item.description
            ? item.description.length > 55
              ? item.description.slice(0, 55) + "..."
              : item.description
            : "Delicious campus meal"}
        </p>

        <div className="mn-card-meta">
          <span
            className="mn-card-rating"
            onClick={() => onOpenReviews(item._id)}
            role="button"
            tabIndex={0}
          >
            ★ {item.averageRating?.toFixed(1) || "0.0"}
          </span>
          {item.canteen && <span className="mn-card-canteen">{item.canteen}</span>}
        </div>

        <button className="mn-card-add" onClick={() => onAddToCart(item._id)}>
          <span>+</span> Add to Cart
        </button>
      </div>
    </div>
  );
};

export default MenuItemCard;
