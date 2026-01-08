import React from 'react';
import { Bell, Check, Camera, X, Clock, Tag, Star } from 'lucide-react';
import { cn } from '../../lib/utils';

const NOTIFICATION_ICONS = {
  photo_sent: Camera,
  photo_approved: Check,
  photo_rejected: X,
  queue_full: Clock,
  tag_assigned: Tag,
  ranking: Star
};

const NOTIFICATION_COLORS = {
  photo_sent: 'text-sky-400',
  photo_approved: 'text-emerald-400',
  photo_rejected: 'text-red-400',
  queue_full: 'text-amber-400',
  tag_assigned: 'text-purple-400',
  ranking: 'text-yellow-400'
};

export const NotificationItem = ({ notification, onMarkAsRead }) => {
  const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
  const colorClass = NOTIFICATION_COLORS[notification.type] || 'text-gray-400';

  return (
    <div 
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg transition-colors cursor-pointer',
        notification.read 
          ? 'bg-transparent hover:bg-white/5' 
          : 'bg-white/5 hover:bg-white/10'
      )}
      onClick={() => !notification.read && onMarkAsRead?.(notification.id)}
    >
      <div className={cn('p-2 rounded-lg bg-white/5', colorClass)}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm',
          notification.read ? 'text-gray-400' : 'text-white'
        )}>
          {notification.message}
        </p>
        <span className="text-xs text-gray-500">
          {new Date(notification.created_at).toLocaleString('pt-BR')}
        </span>
      </div>
      {!notification.read && (
        <div className="w-2 h-2 bg-sky-400 rounded-full mt-2" />
      )}
    </div>
  );
};

export const NotificationBadge = ({ count }) => {
  if (!count || count === 0) return null;
  
  return (
    <span className="notification-badge">
      {count > 99 ? '99+' : count}
    </span>
  );
};
