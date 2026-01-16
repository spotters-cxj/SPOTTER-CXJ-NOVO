import React, { memo, useMemo } from 'react';

// Optimized AnimatedBackground - reduced elements for better performance
const AnimatedBackground = memo(() => {
  // Generate stars once with useMemo - reduced from 100 to 30
  const stars = useMemo(() => 
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 2
    })), []
  );

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Pure black background */}
      <div className="absolute inset-0 bg-black" />
      
      {/* Optimized Stars - CSS only, no JS animation */}
      <div className="stars-container">
        {stars.map((star) => (
          <div
            key={star.id}
            className="star"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`
            }}
          />
        ))}
      </div>

      {/* Static gradient overlay for depth - no animation */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
    </div>
  );
});

AnimatedBackground.displayName = 'AnimatedBackground';

export { AnimatedBackground };
export default AnimatedBackground;
