import React from 'react';
import { Trophy, Medal, Award } from 'lucide-react';

export const Podium = ({ winners = [] }) => {
  // Reorder: [2nd, 1st, 3rd]
  const ordered = [
    winners[1] || null,
    winners[0] || null,
    winners[2] || null
  ];

  const positions = [
    { place: 2, icon: Medal, color: 'silver', label: '2º Lugar' },
    { place: 1, icon: Trophy, color: 'gold', label: '1º Lugar' },
    { place: 3, icon: Award, color: 'bronze', label: '3º Lugar' }
  ];

  return (
    <div className="podium">
      {ordered.map((winner, index) => {
        const pos = positions[index];
        const Icon = pos.icon;
        const placeClass = index === 1 ? 'first' : index === 0 ? 'second' : 'third';

        return (
          <div key={pos.place} className={`podium-place ${placeClass}`}>
            {winner && (
              <div className="flex flex-col items-center mb-4">
                <img
                  src={winner.photo || 'https://via.placeholder.com/80'}
                  alt={winner.name}
                  className="avatar avatar-lg mb-2"
                  style={{
                    borderColor: pos.color === 'gold' ? '#ffd700' 
                      : pos.color === 'silver' ? '#c0c0c0' 
                      : '#cd7f32'
                  }}
                />
                <span className="text-white font-semibold text-sm">{winner.name}</span>
                <span className="text-gray-400 text-xs">⭐ {winner.rating?.toFixed(1)}</span>
                {winner.timeOnPodium && (
                  <span className="text-gray-500 text-xs mt-1">{winner.timeOnPodium}</span>
                )}
              </div>
            )}
            <div className="podium-block">
              <Icon size={32} />
            </div>
            <span className="text-gray-400 text-sm mt-2">{pos.label}</span>
          </div>
        );
      })}
    </div>
  );
};
