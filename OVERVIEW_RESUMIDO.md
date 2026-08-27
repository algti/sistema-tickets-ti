# 📊 OVERVIEW RESUMIDO - SISTEMA DE TICKETS ALG

## STACK TECNOLÓGICO

### Frontend
- **Framework:** React 18.2.0
- **Roteamento:** React Router v6
- **Styling:** TailwindCSS 3.3.6
- **HTTP Client:** Axios 1.6.2
- **Gráficos:** Recharts 2.15.4
- **Ícones:** Lucide React 0.575.0
- **Formulários:** React Hook Form 7.48.2
- **Notificações:** React Hot Toast 2.4.1
- **Exportação:** JSPDF 3.0.1, XLSX 0.18.5

### Backend
- **Framework:** FastAPI 0.104.1
- **Servidor:** Uvicorn 0.24.0
- **ORM:** SQLAlchemy 2.0.23
- **Validação:** Pydantic 2.5.0
- **Autenticação:** Python-Jose 3.3.0 (JWT)
- **Hash:** Passlib 1.7.4 (bcrypt)
- **LDAP:** ldap3 (integração AD)
- **Migrações:** Alembic 1.12.1
- **Async:** aiofiles 23.2.1

### Banco de Dados
- **Tipo:** SQLite3
- **Arquivo:** `/backend/tickets.db`
- **Migrações:** Alembic
- **Timezone:** America/Sao_Paulo (UTC-3)

### Infraestrutura
- **Servidor:** Hostinger VPS (Linux)
- **Proxy Reverso:** Nginx
- **SSL:** Let's Encrypt
- **Domínios:** ticket.algti.com.br, ticket.algti.com
- **Serviço:** Systemd (tickets-backend)

---

## ARQUITETURA EM 3 CAMADAS

```
┌─────────────────────────────────────────┐
│   FRONTEND (React SPA)                  │
│   - Dark Theme Moderno                  │
│   - Context API (Auth, Theme, WebSocket)│
│   - 21 páginas + componentes            │
└─────────────────────────────────────────┘
              ↓ (HTTPS)
┌─────────────────────────────────────────┐
│   NGINX (Proxy Reverso)                 │
│   - Redirecionamento HTTP → HTTPS       │
│   - Proxy para API (:8000)              │
│   - Proxy para WebSocket                │
│   - Servir frontend estático            │
└─────────────────────────────────────────┘
              ↓ (HTTP)
┌─────────────────────────────────────────┐
│   BACKEND (FastAPI)                     │
│   - 11 routers (auth, tickets, users...)│
│   - JWT + LDAP Authentication           │
│   - WebSocket para notificações         │
│   - RBAC (3 roles: user, tech, admin)   │
└─────────────────────────────────────────┘
              ↓ (SQL)
┌─────────────────────────────────────────┐
│   SQLite Database                       │
│   - 10 tabelas principais               │
│   - Relacionamentos 1:N                 │
│   - Índices otimizados                  │
└─────────────────────────────────────────┘
```

---

## MODELOS DE DADOS

### Tabelas Principais (10)
1. **companies** - Empresas clientes
2. **users** - Usuários (user, technician, admin)
3. **categories** - Categorias de tickets
4. **tickets** - Chamados/tickets
5. **ticket_comments** - Comentários (públicos/internos)
6. **ticket_attachments** - Arquivos anexados
7. **ticket_activities** - Log de atividades
8. **ticket_evaluations** - Avaliações de satisfação
9. **asset_categories** - Categorias de ativos
10. **assets** - Equipamentos/ativos

### Enums
- **UserRole:** user, technician, admin
- **TicketStatus:** open, in_progress, waiting_user, resolved, closed, reopened
- **TicketPriority:** low, medium, high, urgent
- **ContractStatus:** active, expired, pending_renewal
- **AssetStatus:** active, maintenance, retired

---

## ENDPOINTS PRINCIPAIS (40+)

### Autenticação (3)
- `POST /api/v1/auth/login` - Login com LDAP/local
- `GET /api/v1/auth/me` - Dados do usuário
- `POST /api/v1/auth/refresh` - Renovar token

### Tickets (10)
- `GET /api/v1/tickets/` - Listar com filtros
- `GET /api/v1/tickets/{id}` - Detalhes
- `POST /api/v1/tickets/` - Criar
- `PUT /api/v1/tickets/{id}` - Atualizar
- `DELETE /api/v1/tickets/{id}` - Deletar
- `POST /api/v1/tickets/{id}/comments` - Adicionar comentário
- `GET /api/v1/tickets/{id}/comments` - Listar comentários
- `POST /api/v1/tickets/{id}/attachments` - Upload arquivo
- `GET /api/v1/tickets/{id}/attachments/{aid}/download` - Download
- `GET /api/v1/tickets/test` - Teste sem autenticação

