import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);

  const connect = () => {
    if (!token || !user) {
      console.log('WebSocket connection skipped - missing token or user:', { token: !!token, user: !!user });
      return;
    }

    try {
      const wsUrl = `ws://127.0.0.1:8000/api/v1/notifications/ws?token=${token}`;
      console.log('Attempting WebSocket connection to:', wsUrl);
      console.log('User info:', { id: user.id, username: user.username, role: user.role });
      const newSocket = new WebSocket(wsUrl);

      newSocket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setSocket(newSocket);
        
        // Start heartbeat
        startHeartbeat(newSocket);
      };

      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      newSocket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        console.log('Close event details:', event);
        setIsConnected(false);
        setSocket(null);
        stopHeartbeat();
        
        // Reconnect after delay (unless manually closed)
        if (event.code !== 1000) {
          scheduleReconnect();
        }
      };

      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        console.error('Error details:', {
          type: error.type,
          target: error.target,
          readyState: error.target?.readyState
        });
      };

    } catch (error) {
      console.error('Error creating WebSocket:', error);
      scheduleReconnect();
    }
  };

  const disconnect = () => {
    if (socket) {
      socket.close(1000, 'Manual disconnect');
    }
    stopHeartbeat();
    clearReconnectTimeout();
  };

  const scheduleReconnect = () => {
    clearReconnectTimeout();
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('Attempting to reconnect WebSocket...');
      connect();
    }, 5000); // Reconnect after 5 seconds
  };

  const clearReconnectTimeout = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const startHeartbeat = (ws) => {
    heartbeatIntervalRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        }));
      }
    }, 30000); // Send heartbeat every 30 seconds
  };

  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  const handleMessage = (data) => {
    console.log('WebSocket message received:', data);

    switch (data.type) {
      case 'connection_established':
        console.log('WebSocket connection established');
        break;

      case 'heartbeat_response':
        // Heartbeat acknowledged
        break;

      case 'ticket_created':
      case 'ticket_assigned':
      case 'ticket_status_changed':
      case 'new_comment':
      case 'ticket_resolved':
      case 'system_notification':
        addNotification(data);
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      ...notification,
      read: false,
      timestamp: notification.timestamp || new Date().toISOString()
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep last 50
    setUnreadCount(prev => prev + 1);

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification('Sistema de Tickets', {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.type
      });
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Send read confirmation to server
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'mark_notification_read',
        notification_id: notificationId
      }));
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  };

  // Connect when token and user are available
  useEffect(() => {
    if (token && user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
      clearReconnectTimeout();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    socket,
    isConnected,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    requestNotificationPermission
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
