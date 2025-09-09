"""
Sistema de notificações para WebSocket
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from app.websocket.manager import manager
from app.models.models import Ticket, User, TicketStatus, UserRole
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    """Serviço para envio de notificações em tempo real"""
    
    @staticmethod
    async def notify_ticket_created(ticket: Ticket, created_by: User):
        """Notifica sobre criação de novo ticket"""
        message = {
            "type": "ticket_created",
            "ticket_id": ticket.id,
            "title": ticket.title,
            "priority": ticket.priority.value,
            "status": ticket.status.value,
            "created_by": {
                "id": created_by.id,
                "username": created_by.username,
                "full_name": created_by.full_name
            },
            "created_at": ticket.created_at.isoformat(),
            "message": f"Novo ticket criado: {ticket.title}",
            "timestamp": datetime.now().isoformat()
        }
        
        # Notifica apenas técnicos e admins (não o próprio criador)
        await manager.send_to_role(message, "technician")
        await manager.send_to_role(message, "admin")
        
        logger.info(f"Notification sent for new ticket {ticket.id}")

    @staticmethod
    async def notify_ticket_assigned(ticket: Ticket, assigned_to: User, assigned_by: User):
        """Notifica sobre atribuição de ticket"""
        message = {
            "type": "ticket_assigned",
            "ticket_id": ticket.id,
            "title": ticket.title,
            "priority": ticket.priority.value,
            "assigned_to": {
                "id": assigned_to.id,
                "username": assigned_to.username,
                "full_name": assigned_to.full_name
            },
            "assigned_by": {
                "id": assigned_by.id,
                "username": assigned_by.username,
                "full_name": assigned_by.full_name
            },
            "message": f"Ticket #{ticket.id} foi atribuído para você",
            "timestamp": datetime.now().isoformat()
        }
        
        # Notifica o técnico atribuído
        await manager.send_to_user(message, assigned_to.id)
        
        # Notifica o criador do ticket se for diferente
        if ticket.created_by_id != assigned_by.id:
            creator_message = message.copy()
            creator_message["message"] = f"Ticket #{ticket.id} foi atribuído para {assigned_to.full_name}"
            await manager.send_to_user(creator_message, ticket.created_by_id)
        
        logger.info(f"Notification sent for ticket assignment {ticket.id} to user {assigned_to.id}")

    @staticmethod
    async def notify_ticket_status_changed(ticket: Ticket, old_status: TicketStatus, changed_by: User):
        """Notifica sobre mudança de status do ticket"""
        status_messages = {
            TicketStatus.OPEN: "aberto",
            TicketStatus.IN_PROGRESS: "em andamento",
            TicketStatus.RESOLVED: "resolvido",
            TicketStatus.CLOSED: "fechado",
            TicketStatus.WAITING_USER: "aguardando usuário",
            TicketStatus.REOPENED: "reaberto"
        }
        
        message = {
            "type": "ticket_status_changed",
            "ticket_id": ticket.id,
            "title": ticket.title,
            "old_status": old_status.value,
            "new_status": ticket.status.value,
            "changed_by": {
                "id": changed_by.id,
                "username": changed_by.username,
                "full_name": changed_by.full_name
            },
            "message": f"Status do ticket #{ticket.id} alterado para {status_messages.get(ticket.status, ticket.status.value)}",
            "timestamp": datetime.now().isoformat()
        }
        
        # Lista de usuários para notificar
        users_to_notify = set()
        
        # Sempre notifica o criador do ticket
        users_to_notify.add(ticket.created_by_id)
        
        # Notifica o técnico atribuído se houver
        if ticket.assigned_to_id:
            users_to_notify.add(ticket.assigned_to_id)
        
        # Remove o usuário que fez a mudança para evitar auto-notificação
        users_to_notify.discard(changed_by.id)
        
        # Envia notificações
        for user_id in users_to_notify:
            await manager.send_to_user(message, user_id)
        
        logger.info(f"Notification sent for status change of ticket {ticket.id}")

    @staticmethod
    async def notify_new_comment(ticket: Ticket, comment_text: str, commented_by: User):
        """Notifica sobre novo comentário no ticket"""
        message = {
            "type": "new_comment",
            "ticket_id": ticket.id,
            "title": ticket.title,
            "comment_preview": comment_text[:100] + "..." if len(comment_text) > 100 else comment_text,
            "commented_by": {
                "id": commented_by.id,
                "username": commented_by.username,
                "full_name": commented_by.full_name
            },
            "message": f"Novo comentário no ticket #{ticket.id} por {commented_by.full_name}",
            "timestamp": datetime.now().isoformat()
        }
        
        # Lista de usuários para notificar
        users_to_notify = set()
        
        # Sempre notifica o criador do ticket
        users_to_notify.add(ticket.created_by_id)
        
        # Notifica o técnico atribuído se houver
        if ticket.assigned_to_id:
            users_to_notify.add(ticket.assigned_to_id)
        
        # Remove o usuário que comentou para evitar auto-notificação
        users_to_notify.discard(commented_by.id)
        
        # Envia notificações
        for user_id in users_to_notify:
            await manager.send_to_user(message, user_id)
        
        logger.info(f"Notification sent for new comment on ticket {ticket.id}")

    @staticmethod
    async def notify_ticket_resolved(ticket: Ticket, resolved_by: User):
        """Notifica sobre resolução do ticket"""
        message = {
            "type": "ticket_resolved",
            "ticket_id": ticket.id,
            "title": ticket.title,
            "resolved_by": {
                "id": resolved_by.id,
                "username": resolved_by.username,
                "full_name": resolved_by.full_name
            },
            "message": f"Ticket #{ticket.id} foi resolvido por {resolved_by.full_name}",
            "timestamp": datetime.now().isoformat()
        }
        
        # Notifica o criador do ticket
        await manager.send_to_user(message, ticket.created_by_id)
        
        logger.info(f"Notification sent for ticket resolution {ticket.id}")

    @staticmethod
    async def send_system_notification(message: str, users: Optional[List[int]] = None, roles: Optional[List[str]] = None):
        """Envia notificação do sistema"""
        notification = {
            "type": "system_notification",
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        
        if users:
            # Envia para usuários específicos
            for user_id in users:
                await manager.send_to_user(notification, user_id)
        elif roles:
            # Envia para roles específicos
            for role in roles:
                await manager.send_to_role(notification, role)
        else:
            # Broadcast para todos
            await manager.broadcast(notification)
        
        logger.info(f"System notification sent: {message}")

# Instância global do serviço
notification_service = NotificationService()