### Usuários (8)
- `GET /api/v1/users/` - Listar usuários
- `GET /api/v1/users/{id}` - Detalhes
- `POST /api/v1/users/` - Criar usuário
- `PUT /api/v1/users/{id}` - Atualizar
- `PUT /api/v1/users/profile` - Atualizar perfil
- `GET /api/v1/users/technicians` - Listar técnicos
- `DELETE /api/v1/users/{id}` - Desativar
- `PUT /api/v1/users/{id}/activate` - Ativar

### Dashboard (4)
- `GET /api/v1/dashboard/stats` - Estatísticas gerais
- `GET /api/v1/dashboard/tickets-by-month` - Gráfico mensal
- `GET /api/v1/dashboard/technician-performance` - Performance
- `GET /api/v1/dashboard/priority-trends` - Tendências

### Avaliações (4)
- `POST /api/v1/evaluations/tickets/{id}/evaluation` - Criar
- `GET /api/v1/evaluations/tickets/{id}/evaluation` - Obter
- `GET /api/v1/evaluations/evaluations` - Listar
- `GET /api/v1/evaluations/metrics/satisfaction` - Métricas

### Relatórios (8)
- `GET /api/v1/reports/performance/technicians` - Performance
- `GET /api/v1/reports/general` - Geral
- `GET /api/v1/reports/by-company` - Por empresa
- `GET /api/v1/reports/by-user` - Por usuário
- `GET /api/v1/reports/by-category` - Por categoria
- `GET /api/v1/reports/advanced/satisfaction-analysis` - Satisfação
- `GET /api/v1/reports/advanced/financial-consolidated` - Financeiro
- `GET /api/v1/reports/advanced/productivity-analysis` - Produtividade

### Categorias (4)
- `GET /api/v1/categories/` - Listar
- `POST /api/v1/categories/` - Criar
- `PUT /api/v1/categories/{id}` - Atualizar
- `DELETE /api/v1/categories/{id}` - Deletar

### Empresas (5)
- `GET /api/v1/companies/` - Listar
- `POST /api/v1/companies/` - Criar
- `PUT /api/v1/companies/{id}` - Atualizar
- `GET /api/v1/companies/{id}` - Detalhes
- `GET /api/v1/companies/{id}/users` - Usuários

### Ativos (8)
- `GET /api/v1/assets` - Listar
- `POST /api/v1/assets` - Criar
- `PUT /api/v1/assets/{id}` - Atualizar
- `GET /api/v1/assets/categories/` - Categorias
- `POST /api/v1/assets/categories/` - Criar categoria
- `GET /api/v1/assets/reports/warranty` - Relatório garantia
- `GET /api/v1/assets/reports/maintenance` - Relatório manutenção

### WebSocket (1)
- `WS /api/v1/notifications/ws?token=<jwt>` - Notificações real-time

---

## PÁGINAS FRONTEND (21)

### Públicas
- **Login** - Autenticação

### Usuários Comuns
- **Dashboard** - Métricas e estatísticas
- **Tickets** - Listar seus tickets
- **TicketDetail** - Detalhes e comentários
- **CreateTicket** - Criar novo ticket
- **Profile** - Perfil do usuário
- **Notifications** - Centro de notificações
- **KnowledgeBase** - Base de conhecimento

### Técnicos + Admins
- **Users** - Gerenciar usuários
- **Companies** - Gerenciar empresas
- **CompanyForm** - Criar/editar empresa
- **CompanyFinancialReport** - Relatório financeiro
- **Reports** - Relatórios básicos
- **AdvancedReports** - Relatórios avançados
- **Templates** - Templates de respostas
- **Assets** - Gerenciar ativos
- **Categories** - Gerenciar categorias
- **Settings** - Configurações
- **WebSocketTest** - Teste de WebSocket

---

## FLUXOS PRINCIPAIS

### 1. Login
```
Usuário → Insere credenciais → POST /auth/login
Backend → Tenta LDAP → Se falhar, tenta local
Backend → Gera JWT token (24h)
Frontend → Armazena token em localStorage
Frontend → Redireciona para /dashboard
```

### 2. Criar Ticket
```
Usuário → Clica "Novo Ticket"
Preenche: título, descrição, categoria, prioridade
Upload de anexos (opcional)
POST /tickets/ → Backend cria registro
Cria TicketActivity (log)
Envia notificação WebSocket para técnicos
Envia email (se configurado)
Frontend → Redireciona para TicketDetail
```

