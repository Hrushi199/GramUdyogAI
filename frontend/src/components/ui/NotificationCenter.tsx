import React, { useState, useEffect } from 'react';
import { Bell, X, Check, XCircle, Users, Calendar, Award, MessageSquare, Trash2 } from 'lucide-react';
import { notificationAPI, Notification, TeamInviteResponse } from '../../lib/api';
import PublicProfileAvatar from './PublicProfileAvatar';

interface NotificationCenterProps {
  userId: number;
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId, isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'team_invites'>('all');

  useEffect(() => {
    if (isOpen && userId) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [isOpen, userId, activeTab]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationAPI.getNotifications(
        userId,
        activeTab === 'unread',
        activeTab === 'team_invites' ? 'team_invite' : undefined
      );
      if (response.data) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount(userId);
      if (response.data) {
        setUnreadCount(response.data.unread_count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      fetchUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const respondToTeamInvite = async (notificationId: number, action: 'accept' | 'reject') => {
    try {
      const response: TeamInviteResponse = {
        invite_id: notificationId,
        action: action
      };
      
      await notificationAPI.respondToTeamInvite(notificationId, response);
      
      // Update the notification status
      setNotifications(prev => 
        prev.map(n => {
          if (n.id === notificationId) {
            const metadata = { ...n.metadata, status: action === 'accept' ? 'accepted' : 'rejected' };
            return { ...n, is_read: true, metadata };
          }
          return n;
        })
      );
      
      fetchUnreadCount();
    } catch (error) {
      console.error('Error responding to team invite:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'team_invite':
        return <Users className="w-5 h-5 text-blue-400" />;
      case 'event_update':
        return <Calendar className="w-5 h-5 text-green-400" />;
      case 'project_update':
        return <Award className="w-5 h-5 text-purple-400" />;
      default:
        return <MessageSquare className="w-5 h-5 text-gray-400" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'team_invite':
        return 'border-l-blue-500 bg-blue-500/10';
      case 'event_update':
        return 'border-l-green-500 bg-green-500/10';
      case 'project_update':
        return 'border-l-purple-500 bg-purple-500/10';
      default:
        return 'border-l-gray-500 bg-gray-500/10';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose} style={{ pointerEvents: 'auto' }}>
      <div className="glassmorphism-card rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden relative" onClick={e => e.stopPropagation()} style={{ pointerEvents: 'auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Notifications</h2>
              <p className="text-gray-400 text-sm">
                {unreadCount} unread • {notifications.length} total
              </p>
            </div>
          </div>
          {/* Removed X close button */}
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-800/50 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === 'unread'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setActiveTab('team_invites')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === 'team_invites'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            Team Invites
          </button>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="text-sm text-purple-400 hover:text-purple-300 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            Mark all as read
          </button>
          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="text-sm text-gray-400 hover:text-gray-300 disabled:text-gray-500"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No notifications found</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`glassmorphism-light rounded-lg p-4 border-l-4 transition-all duration-300 ${
                  getNotificationColor(notification.notification_type)
                } ${!notification.is_read ? 'ring-2 ring-purple-500/20' : ''}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.notification_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`text-sm font-semibold ${
                          notification.is_read ? 'text-gray-300' : 'text-white'
                        }`}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.is_read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 text-gray-400 hover:text-green-400 transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        
                        {notification.notification_type === 'team_invite' && 
                         notification.metadata?.status === 'pending' && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => respondToTeamInvite(notification.id, 'accept')}
                              className="p-1 text-green-400 hover:text-green-300 transition-colors"
                              title="Accept invite"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => respondToTeamInvite(notification.id, 'reject')}
                              className="p-1 text-red-400 hover:text-red-300 transition-colors"
                              title="Reject invite"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete notification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Team Invite Details */}
                    {notification.notification_type === 'team_invite' && notification.metadata && (
                      (() => {
                        const meta = notification.metadata as {
                          project_title?: string;
                          role?: string;
                          inviter_id?: number;
                          inviter_name?: string;
                          status?: string;
                          skills?: string[];
                        } || {};
                        return (
                          <div className="mt-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-400">Project:</span>
                                <span className="text-white ml-1">{meta.project_title || ''}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Role:</span>
                                <span className="text-white ml-1">{meta.role || ''}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Inviter:</span>
                                <span className="text-white ml-1">
                                  {typeof meta.inviter_id !== 'undefined' && typeof meta.inviter_name === 'string' ? (
                                    <PublicProfileAvatar userId={String(meta.inviter_id)} name={meta.inviter_name} size={32} />
                                  ) : (
                                    'User'
                                  )}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">Status:</span>
                                <span className={`ml-1 ${
                                  meta.status === 'pending' ? 'text-yellow-400' :
                                  meta.status === 'accepted' ? 'text-green-400' :
                                  'text-red-400'
                                }`}>
                                  {meta.status || ''}
                                </span>
                              </div>
                            </div>
                            {Array.isArray(meta.skills) && (
                              <div className="mt-2">
                                <span className="text-gray-400 text-xs">Skills:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {meta.skills.map((skill: string, index: number) => (
                                    <span key={index} className="tag-purple text-xs">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter; 