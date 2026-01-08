import React from 'react';
import { Plane } from 'lucide-react';

export const AnimatedBackground = () => {
  // Generate random particles
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 20}s`,
    duration: `${15 + Math.random() * 10}s`,
    size: `${1 + Math.random() * 2}px`
  }));

  return (
    <>
      {/* Gradient Background */}
      <div className="animated-bg" />
      
      {/* Floating Particles */}
      <div className="particles">
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: p.left,
              bottom: '-10px',
              width: p.size,
              height: p.size,
              animationDelay: p.delay,
              animationDuration: p.duration
            }}
          />
        ))}
      </div>
      
      {/* Flying Airplane with Smoke Trail */}
      <div className="flying-airplane">
        <svg 
          className="airplane-icon" 
          viewBox="0 0 24 24" 
          fill="currentColor"
        >
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
    </>
  );
};
