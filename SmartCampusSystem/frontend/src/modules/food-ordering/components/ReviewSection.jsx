import { useEffect, useState } from "react";
import { fetchReviews, submitReview } from "../services/foodOrderingService";

const ReviewSection = ({ itemId }) => {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const loadReviews = async () => {
    try {
      const data = await fetchReviews(itemId);
      setReviews(data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not load reviews");
    }
  };

  useEffect(() => {
    if (itemId) {
      loadReviews();
    }
  }, [itemId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await submitReview(itemId, { rating: Number(rating), comment });
      setComment("");
      await loadReviews();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not submit review");
    }
  };

  return (
    <div className="card">
      <h3>Ratings and Reviews</h3>
      <form onSubmit={handleSubmit} className="row-gap">
        <select value={rating} onChange={(event) => setRating(event.target.value)}>
          <option value={5}>5 - Excellent</option>
          <option value={4}>4 - Good</option>
          <option value={3}>3 - Average</option>
          <option value={2}>2 - Poor</option>
          <option value={1}>1 - Bad</option>
        </select>
        <textarea
          placeholder="Write your review..."
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={3}
        />
        <button type="submit">Submit Review</button>
      </form>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <div className="row-gap" style={{ marginTop: 12 }}>
        {reviews.map((review) => (
          <div key={review._id} className="card-light">
            <p>
              <strong>{review.user?.name || "User"}</strong> - {review.rating}/5
            </p>
            <p>{review.comment || "No comment"}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewSection;
