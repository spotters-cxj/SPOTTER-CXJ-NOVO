import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Camera } from 'lucide-react';

export const PhotoCarousel = ({ photos = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Auto-scroll
  useEffect(() => {
    if (photos.length === 0) return;

    const interval = setInterval(() => {
      handleNext();
    }, 4000); // Move every 4 seconds

    return () => clearInterval(interval);
  }, [currentIndex, photos.length]);

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % photos.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <Camera className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Nenhuma foto na galeria ainda</p>
      </div>
    );
  }

  // Get 3 visible photos (current, next, next+1)
  const visiblePhotos = [];
  for (let i = 0; i < 3; i++) {
    const index = (currentIndex + i) % photos.length;
    visiblePhotos.push(photos[index]);
  }

  return (
    <div className="relative">
      {/* Carousel Container */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out gap-6"
          style={{
            transform: `translateX(0%)`,
          }}
        >
          {visiblePhotos.map((photo, idx) => (
            <Link
              key={`${photo.photo_id}-${idx}`}
              to={`/galeria/${photo.photo_id}`}
              className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/3"
            >
              <div className="photo-card group cursor-pointer">
                <img
                  src={
                    photo.url?.startsWith('/api')
                      ? `${process.env.REACT_APP_BACKEND_URL}${photo.url}`
                      : photo.url
                  }
                  alt={photo.description}
                  className="w-full h-64 object-cover"
                />
                <div className="photo-overlay">
                  <h3 className="text-white font-semibold mb-1">
                    {photo.aircraft_model}
                  </h3>
                  <p className="text-gray-300 text-sm">{photo.description}</p>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sky-400 text-xs">Por {photo.author_name}</p>
                    {photo.final_rating > 0 && (
                      <span className="text-yellow-400 text-xs flex items-center gap-1">
                        <Star size={12} fill="currentColor" />
                        {photo.final_rating?.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {photos.map((_, idx) => (
          <button
            key={idx}
            onClick={() => !isAnimating && setCurrentIndex(idx)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              idx === currentIndex
                ? 'bg-sky-400 w-8'
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
            aria-label={`Go to photo ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default PhotoCarousel;
