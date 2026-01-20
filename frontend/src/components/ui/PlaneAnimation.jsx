import React from 'react';
import './PlaneAnimation.css';

/**
 * PlaneAnimation - Animação de avião cortando a escrita "CXJ"
 * 
 * Componente isolado e reutilizável que exibe um avião animado
 * cruzando horizontalmente com rastro de fumaça.
 * 
 * Usa CSS animations para performance otimizada.
 */
export const PlaneAnimation = ({ className = '' }) => {
  return (
    <div className={`plane-animation-container ${className}`}>
      {/* Rastro de fumaça */}
      <div className="plane-trail">
        <div className="trail-particle trail-1" />
        <div className="trail-particle trail-2" />
        <div className="trail-particle trail-3" />
        <div className="trail-particle trail-4" />
        <div className="trail-particle trail-5" />
      </div>
      
      {/* Avião SVG */}
      <div className="plane-wrapper">
        <svg 
          className="plane-svg"
          viewBox="0 0 64 64" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Corpo do avião */}
          <path 
            d="M58 32L48 28V24L58 20V24L62 26V30L58 32Z" 
            fill="currentColor"
            className="plane-body"
          />
          {/* Fuselagem principal */}
          <path 
            d="M48 24H12C8 24 4 28 4 32C4 36 8 40 12 40H48L54 32L48 24Z" 
            fill="currentColor"
            className="plane-fuselage"
          />
          {/* Asa superior */}
          <path 
            d="M32 24V12L36 10V24H32Z" 
            fill="currentColor"
            className="plane-wing-top"
          />
          {/* Asa inferior */}
          <path 
            d="M32 40V52L36 54V40H32Z" 
            fill="currentColor"
            className="plane-wing-bottom"
          />
          {/* Janelas */}
          <circle cx="18" cy="32" r="3" fill="#0ea5e9" className="plane-window" />
          <circle cx="28" cy="32" r="3" fill="#0ea5e9" className="plane-window" />
          <circle cx="38" cy="32" r="3" fill="#0ea5e9" className="plane-window" />
          {/* Motor */}
          <ellipse cx="8" cy="32" rx="4" ry="6" fill="#1e3a5f" className="plane-engine" />
        </svg>
      </div>
    </div>
  );
};

export default PlaneAnimation;
