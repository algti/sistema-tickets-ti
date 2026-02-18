import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import LoadingSpinner from '../components/LoadingSpinner';

function Notifications() {
  const { user } = useAuth();
  const { notifications: wsNotifications, markAsRead: wsMarkAsRead, markAllAsRead: wsMarkAllAsRead } = useWebSocket();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    // Simular carregamento inicial
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Use WebSocket notifications
  const notifications = wsNotifications || [];

  const markAsRead = async (notificationId) => {
    try {
      wsMarkAsRead(notificationId);
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      wsMarkAllAsRead();
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'ticket_created': '🎫',
      'ticket_assigned': '👤',
      'comment_added': '💬',
      'ticket_resolved': '✅',
      'ticket_closed': '🔒',
      'ticket_reopened': '🔓'
    };
    return icons[type] || '📢';
  };

  const getNotificationColor = (type) => {
    const colors = {
      'ticket_created': 'border-blue-200 bg-blue-50',
      'ticket_assigned': 'border-yellow-200 bg-yellow-50',
      'comment_added': 'border-green-200 bg-green-50',
      'ticket_resolved': 'border-green-200 bg-green-50',
      'ticket_closed': 'border-gray-200 bg-gray-50',
      'ticket_reopened': 'border-orange-200 bg-orange-50'
    };
    return colors[type] || 'border-gray-200 bg-gray-50';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Agora há pouco';
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d atrás`;
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'read') return notif.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} não lidas` : 'Todas as notificações estão lidas'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md font-medium ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todas ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-md font-medium ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Não lidas ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-md font-medium ${
              filter === 'read'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Lidas ({notifications.length - unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white shadow rounded-lg">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">🔔</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'unread' ? 'Nenhuma notificação não lida' : 
               filter === 'read' ? 'Nenhuma notificação lida' : 
               'Nenhuma notificação'}
            </h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'Você receberá notificações sobre atividades dos tickets aqui.'
                : 'Altere o filtro para ver outras notificações.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => {
                  if (!notification.read) {
                    markAsRead(notification.id);
                  }
                  // Navegar para o ticket se aplicável
                  if (notification.ticket_id) {
                    window.location.href = `/tickets/${notification.ticket_id}`;
                  }
                }}
              >
                <div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                    <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.type === 'ticket_created' ? 'Novo ticket criado' :
                         notification.type === 'ticket_assigned' ? 'Ticket atribuído' :
                         notification.type === 'ticket_status_changed' ? 'Status alterado' :
                         notification.type === 'new_comment' ? 'Novo comentário' :
                         notification.type === 'ticket_resolved' ? 'Ticket resolvido' :
                         'Notificação'}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.timestamp)}
                        </span>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <p className={`text-sm mt-1 ${!notification.read ? 'text-gray-800' : 'text-gray-600'}`}>
                      {notification.message}
                    </p>
                    {notification.ticket_id && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Ticket #{notification.ticket_id}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
