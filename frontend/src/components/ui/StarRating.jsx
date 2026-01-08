import React from 'react';
import { Star } from 'lucide-react';

export const StarRating = ({ rating = 0, maxRating = 5, onRate, readonly = false, size = 20 }) => {
  const [hoverRating, setHoverRating] = React.useState(0);

  const handleClick = (index) => {
    if (!readonly && onRate) {
      onRate(index + 1);
    }
  };

  const handleMouseEnter = (index) => {
    if (!readonly) {
      setHoverRating(index + 1);
    }
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="star-rating" onMouseLeave={handleMouseLeave}>
      {Array.from({ length: maxRating }, (_, index) => (
        <Star
          key={index}
          size={size}
          className={`star ${index < displayRating ? 'filled' : ''} ${readonly ? '' : 'cursor-pointer'}`}
          fill={index < displayRating ? '#ffd700' : 'none'}
          onClick={() => handleClick(index)}
          onMouseEnter={() => handleMouseEnter(index)}
        />
      ))}
    </div>
  );
};

export const RatingDisplay = ({ rating, count, size = 16 }) => {
  return (
    <div className="flex items-center gap-2">
      <StarRating rating={Math.round(rating)} readonly size={size} />
      <span className="text-sm text-gray-400">
        {rating.toFixed(1)} {count && `(${count})`}
      </span>
    </div>
  );
};
