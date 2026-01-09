import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Camera, Tag, XCircle, CheckCircle, Clock, X } from 'lucide-react';
import { notificationsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const notifIcons = {
  photo_sent: Camera,
  photo_approved: CheckCircle,
  photo_rejected: XCircle,
  queue_full: Clock,
  tag_assigned: Tag,
  ranking: Tag
};

const notifColors = {
  photo_sent: 'text-sky-400',
  photo_approved: 'text-green-400',
  photo_rejected: 'text-red-400',
  queue_full: 'text-yellow-400',
  tag_assigned: 'text-pink-400',
  ranking: 'text-yellow-400'
};

export const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const [notifsRes, countRes] = await Promise.all([
        notificationsApi.list(),
        notificationsApi.getCount()
      ]);
      setNotifications(notifsRes.data || []);
      setUnreadCount(countRes.data?.unread || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const res = await notificationsApi.getCount();
      setUnreadCount(res.data?.unread || 0);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationsApi.markRead(notificationId);
      setNotifications(notifications.map(n => 
        n.notification_id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadNotifications();
        }}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-[#0a1929] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h3 className="text-white font-semibold">Notificações</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
                >
                  <CheckCheck size={14} />
                  Marcar todas
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-400">
                Carregando...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const Icon = notifIcons[notif.type] || Bell;
                const colorClass = notifColors[notif.type] || 'text-gray-400';

                return (
                  <div
                    key={notif.notification_id}
                    className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${!notif.read ? 'bg-sky-500/5' : ''}`}
                    onClick={() => !notif.read && markAsRead(notif.notification_id)}
                  >
                    <div className="flex gap-3">
                      <div className={`flex-shrink-0 ${colorClass}`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${notif.read ? 'text-gray-400' : 'text-white'}`}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notif.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 bg-sky-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
