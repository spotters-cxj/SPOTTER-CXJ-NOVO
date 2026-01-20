import React from 'react';
import './PlaneAnimation.css';

/**
 * PlaneAnimation - Animação de avião cortando a escrita "CXJ"
 * 
 * Componente isolado e reutilizável que exibe um avião animado
 * cruzando horizontalmente com rastro de fumaça.
 * 
 * Design: Jato comercial moderno em estilo outline/linework branco
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
      
      {/* Avião SVG - Jato comercial moderno estilo outline */}
      <div className="plane-wrapper">
        <svg 
          className="plane-svg"
          viewBox="0 0 120 50" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fuselagem principal */}
          <path 
            d="M8 25 
               Q8 20 15 19 
               L95 17 
               Q105 17 110 22 
               L115 25 
               L110 28 
               Q105 33 95 33 
               L15 31 
               Q8 30 8 25 Z" 
            stroke="white" 
            strokeWidth="1.5" 
            fill="none"
            className="plane-fuselage"
          />
          
          {/* Cockpit / Nariz */}
          <path 
            d="M8 25 Q5 25 3 25 Q1 25 1 25" 
            stroke="white" 
            strokeWidth="1.5" 
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Janelas do cockpit */}
          <path 
            d="M10 23 L18 22" 
            stroke="rgba(14, 165, 233, 0.8)" 
            strokeWidth="2" 
            strokeLinecap="round"
            className="plane-window-cockpit"
          />
          
          {/* Janelas de passageiros */}
          <circle cx="28" cy="24" r="1.2" fill="rgba(14, 165, 233, 0.6)" className="plane-window" />
          <circle cx="36" cy="24" r="1.2" fill="rgba(14, 165, 233, 0.6)" className="plane-window" />
          <circle cx="44" cy="24" r="1.2" fill="rgba(14, 165, 233, 0.6)" className="plane-window" />
          <circle cx="52" cy="24" r="1.2" fill="rgba(14, 165, 233, 0.6)" className="plane-window" />
          <circle cx="60" cy="24" r="1.2" fill="rgba(14, 165, 233, 0.6)" className="plane-window" />
          <circle cx="68" cy="24" r="1.2" fill="rgba(14, 165, 233, 0.6)" className="plane-window" />
          <circle cx="76" cy="24" r="1.2" fill="rgba(14, 165, 233, 0.6)" className="plane-window" />
          
          {/* Asa superior/principal */}
          <path 
            d="M45 19 
               L42 5 
               Q41 2 44 2 
               L65 8 
               Q68 9 67 12 
               L55 19" 
            stroke="white" 
            strokeWidth="1.5" 
            fill="none"
            className="plane-wing-top"
          />
          
          {/* Asa inferior */}
          <path 
            d="M45 31 
               L42 45 
               Q41 48 44 48 
               L65 42 
               Q68 41 67 38 
               L55 31" 
            stroke="white" 
            strokeWidth="1.5" 
            fill="none"
            className="plane-wing-bottom"
          />
          
          {/* Motor superior */}
          <ellipse 
            cx="50" cy="8" rx="6" ry="3" 
            stroke="white" 
            strokeWidth="1.2" 
            fill="none"
            className="plane-engine"
          />
          <line x1="44" y1="8" x2="42" y2="8" stroke="white" strokeWidth="1" />
          
          {/* Motor inferior */}
          <ellipse 
            cx="50" cy="42" rx="6" ry="3" 
            stroke="white" 
            strokeWidth="1.2" 
            fill="none"
            className="plane-engine"
          />
          <line x1="44" y1="42" x2="42" y2="42" stroke="white" strokeWidth="1" />
          
          {/* Cauda vertical (estabilizador) */}
          <path 
            d="M95 17 
               L100 5 
               Q101 2 104 3 
               L108 8 
               Q110 10 108 12 
               L100 17" 
            stroke="white" 
            strokeWidth="1.5" 
            fill="none"
            className="plane-tail"
          />
          
          {/* Estabilizador horizontal superior */}
          <path 
            d="M100 20 L108 15 L112 17 L105 22" 
            stroke="white" 
            strokeWidth="1.2" 
            fill="none"
          />
          
          {/* Estabilizador horizontal inferior */}
          <path 
            d="M100 30 L108 35 L112 33 L105 28" 
            stroke="white" 
            strokeWidth="1.2" 
            fill="none"
          />
          
          {/* Trem de pouso frontal */}
          <line x1="25" y1="31" x2="25" y2="38" stroke="white" strokeWidth="1.2" />
          <ellipse cx="25" cy="40" rx="2" ry="1.5" stroke="white" strokeWidth="1" fill="none" />
          
          {/* Trem de pouso traseiro */}
          <line x1="70" y1="31" x2="70" y2="38" stroke="white" strokeWidth="1.2" />
          <ellipse cx="68" cy="40" rx="2" ry="1.5" stroke="white" strokeWidth="1" fill="none" />
          <ellipse cx="72" cy="40" rx="2" ry="1.5" stroke="white" strokeWidth="1" fill="none" />
        </svg>
      </div>
    </div>
  );
};

export default PlaneAnimation;