### 3. Atribuir e Resolver
```
Técnico → Visualiza ticket
Clica "Atribuir a mim" → PUT /tickets/{id}
Status muda para "in_progress"
Técnico → Adiciona comentários e solução
Marca como "resolved"
Usuário → Recebe notificação
Usuário → Confirma resolução → Status "closed"
Avaliação fica disponível
Usuário → Avalia (1-5 stars)
Ticket finalizado
```

### 4. Notificações WebSocket
```
Frontend → Abre conexão WS /notifications/ws?token=<jwt>
Backend → Registra conexão no ConnectionManager
Evento ocorre (novo ticket, status mudou)
Backend → Envia mensagem JSON via WebSocket
Frontend → Recebe e atualiza estado
Toast notification aparece
Usuário clica → Navega para ticket
```

---

## SEGURANÇA

### Autenticação
- **JWT:** HS256, 24h expiração
- **LDAP:** Active Directory integrado
- **Fallback:** Admin local (admin@empresa.local)
- **Grupos AD:** ti-admin, ti-tech (mapeiam roles)

### Autorização (RBAC)
```
USER (Comum):
  ✓ Criar tickets, ver próprios, comentar, avaliar
  ✗ Ver tickets de outros, alterar status, atribuir

TECHNICIAN:
  ✓ Ver todos, alterar status, atribuir, comentários internos
  ✗ Criar usuários, gerenciar empresas, configurações

ADMIN:
  ✓ Tudo (super user)
```

### Proteção de Dados
- Senhas: Hash bcrypt/SHA256
- Tokens: JWT com expiração
- Comentários internos: Visíveis só para técnicos
- CORS: Origens whitelist
- HTTPS: SSL Let's Encrypt
- Upload: Validação de tipo e tamanho (10MB)

---

## VARIÁVEIS CRÍTICAS

### Frontend (AuthContext)
```javascript
user = {
  id, username, email, full_name, 
  role ('user'|'technician'|'admin'),
  department, is_active
}
token = JWT string
isAuthenticated = boolean
isAdmin = boolean
isTechnician = boolean
```

### Backend (Settings)
```python
SECRET_KEY = "change-in-production"
DATABASE_URL = "sqlite:///./tickets.db"
LDAP_SERVER = "ldap://ad-server:389"
SMTP_SERVER = "smtp.gmail.com"
MAX_FILE_SIZE = 10485760  # 10MB
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24h
TIMEZONE = "America/Sao_Paulo"
```

---

## FUNCIONALIDADES PRINCIPAIS

✅ Sistema de tickets com 6 status
✅ 3 roles de usuário (user, technician, admin)
✅ Autenticação LDAP + JWT
✅ Notificações WebSocket em tempo real
✅ Upload de anexos (até 10MB)
✅ Avaliação de satisfação (1-5 stars)
✅ Dashboard com métricas
✅ Relatórios básicos e avançados
✅ Base de conhecimento
✅ Gerenciar ativos/equipamentos
✅ Gerenciar empresas e usuários
✅ Dark theme moderno
✅ Exportação Excel/PDF
✅ Comentários públicos e internos
✅ Log de atividades

---

## DEPLOY

**Servidor:** srv1049200.hstgr.cloud (Hostinger VPS)
**Diretório:** /var/www/sistema-tickets-ti
**Branch:** ALG_TICKETS

**Serviços:**
- Nginx (proxy reverso, SSL)
- FastAPI (porta 8000)
- SQLite (tickets.db)

**Domínios:**
- ticket.algti.com.br (HTTPS)
- ticket.algti.com (HTTPS)

**Comandos:**
```bash
# Restart backend
sudo systemctl restart tickets-backend

# Ver logs
sudo journalctl -u tickets-backend -n 50 -f

# Build frontend
cd /var/www/sistema-tickets-ti/frontend
npm run build

# Reload nginx
sudo nginx -t && sudo systemctl reload nginx
```

---

## CHECKLIST DE SEGURANÇA

- [x] Autenticação JWT
- [x] LDAP/AD integrado
- [x] Validação Pydantic
- [x] CORS configurado
- [x] RBAC (3 roles)
- [x] Hash de senhas
- [x] HTTPS/SSL
- [x] Comentários internos protegidos
- [x] Validação de upload
- [ ] Rate limiting
- [ ] Logging de auditoria completo
- [ ] Backup automático
- [ ] 2FA (Two-Factor Auth)

---

**Status:** ✅ Produção Ativa
**Versão:** 1.0.0
**Última Atualização:** 2024
