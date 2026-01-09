import React from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { TagBadgeList } from './TagBadge';

export const Podium = ({ winners = [] }) => {
  if (winners.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Trophy size={48} className="mx-auto mb-4 opacity-50" />
        <p>Nenhum ranking disponível ainda</p>
      </div>
    );
  }

  const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd
  const places = ['first', 'second', 'third'];
  const icons = [Trophy, Medal, Award];
  const heights = [160, 120, 80];

  return (
    <div className="podium">
      {podiumOrder.map((index, displayIndex) => {
        const winner = winners[index];
        if (!winner) return null;

        const placeClass = places[index];
        const Icon = icons[index];
        const height = heights[index];

        return (
          <div key={index} className={`podium-place ${placeClass}`}>
            <div className="mb-4">
              <div className="relative">
                <img
                  src={winner.photo || '/logo-spotters-round.png'}
                  alt={winner.name}
                  className="w-16 h-16 rounded-full object-cover border-3 border-white/20 mx-auto"
                />
                <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center 
                  ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-700'}`}>
                  <span className="text-white font-bold text-sm">{index + 1}</span>
                </div>
              </div>
              <h4 className="text-white font-semibold mt-2 text-sm">{winner.name}</h4>
              <p className="text-yellow-400 text-sm">⭐ {winner.rating?.toFixed(1) || '0.0'}</p>
              <p className="text-gray-500 text-xs">{winner.total_photos || 0} fotos</p>
              {winner.tags && (
                <div className="mt-2">
                  <TagBadgeList tags={winner.tags} size="small" maxShow={1} />
                </div>
              )}
            </div>
            <div 
              className="podium-block"
              style={{ height: `${height}px` }}
            >
              <Icon size={32} className="opacity-70" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Podium;
