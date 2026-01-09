import React, { useEffect, useState } from 'react';

export const AnimatedBackground = () => {
  const [stars, setStars] = useState([]);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Create stars
    const newStars = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 5,
      duration: 2 + Math.random() * 3
    }));
    setStars(newStars);

    // Create particles
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 20,
      duration: 15 + Math.random() * 10
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0a1929] to-black" />
      
      {/* Radial gradients for depth */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-sky-500/3 to-transparent rounded-full" />
      
      {/* Animated Stars */}
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

      {/* Flying airplane with smoke trail */}
      <div className="flying-airplane">
        <svg className="airplane-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
        </svg>
        <div className="smoke-trail">
          <div className="smoke-particle" />
          <div className="smoke-particle" />
          <div className="smoke-particle" />
          <div className="smoke-particle" />
          <div className="smoke-particle" />
        </div>
      </div>

      {/* Floating particles */}
      <div className="particles">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.left}%`,
              bottom: '-10px',
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`
            }}
          />
        ))}
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />
    </div>
  );
};

export default AnimatedBackground;
