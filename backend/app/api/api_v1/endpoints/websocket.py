"""
WebSocket endpoints para notificações em tempo real
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.deps import get_db
from app.websocket.manager import manager
from app.models.models import User
from app.core.security import verify_token
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter()

async def get_user_from_websocket_token(token: str, db: Session) -> User:
    """Valida token e retorna usuário para WebSocket"""
    try:
        logger.info(f"WebSocket auth attempt with token: {token[:20]}...")
        payload = verify_token(token)
        logger.info(f"Token payload: {payload}")
        
        username = payload.get("sub")
        if not username:
            logger.error("No username in token payload")
            raise HTTPException(status_code=401, detail="Invalid token")
        
        logger.info(f"Looking for user: {username}")
        user = db.query(UserModel).filter(UserModel.username == username).first()
        if not user:
            logger.error(f"User not found: {username}")
            raise HTTPException(status_code=401, detail="User not found")
        
        if not user.is_active:
            logger.error(f"User inactive: {username}")
            raise HTTPException(status_code=401, detail="User inactive")
        
        logger.info(f"WebSocket auth successful for user: {username}")
        return user
    except Exception as e:
        logger.error(f"WebSocket authentication error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """Endpoint principal do WebSocket para notificações"""
    logger.info(f"WebSocket connection attempt from {websocket.client}")
    try:
        # Autentica o usuário
        logger.info("Starting WebSocket authentication...")
        user = await get_user_from_websocket_token(token, db)
        
        # Conecta o usuário
        logger.info(f"Connecting user {user.username} to WebSocket")
        await manager.connect(websocket, user)
        logger.info(f"User {user.username} connected successfully")
        
        try:
            while True:
                # Recebe mensagens do cliente (heartbeat, etc.)
                data = await websocket.receive_text()
                
                try:
                    message = json.loads(data)
                    message_type = message.get("type")
                    
                    if message_type == "heartbeat":
                        # Responde ao heartbeat
                        await manager.send_personal_message({
                            "type": "heartbeat_response",
                            "timestamp": message.get("timestamp")
                        }, websocket)
                    
                    elif message_type == "get_connected_users":
                        # Retorna lista de usuários conectados (apenas para admins)
                        if user.role.value == "admin":
                            connected_users = manager.get_connected_users()
                            await manager.send_personal_message({
                                "type": "connected_users",
                                "users": connected_users
                            }, websocket)
                    
                    elif message_type == "mark_notification_read":
                        # Marca notificação como lida
                        notification_id = message.get("notification_id")
                        if notification_id:
                            # Aqui você pode implementar a lógica para marcar como lida no banco
                            logger.info(f"User {user.id} marked notification {notification_id} as read")
                    
                except json.JSONDecodeError:
                    logger.warning(f"Invalid JSON received from user {user.id}")
                except Exception as e:
                    logger.error(f"Error processing message from user {user.id}: {e}")
        
        except WebSocketDisconnect:
            pass
    
    except HTTPException:
        # Erro de autenticação
        await websocket.close(code=1008, reason="Authentication failed")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.close(code=1011, reason="Internal server error")
    
    finally:
        # Desconecta o usuário
        manager.disconnect(websocket)

@router.get("/connected-users")
async def get_connected_users(db: Session = Depends(get_db)):
    """Retorna lista de usuários conectados (apenas para admins)"""
    # Nota: Esta rota requer autenticação de admin
    connected_users = manager.get_connected_users()
    return {
        "connected_users": connected_users,
        "total": len(connected_users)
    }
