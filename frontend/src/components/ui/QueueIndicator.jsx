import React from 'react';
import { cn } from '../../lib/utils';

export const QueueIndicator = ({ current, max, className }) => {
  const percentage = (current / max) * 100;
  let status = 'green';
  let statusText = 'Normal';

  if (percentage >= 90) {
    status = 'red';
    statusText = 'Quase Cheia';
  } else if (percentage >= 70) {
    status = 'yellow';
    statusText = 'Moderada';
  }

  return (
    <div className={cn('queue-indicator', className)}>
      <div className={`queue-dot ${status}`} />
      <span className="text-gray-300">
        Fila: <strong>{current}</strong>/{max}
      </span>
      <span className={cn(
        'text-xs px-2 py-0.5 rounded',
        status === 'green' && 'bg-emerald-500/20 text-emerald-400',
        status === 'yellow' && 'bg-amber-500/20 text-amber-400',
        status === 'red' && 'bg-red-500/20 text-red-400'
      )}>
        {statusText}
      </span>
    </div>
  );
};

export const ProgressBar = ({ value, max, className, showLabel = true }) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>{value} / {max}</span>
          <span>{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};
