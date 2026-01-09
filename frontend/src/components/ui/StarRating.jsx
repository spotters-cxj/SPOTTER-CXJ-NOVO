import React, { useState } from 'react';
import { Star } from 'lucide-react';

export const StarRating = ({ 
  rating = 0, 
  maxStars = 5, 
  editable = false, 
  onChange = null,
  size = 'default' 
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeMap = {
    small: 14,
    default: 20,
    large: 28
  };
  const starSize = sizeMap[size] || 20;

  const handleClick = (value) => {
    if (editable && onChange) {
      onChange(value);
    }
  };

  return (
    <div className="star-rating">
      {[...Array(maxStars)].map((_, i) => {
        const value = i + 1;
        const filled = value <= (hoverRating || rating);
        
        return (
          <Star
            key={i}
            size={starSize}
            className={`star ${filled ? 'filled' : ''} ${editable ? 'cursor-pointer' : ''}`}
            fill={filled ? '#ffd700' : 'none'}
            onClick={() => handleClick(value)}
            onMouseEnter={() => editable && setHoverRating(value)}
            onMouseLeave={() => editable && setHoverRating(0)}
          />
        );
      })}
    </div>
  );
};

export const StarRatingDisplay = ({ rating, count, size = 'default' }) => {
  return (
    <div className="flex items-center gap-2">
      <StarRating rating={Math.round(rating)} size={size} />
      <span className="text-gray-400 text-sm">
        {rating?.toFixed(1)} {count && `(${count})`}
      </span>
    </div>
  );
};

export default StarRating;
