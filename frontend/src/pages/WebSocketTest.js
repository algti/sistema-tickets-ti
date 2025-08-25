import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const WebSocketTest = () => {
  const { token, user } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [messages, setMessages] = useState([]);
  const [testSocket, setTestSocket] = useState(null);

  const addMessage = (message) => {
    setMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testConnection = () => {
    if (!token || !user) {
      addMessage('❌ Token ou usuário não disponível');
      return;
    }

    const wsUrl = `ws://127.0.0.1:8000/api/v1/notifications/ws?token=${token}`;
    addMessage(`🔄 Tentando conectar em: ${wsUrl}`);
    addMessage(`👤 Usuário: ${user.username} (${user.role})`);

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      addMessage('✅ WebSocket conectado com sucesso!');
      setConnectionStatus('Connected');
      setTestSocket(socket);
    };

    socket.onmessage = (event) => {
      addMessage(`📨 Mensagem recebida: ${event.data}`);
    };

    socket.onclose = (event) => {
      addMessage(`❌ WebSocket desconectado - Código: ${event.code}, Razão: ${event.reason}`);
      setConnectionStatus('Disconnected');
      setTestSocket(null);
    };

    socket.onerror = (error) => {
      addMessage(`🚨 Erro WebSocket: ${error.type}`);
      console.error('WebSocket error details:', error);
    };
  };

  const sendTestMessage = () => {
    if (testSocket && testSocket.readyState === WebSocket.OPEN) {
      const message = {
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      };
      testSocket.send(JSON.stringify(message));
      addMessage(`📤 Enviado: ${JSON.stringify(message)}`);
    } else {
      addMessage('❌ WebSocket não está conectado');
    }
  };

  const disconnect = () => {
    if (testSocket) {
      testSocket.close(1000, 'Manual disconnect');
      addMessage('🔌 Desconectado manualmente');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Teste de Conexão WebSocket</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Status da Conexão</h2>
        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
          connectionStatus === 'Connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {connectionStatus}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Informações do Usuário</h2>
        <div className="space-y-2 text-sm">
          <p><strong>Token:</strong> {token ? '✅ Presente' : '❌ Ausente'}</p>
          <p><strong>Usuário:</strong> {user ? `${user.username} (${user.role})` : '❌ Não logado'}</p>
          <p><strong>URL WebSocket:</strong> ws://127.0.0.1:8000/api/v1/notifications/ws</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Controles</h2>
        <div className="space-x-4">
          <button
            onClick={testConnection}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            disabled={connectionStatus === 'Connected'}
          >
            Conectar
          </button>
          <button
            onClick={sendTestMessage}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            disabled={connectionStatus !== 'Connected'}
          >
            Enviar Heartbeat
          </button>
          <button
            onClick={disconnect}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            disabled={connectionStatus !== 'Connected'}
          >
            Desconectar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Log de Eventos</h2>
        <div className="bg-gray-100 p-4 rounded h-64 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-gray-500">Nenhum evento registrado</p>
          ) : (
            messages.map((message, index) => (
              <div key={index} className="text-sm font-mono mb-1">
                {message}
              </div>
            ))
          )}
        </div>
        <button
          onClick={() => setMessages([])}
          className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Limpar Log
        </button>
      </div>
    </div>
  );
};

export default WebSocketTest;
