"""
WebSocket Manager para notificações em tempo real
"""
import json
from typing import Dict, List, Set, Optional
from fastapi import WebSocket, WebSocketDisconnect
from app.models.models import User, UserRole
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Armazena conexões ativas por user_id
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # Armazena informações do usuário por WebSocket
        self.connection_users: Dict[WebSocket, User] = {}

    async def connect(self, websocket: WebSocket, user: User):
        """Aceita uma nova conexão WebSocket"""
        await websocket.accept()
        
        # Adiciona à lista de conexões do usuário
        if user.id not in self.active_connections:
            self.active_connections[user.id] = set()
        
        self.active_connections[user.id].add(websocket)
        self.connection_users[websocket] = user
        
        logger.info(f"User {user.username} connected via WebSocket")
        
        # Envia mensagem de boas-vindas
        await self.send_personal_message({
            "type": "connection_established",
            "message": "Conectado às notificações em tempo real",
            "user_id": user.id
        }, websocket)

    def disconnect(self, websocket: WebSocket):
        """Remove uma conexão WebSocket"""
        user = self.connection_users.get(websocket)
        if user:
            # Remove da lista de conexões do usuário
            if user.id in self.active_connections:
                self.active_connections[user.id].discard(websocket)
                
                # Remove o conjunto se estiver vazio
                if not self.active_connections[user.id]:
                    del self.active_connections[user.id]
            
            # Remove do mapeamento de usuários
            del self.connection_users[websocket]
            
            logger.info(f"User {user.username} disconnected from WebSocket")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Envia mensagem para uma conexão específica"""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Error sending message to WebSocket: {e}")

    async def send_to_user(self, message: dict, user_id: int):
        """Envia mensagem para todas as conexões de um usuário específico"""
        if user_id in self.active_connections:
            disconnected_connections = []
            
            for connection in self.active_connections[user_id].copy():
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {e}")
                    disconnected_connections.append(connection)
            
            # Remove conexões que falharam
            for connection in disconnected_connections:
                self.disconnect(connection)

    async def send_to_role(self, message: dict, role: str):
        """Envia mensagem para todos os usuários de um role específico"""
        for websocket, user in self.connection_users.items():
            if user.role.value.lower() == role.lower():
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error sending message to role {role}: {e}")

    async def broadcast(self, message: dict):
        """Envia mensagem para todas as conexões ativas"""
        disconnected_connections = []
        
        for user_id, connections in self.active_connections.items():
            for connection in connections.copy():
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error broadcasting message: {e}")
                    disconnected_connections.append(connection)
        
        # Remove conexões que falharam
        for connection in disconnected_connections:
            self.disconnect(connection)

    async def send_personal_message_to_user(self, message: dict, user_id: int):
        """Envia mensagem para um usuário específico (alias para send_to_user)"""
        await self.send_to_user(message, user_id)

    async def send_to_role_users(self, message: dict, roles: Optional[List[UserRole]] = None):
        """Envia mensagem para usuários de roles específicos"""
        if roles is None:
            await self.broadcast(message)
            return
            
        for websocket, user in self.connection_users.items():
            if user.role in roles:
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error sending message to role users: {e}")

    async def broadcast_message(self, message: dict):
        """Envia mensagem para todas as conexões (alias para broadcast)"""
        await self.broadcast(message)

    def get_connected_users(self) -> List[dict]:
        """Retorna lista de usuários conectados"""
        users = []
        for websocket, user in self.connection_users.items():
            users.append({
                "id": user.id,
                "username": user.username,
                "role": user.role.value,
                "full_name": user.full_name
            })
        return users

# Instância global do gerenciador
manager = ConnectionManager()
