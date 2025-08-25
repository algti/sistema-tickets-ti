# from ldap3 import Server, Connection, ALL, NTLM  # Comentado temporariamente
from typing import Optional, Dict, Any
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class LDAPService:
    def __init__(self):
        # Mock LDAP service for testing without AD connection
        self.server = None  # Server(settings.LDAP_SERVER, get_info=ALL)
        self.base_dn = settings.LDAP_BASE_DN
        self.user_search_base = settings.LDAP_USER_SEARCH_BASE
        self.group_search_base = settings.LDAP_GROUP_SEARCH_BASE
        
    def authenticate_user(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Mock authentication for testing (replace with real LDAP when ready)
        Returns user info if successful, None if failed
        """
        # Skip LDAP authentication for local admin user
        if username == 'admin':
            return None  # Let local authentication handle admin
        
        # Mock users for testing (excluding admin)
        mock_users = {
            'tecnico': {
                'username': 'tecnico',
                'full_name': 'Técnico de TI',
                'email': 'tecnico@empresa.local',
                'department': 'TI',
                'phone': '(11) 88888-8888',
                'groups': ['ti-tech', 'helpdesk-tech']
            },
            'usuario': {
                'username': 'usuario',
                'full_name': 'Usuário Comum',
                'email': 'usuario@empresa.local',
                'department': 'Vendas',
                'phone': '(11) 77777-7777',
                'groups': ['users']
            }
        }
        
        # Simple password check (in real implementation, this would be LDAP)
        if username in mock_users and password in ['tecnico123', 'usuario123']:
            return mock_users[username]
        
        return None
    
    def _get_user_details(self, conn, username: str) -> Dict[str, Any]:
        """Get user details from Active Directory"""
        try:
            # Search for user
            search_filter = f"(sAMAccountName={username})"
            conn.search(
                search_base=self.user_search_base,
                search_filter=search_filter,
                attributes=['cn', 'mail', 'department', 'telephoneNumber', 'displayName', 'memberOf']
            )
            
            if conn.entries:
                entry = conn.entries[0]
                
                # Extract user information
                user_info = {
                    'username': username,
                    'full_name': str(entry.displayName) if entry.displayName else str(entry.cn),
                    'email': str(entry.mail) if entry.mail else f"{username}@{settings.LDAP_BASE_DN.replace('DC=', '').replace(',', '.')}",
                    'department': str(entry.department) if entry.department else None,
                    'phone': str(entry.telephoneNumber) if entry.telephoneNumber else None,
                    'groups': [str(group) for group in entry.memberOf] if entry.memberOf else []
                }
                
                return user_info
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting user details: {str(e)}")
            return None
    
    def get_user_groups(self, username: str) -> list:
        """Mock get user groups for testing"""
        # Mock groups based on username
        mock_groups = {
            'admin': ['ti-admin', 'helpdesk-admin'],
            'tecnico': ['ti-tech', 'helpdesk-tech'],
            'usuario': ['users']
        }
        return mock_groups.get(username, [])
    
    def is_user_in_group(self, username: str, group_name: str) -> bool:
        """Check if user is member of specific group"""
        try:
            groups = self.get_user_groups(username)
            return any(group_name.lower() in group.lower() for group in groups)
        except Exception as e:
            logger.error(f"Error checking user group membership: {str(e)}")
            return False

# Global instance
ldap_service = LDAPService()
