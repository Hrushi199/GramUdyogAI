import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { notificationAPI } from '../../lib/api';
import NotificationCenter from './NotificationCenter';

interface NotificationBellProps {
  userId: number;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userId }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUnreadCount();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const fetchUnreadCount = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getUnreadCount(userId);
      if (response.data) {
        setUnreadCount(response.data.unread_count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = () => {
    setIsOpen(true);
    // Refresh unread count when opening
    fetchUnreadCount();
  };

  return (
    <>
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-400 hover:text-white transition-all duration-300 hover:scale-110 group"
        title="Notifications"
      >
        <Bell className="w-6 h-6" />
        
        {/* Unread count badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
        
        {/* Hover effect */}
        <div className="absolute inset-0 bg-purple-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </button>

      {/* Notification Center Modal */}
      <NotificationCenter
        userId={userId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};

export default NotificationBell; 