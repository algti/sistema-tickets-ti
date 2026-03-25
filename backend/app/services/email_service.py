"""
Serviço de envio de emails transacionais
Gerencia envio de notificações por email para admin e usuários
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Serviço para envio de emails transacionais"""
    
    def __init__(self):
        self.smtp_server = settings.SMTP_SERVER
        self.smtp_port = settings.SMTP_PORT
        self.smtp_username = settings.SMTP_USERNAME
        self.smtp_password = settings.SMTP_PASSWORD
        self.smtp_use_tls = settings.SMTP_USE_TLS
        self.from_email = settings.SMTP_FROM_EMAIL
        self.from_name = settings.SMTP_FROM_NAME
        self.admin_email = settings.ADMIN_NOTIFICATION_EMAIL
        self.email_enabled = settings.EMAIL_ENABLED
    
    def _send_email(self, to_emails: List[str], subject: str, html_content: str) -> bool:
        """
        Envia email via SMTP
        
        Args:
            to_emails: Lista de emails destinatários
            subject: Assunto do email
            html_content: Conteúdo HTML do email
            
        Returns:
            bool: True se enviado com sucesso, False caso contrário
        """
        if not self.email_enabled:
            logger.info(f"Email desabilitado. Não enviando: {subject}")
            return False
        
        if not self.smtp_server or not self.smtp_username or not self.smtp_password:
            logger.warning("Configurações de SMTP não definidas. Email não enviado.")
            return False
        
        try:
            # Criar mensagem
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = ', '.join(to_emails)
            
            # Adicionar conteúdo HTML
            html_part = MIMEText(html_content, 'html', 'utf-8')
            msg.attach(html_part)
            
            # Conectar ao servidor SMTP
            if self.smtp_use_tls:
                server = smtplib.SMTP(self.smtp_server, self.smtp_port)
                server.starttls()
            else:
                server = smtplib.SMTP_SSL(self.smtp_server, self.smtp_port)
            
            # Login e envio
            server.login(self.smtp_username, self.smtp_password)
            server.send_message(msg)
            server.quit()
            
            logger.info(f"Email enviado com sucesso para: {', '.join(to_emails)}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao enviar email: {e}")
            return False
    
    def send_ticket_created_notification(
        self, 
        ticket_id: int,
        ticket_title: str,
        ticket_description: str,
        ticket_priority: str,
        ticket_category: str,
        created_by_name: str,
        created_by_email: str,
        ticket_url: str
    ) -> bool:
        """Notifica sobre criação de novo ticket"""
        
        # Email para o admin
        admin_subject = f"[Novo Ticket #{ticket_id}] {ticket_title}"
        admin_html = self._get_ticket_created_template(
            ticket_id=ticket_id,
            ticket_title=ticket_title,
            ticket_description=ticket_description,
            ticket_priority=ticket_priority,
            ticket_category=ticket_category,
            created_by_name=created_by_name,
            ticket_url=ticket_url,
            is_admin=True
        )
        
        # Email para o solicitante
        user_subject = f"Ticket #{ticket_id} criado com sucesso"
        user_html = self._get_ticket_created_template(
            ticket_id=ticket_id,
            ticket_title=ticket_title,
            ticket_description=ticket_description,
            ticket_priority=ticket_priority,
            ticket_category=ticket_category,
            created_by_name=created_by_name,
            ticket_url=ticket_url,
            is_admin=False
        )
        
        # Enviar emails
        admin_sent = self._send_email([self.admin_email], admin_subject, admin_html)
        user_sent = self._send_email([created_by_email], user_subject, user_html)
        
        return admin_sent and user_sent
    
    def send_ticket_updated_notification(
        self,
        ticket_id: int,
        ticket_title: str,
        changes: List[dict],
        updated_by_name: str,
        ticket_owner_email: str,
        ticket_url: str
    ) -> bool:
        """Notifica sobre atualização de ticket"""
        
        changes_text = self._format_changes(changes)
        
        # Email para o admin
        admin_subject = f"[Atualização Ticket #{ticket_id}] {ticket_title}"
        admin_html = self._get_ticket_updated_template(
            ticket_id=ticket_id,
            ticket_title=ticket_title,
            changes_text=changes_text,
            updated_by_name=updated_by_name,
            ticket_url=ticket_url,
            is_admin=True
        )
        
        # Email para o solicitante
        user_subject = f"Seu ticket #{ticket_id} foi atualizado"
        user_html = self._get_ticket_updated_template(
            ticket_id=ticket_id,
            ticket_title=ticket_title,
            changes_text=changes_text,
            updated_by_name=updated_by_name,
            ticket_url=ticket_url,
            is_admin=False
        )
        
        # Enviar emails
        admin_sent = self._send_email([self.admin_email], admin_subject, admin_html)
        user_sent = self._send_email([ticket_owner_email], user_subject, user_html)
        
        return admin_sent and user_sent
    
    def send_ticket_comment_notification(
        self,
        ticket_id: int,
        ticket_title: str,
        comment_text: str,
        comment_by_name: str,
        ticket_owner_email: str,
        ticket_url: str
    ) -> bool:
        """Notifica sobre novo comentário em ticket"""
        
        # Email para o admin
        admin_subject = f"[Novo Comentário #{ticket_id}] {ticket_title}"
        admin_html = self._get_comment_template(
            ticket_id=ticket_id,
            ticket_title=ticket_title,
            comment_text=comment_text,
            comment_by_name=comment_by_name,
            ticket_url=ticket_url,
            is_admin=True
        )
        
        # Email para o solicitante
        user_subject = f"Novo comentário no ticket #{ticket_id}"
        user_html = self._get_comment_template(
            ticket_id=ticket_id,
            ticket_title=ticket_title,
            comment_text=comment_text,
            comment_by_name=comment_by_name,
            ticket_url=ticket_url,
            is_admin=False
        )
        
        # Enviar emails
        admin_sent = self._send_email([self.admin_email], admin_subject, admin_html)
        user_sent = self._send_email([ticket_owner_email], user_subject, user_html)
        
        return admin_sent and user_sent
    
    def send_ticket_assigned_notification(
        self,
        ticket_id: int,
        ticket_title: str,
        assigned_to_name: str,
        assigned_to_email: str,
        assigned_by_name: str,
        ticket_owner_email: str,
        ticket_url: str
    ) -> bool:
        """Notifica sobre atribuição de ticket a técnico"""
        
        # Email para o admin
        admin_subject = f"[Ticket Atribuído #{ticket_id}] {ticket_title}"
        admin_html = self._get_assigned_template(
            ticket_id=ticket_id,
            ticket_title=ticket_title,
            assigned_to_name=assigned_to_name,
            assigned_by_name=assigned_by_name,
            ticket_url=ticket_url,
            is_admin=True
        )
        
        # Email para o técnico atribuído
        tech_subject = f"Ticket #{ticket_id} atribuído a você"
        tech_html = self._get_assigned_template(
            ticket_id=ticket_id,
            ticket_title=ticket_title,
            assigned_to_name=assigned_to_name,
            assigned_by_name=assigned_by_name,
            ticket_url=ticket_url,
            is_admin=False,
            is_technician=True
        )
        
        # Email para o solicitante
        user_subject = f"Ticket #{ticket_id} atribuído a {assigned_to_name}"
        user_html = self._get_assigned_template(
            ticket_id=ticket_id,
            ticket_title=ticket_title,
            assigned_to_name=assigned_to_name,
            assigned_by_name=assigned_by_name,
            ticket_url=ticket_url,
            is_admin=False,
            is_technician=False
        )
        
        # Enviar emails
        admin_sent = self._send_email([self.admin_email], admin_subject, admin_html)
        tech_sent = self._send_email([assigned_to_email], tech_subject, tech_html)
        user_sent = self._send_email([ticket_owner_email], user_subject, user_html)
        
        return admin_sent and tech_sent and user_sent
    
    def send_ticket_status_changed_notification(
        self,
        ticket_id: int,
        ticket_title: str,
        old_status: str,
        new_status: str,
        changed_by_name: str,
        ticket_owner_email: str,
        ticket_url: str
    ) -> bool:
        """Notifica sobre mudança de status do ticket"""
        
        # Email para o admin
        admin_subject = f"[Status Alterado #{ticket_id}] {ticket_title}"
        admin_html = self._get_status_changed_template(
            ticket_id=ticket_id,
            ticket_title=ticket_title,
            old_status=old_status,
            new_status=new_status,
            changed_by_name=changed_by_name,
            ticket_url=ticket_url,
            is_admin=True
        )
        
        # Email para o solicitante
        user_subject = f"Status do ticket #{ticket_id} alterado para {new_status}"
        user_html = self._get_status_changed_template(
            ticket_id=ticket_id,
            ticket_title=ticket_title,
            old_status=old_status,
            new_status=new_status,
            changed_by_name=changed_by_name,
            ticket_url=ticket_url,
            is_admin=False
        )
        
        # Enviar emails
        admin_sent = self._send_email([self.admin_email], admin_subject, admin_html)
        user_sent = self._send_email([ticket_owner_email], user_subject, user_html)
        
        return admin_sent and user_sent
    
    def _format_changes(self, changes: List[dict]) -> str:
        """Formata lista de mudanças para exibição"""
        if not changes:
            return "Nenhuma alteração específica"
        
        formatted = []
        for change in changes:
            field = change.get('field', 'Campo')
            old_value = change.get('old_value', 'N/A')
            new_value = change.get('new_value', 'N/A')
            formatted.append(f"<li><strong>{field}:</strong> {old_value} → {new_value}</li>")
        
        return "<ul>" + "".join(formatted) + "</ul>"
    
    def _get_base_template(self, content: str) -> str:
        """Template base HTML para todos os emails"""
        return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }}
        .container {{
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .header {{
            background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }}
        .header h1 {{
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }}
        .content {{
            padding: 30px 20px;
        }}
        .ticket-info {{
            background-color: #f8fafc;
            border-left: 4px solid #0891b2;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .ticket-info p {{
            margin: 8px 0;
        }}
        .button {{
            display: inline-block;
            padding: 12px 24px;
            background-color: #0891b2;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 500;
        }}
        .button:hover {{
            background-color: #0e7490;
        }}
        .footer {{
            background-color: #f8fafc;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }}
        .priority-high {{
            color: #dc2626;
            font-weight: bold;
        }}
        .priority-medium {{
            color: #f59e0b;
            font-weight: bold;
        }}
        .priority-low {{
            color: #10b981;
            font-weight: bold;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎫 Sistema de Tickets ALG TI</h1>
        </div>
        <div class="content">
            {content}
        </div>
        <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
            <p>© 2024 ALG TI - Sistema de Gerenciamento de Tickets</p>
        </div>
    </div>
</body>
</html>
"""
    
    def _get_ticket_created_template(
        self,
        ticket_id: int,
        ticket_title: str,
        ticket_description: str,
        ticket_priority: str,
        ticket_category: str,
        created_by_name: str,
        ticket_url: str,
        is_admin: bool = False
    ) -> str:
        """Template para notificação de ticket criado"""
        
        priority_class = f"priority-{ticket_priority.lower()}"
        
        if is_admin:
            greeting = f"<h2>Novo Ticket Criado</h2>"
            message = f"<p>Um novo ticket foi aberto no sistema por <strong>{created_by_name}</strong>.</p>"
        else:
            greeting = f"<h2>Olá, {created_by_name}!</h2>"
            message = f"<p>Seu ticket foi criado com sucesso e nossa equipe já foi notificada.</p>"
        
        content = f"""
{greeting}
{message}

<div class="ticket-info">
    <p><strong>Ticket:</strong> #{ticket_id}</p>
    <p><strong>Título:</strong> {ticket_title}</p>
    <p><strong>Prioridade:</strong> <span class="{priority_class}">{ticket_priority.upper()}</span></p>
    <p><strong>Categoria:</strong> {ticket_category}</p>
    <p><strong>Descrição:</strong></p>
    <p>{ticket_description}</p>
</div>

<p>
    <a href="{ticket_url}" class="button">Ver Ticket</a>
</p>

<p>Você receberá atualizações sobre este ticket por email.</p>
"""
        
        return self._get_base_template(content)
    
    def _get_ticket_updated_template(
        self,
        ticket_id: int,
        ticket_title: str,
        changes_text: str,
        updated_by_name: str,
        ticket_url: str,
        is_admin: bool = False
    ) -> str:
        """Template para notificação de ticket atualizado"""
        
        if is_admin:
            greeting = f"<h2>Ticket Atualizado</h2>"
            message = f"<p>O ticket #{ticket_id} foi atualizado por <strong>{updated_by_name}</strong>.</p>"
        else:
            greeting = f"<h2>Seu Ticket Foi Atualizado</h2>"
            message = f"<p>O ticket #{ticket_id} - {ticket_title} foi atualizado.</p>"
        
        content = f"""
{greeting}
{message}

<div class="ticket-info">
    <p><strong>Ticket:</strong> #{ticket_id} - {ticket_title}</p>
    <p><strong>Atualizado por:</strong> {updated_by_name}</p>
    <p><strong>Alterações:</strong></p>
    {changes_text}
</div>

<p>
    <a href="{ticket_url}" class="button">Ver Ticket</a>
</p>
"""
        
        return self._get_base_template(content)
    
    def _get_comment_template(
        self,
        ticket_id: int,
        ticket_title: str,
        comment_text: str,
        comment_by_name: str,
        ticket_url: str,
        is_admin: bool = False
    ) -> str:
        """Template para notificação de novo comentário"""
        
        if is_admin:
            greeting = f"<h2>Novo Comentário</h2>"
            message = f"<p><strong>{comment_by_name}</strong> adicionou um comentário no ticket #{ticket_id}.</p>"
        else:
            greeting = f"<h2>Novo Comentário no Seu Ticket</h2>"
            message = f"<p><strong>{comment_by_name}</strong> comentou no seu ticket.</p>"
        
        content = f"""
{greeting}
{message}

<div class="ticket-info">
    <p><strong>Ticket:</strong> #{ticket_id} - {ticket_title}</p>
    <p><strong>Comentário de:</strong> {comment_by_name}</p>
    <p><strong>Mensagem:</strong></p>
    <p>{comment_text}</p>
</div>

<p>
    <a href="{ticket_url}" class="button">Ver Ticket e Responder</a>
</p>
"""
        
        return self._get_base_template(content)
    
    def _get_assigned_template(
        self,
        ticket_id: int,
        ticket_title: str,
        assigned_to_name: str,
        assigned_by_name: str,
        ticket_url: str,
        is_admin: bool = False,
        is_technician: bool = False
    ) -> str:
        """Template para notificação de ticket atribuído"""
        
        if is_admin:
            greeting = f"<h2>Ticket Atribuído</h2>"
            message = f"<p>O ticket #{ticket_id} foi atribuído a <strong>{assigned_to_name}</strong> por {assigned_by_name}.</p>"
        elif is_technician:
            greeting = f"<h2>Novo Ticket Atribuído a Você</h2>"
            message = f"<p>O ticket #{ticket_id} foi atribuído a você por <strong>{assigned_by_name}</strong>.</p>"
        else:
            greeting = f"<h2>Ticket Atribuído</h2>"
            message = f"<p>Seu ticket foi atribuído a <strong>{assigned_to_name}</strong> e está sendo analisado.</p>"
        
        content = f"""
{greeting}
{message}

<div class="ticket-info">
    <p><strong>Ticket:</strong> #{ticket_id} - {ticket_title}</p>
    <p><strong>Responsável:</strong> {assigned_to_name}</p>
    <p><strong>Atribuído por:</strong> {assigned_by_name}</p>
</div>

<p>
    <a href="{ticket_url}" class="button">Ver Ticket</a>
</p>
"""
        
        return self._get_base_template(content)
    
    def _get_status_changed_template(
        self,
        ticket_id: int,
        ticket_title: str,
        old_status: str,
        new_status: str,
        changed_by_name: str,
        ticket_url: str,
        is_admin: bool = False
    ) -> str:
        """Template para notificação de mudança de status"""
        
        status_messages = {
            'open': 'Aberto',
            'in_progress': 'Em Andamento',
            'waiting_user': 'Aguardando Usuário',
            'resolved': 'Resolvido',
            'closed': 'Fechado',
            'reopened': 'Reaberto'
        }
        
        old_status_text = status_messages.get(old_status, old_status)
        new_status_text = status_messages.get(new_status, new_status)
        
        if is_admin:
            greeting = f"<h2>Status do Ticket Alterado</h2>"
            message = f"<p>O status do ticket #{ticket_id} foi alterado por <strong>{changed_by_name}</strong>.</p>"
        else:
            greeting = f"<h2>Status do Seu Ticket Alterado</h2>"
            message = f"<p>O status do seu ticket foi atualizado.</p>"
        
        content = f"""
{greeting}
{message}

<div class="ticket-info">
    <p><strong>Ticket:</strong> #{ticket_id} - {ticket_title}</p>
    <p><strong>Status Anterior:</strong> {old_status_text}</p>
    <p><strong>Novo Status:</strong> {new_status_text}</p>
    <p><strong>Alterado por:</strong> {changed_by_name}</p>
</div>

<p>
    <a href="{ticket_url}" class="button">Ver Ticket</a>
</p>
"""
        
        return self._get_base_template(content)


# Instância global do serviço de email
email_service = EmailService()
