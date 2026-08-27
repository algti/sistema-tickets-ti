# 📋 OVERVIEW COMPLETO - SISTEMA DE TICKETS ALG SOLUÇÕES EM TECNOLOGIA

## 1. ARQUITETURA GERAL DO SISTEMA

### 1.1 Estrutura em Camadas
```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React.js)                       │
│  - Single Page Application (SPA)                             │
│  - TailwindCSS + Lucide Icons                                │
│  - Context API para estado global                            │
└─────────────────────────────────────────────────────────────┘
                            ↓ (HTTP/WebSocket)
┌─────────────────────────────────────────────────────────────┐
│                    NGINX (Proxy Reverso)                     │
│  - Redirecionamento HTTP → HTTPS                             │
│  - Proxy para API Backend (porta 8000)                       │
│  - Proxy para WebSocket                                      │
│  - Servir arquivos estáticos do frontend                     │
└─────────────────────────────────────────────────────────────┘
                            ↓ (HTTP)
┌─────────────────────────────────────────────────────────────┐
│                 BACKEND (FastAPI - Python)                   │
│  - API RESTful com rotas versionadas (/api/v1/)              │
│  - WebSocket para notificações em tempo real                 │
│  - Autenticação JWT + LDAP                                   │
│  - Validação com Pydantic                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓ (SQL)
┌─────────────────────────────────────────────────────────────┐
│                  BANCO DE DADOS (SQLite)                     │
│  - Arquivo: /backend/tickets.db                              │
│  - Migrações com Alembic                                     │
│  - Suporte a transações ACID                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. FRONTEND (React.js)

### 2.1 Estrutura de Diretórios
```
frontend/
├── src/
│   ├── App.js                    # Roteamento principal
│   ├── index.js                  # Entry point
│   ├── index.css                 # Estilos globais + dark theme
│   ├── components/               # Componentes reutilizáveis
│   │   └── Layout.js             # Layout principal com sidebar
│   ├── contexts/                 # Context API para estado global
│   │   ├── AuthContext.js        # Autenticação e usuário
│   │   ├── ThemeContext.js       # Dark/Light theme
│   │   └── WebSocketContext.js   # Notificações em tempo real
│   ├── pages/                    # Páginas da aplicação
│   │   ├── Login.js              # Página de login
│   │   ├── Dashboard.js          # Dashboard com métricas
│   │   ├── Tickets.js            # Lista de tickets
│   │   ├── TicketDetail.js       # Detalhes de um ticket
│   │   ├── CreateTicket.js       # Criar novo ticket
│   │   ├── Users.js              # Gerenciar usuários (admin/tech)
│   │   ├── Companies.js          # Gerenciar empresas
│   │   ├── Categories.js         # Gerenciar categorias
│   │   ├── Profile.js            # Perfil do usuário
│   │   ├── Reports.js            # Relatórios
│   │   ├── Assets.js             # Gerenciar ativos
│   │   ├── KnowledgeBase.js      # Base de conhecimento
│   │   ├── Settings.js           # Configurações (admin)
│   │   └── Notifications.js      # Centro de notificações
│   └── services/
│       └── api.js                # Configuração Axios + endpoints
├── package.json                  # Dependências npm
└── public/                       # Arquivos estáticos
```

### 2.2 Dependências Principais
```json
{
  "react": "^18.2.0",              // Framework UI
  "react-router-dom": "^6.8.1",    // Roteamento
  "axios": "^1.6.2",               // HTTP client
  "tailwindcss": "^3.3.6",         // Styling
  "lucide-react": "^0.575.0",      // Icons
  "react-hook-form": "^7.48.2",    // Form management
  "react-hot-toast": "^2.4.1",     // Notificações
  "recharts": "^2.15.4",           // Gráficos
  "date-fns": "^2.30.0",           // Manipulação de datas
  "jspdf": "^3.0.1",               // Geração de PDFs
  "xlsx": "^0.18.5"                // Exportação Excel
}
```

### 2.3 Contexts (Estado Global)

#### AuthContext.js
**Responsabilidades:**
- Gerenciar autenticação do usuário
- Armazenar token JWT no localStorage
- Manter dados do usuário logado
- Controlar permissões por role (user, technician, admin)

**Variáveis Principais:**
```javascript
{
  user: {                    // Usuário autenticado
    id: number,
    username: string,
    email: string,
    full_name: string,
    role: 'user' | 'technician' | 'admin',
    department: string,
    is_active: boolean
  },
  token: string,             // JWT token
  loading: boolean,          // Estado de carregamento
  isAuthenticated: boolean,  // Usuário logado?
  isAdmin: boolean,          // É admin?
  isTechnician: boolean,     // É técnico ou admin?
  isUser: boolean            // É usuário comum?
}
```

**Funções Principais:**
- `login(username, password)` - Autenticar usuário
- `logout()` - Desconectar
- `refreshToken()` - Renovar token JWT
- `updateUser(userData)` - Atualizar dados do usuário

#### ThemeContext.js
**Responsabilidades:**
- Gerenciar tema (dark/light)
- Aplicar CSS variables para cores

**Variáveis:**
```javascript
{
  isDark: boolean,           // Tema escuro ativo?
  toggleTheme: () => void    // Alternar tema
}
```

#### WebSocketContext.js
**Responsabilidades:**
- Gerenciar conexão WebSocket
- Receber notificações em tempo real
- Manter lista de notificações

**Variáveis:**
```javascript
{
  notifications: Array,      // Lista de notificações
  unreadCount: number,       // Notificações não lidas
  isConnected: boolean,      // WebSocket conectado?
  addNotification: (notification) => void,
  markAsRead: (notificationId) => void
}
```

### 2.4 Páginas Principais

#### Login.js
- Formulário de login com username/password
- Integração com AuthContext
- Redirecionamento automático ao dashboard

#### Dashboard.js
**Métricas Exibidas:**
- Total de tickets (abertos, em progresso, resolvidos, fechados)
- Tempo médio de resolução
- Tempo médio aberto (tickets ativos)
- Gráfico de tickets por mês
- Performance de técnicos
- Tendências de prioridade

**Dados Obtidos de:**
- `GET /api/v1/dashboard/stats` - Estatísticas gerais
- `GET /api/v1/dashboard/tickets-by-month` - Gráfico mensal
- `GET /api/v1/dashboard/technician-performance` - Performance

#### Tickets.js
**Funcionalidades:**
- Listar tickets com filtros
- Filtrar por status, prioridade, categoria, técnico
- Busca por título/descrição
- Paginação
- Criar novo ticket

**Filtros Disponíveis:**
- Status: open, in_progress, waiting_user, resolved, closed, reopened
- Prioridade: low, medium, high, urgent
- Categoria: seleção dinâmica
- Técnico atribuído
- Empresa

#### TicketDetail.js
**Funcionalidades:**
- Visualizar detalhes completo do ticket
- Adicionar comentários (públicos e internos)
- Upload de anexos
- Alterar status
- Atribuir técnico
- Avaliar satisfação (quando fechado)
- Histórico de atividades

**Componentes Internos:**
- Card de informações (solicitante, técnico, categoria)
- Timeline de comentários
- Seção de anexos
- Modal de atribuição
- Formulário de avaliação

#### CreateTicket.js
**Campos:**
- Título (obrigatório)
- Descrição (obrigatório)
- Categoria (obrigatório)
- Prioridade (padrão: medium)
- Anexos (opcional, até 10MB)

#### Users.js (Admin/Technician)
**Funcionalidades:**
- Listar usuários
- Criar novo usuário
- Editar usuário
- Ativar/desativar usuário
- Atribuir role (user, technician, admin)

**Campos de Usuário:**
- Username, Email, Full Name
- Department, Phone
- Role, Is Active
- Is LDAP User

#### Companies.js (Admin/Technician)
**Funcionalidades:**
- Listar empresas
- Criar/editar empresa
- Visualizar relatório financeiro
- Gerenciar usuários da empresa

**Campos de Empresa:**
- Nome, Razão Social, CNPJ
- Email, Telefone
- Endereço completo
- Contrato (data início/fim, valor)
- Status do contrato

#### Dashboard.js (Admin)
**Seções:**
- Estatísticas gerais
- Gráficos de performance
- Métricas de tempo
- Distribuição de workload

### 2.5 Serviço de API (api.js)

**Base URL:** `https://ticket.algti.com/api/v1`

**Interceptadores:**
- Request: Adiciona token JWT no header Authorization
- Response: Trata erros 401 (token expirado) e tenta renovar

**Serviços Exportados:**
```javascript
authService          // Login, logout, me
ticketsService       // CRUD de tickets
usersService         // CRUD de usuários
categoriesService    // CRUD de categorias
companiesService     // CRUD de empresas
dashboardService     // Estatísticas
settingsService      // Configurações
evaluationsService   // Avaliações de tickets
reportsService       // Relatórios
assetsService        // Gerenciar ativos
knowledgeService     // Base de conhecimento
```

### 2.6 Estilos (index.css)

**Temas:**
- Dark theme padrão (fundo escuro, texto claro)
- Paleta de cores: Cyan/Teal moderna
- CSS Variables para fácil customização

**Variáveis CSS Principais:**
```css
--primary: #0f172a           /* Fundo principal */
--secondary: #1e293b         /* Fundo secundário */
--accent: #06b6d4            /* Cor de destaque (cyan) */
--text-primary: #f1f5f9      /* Texto principal */
--text-secondary: #cbd5e1    /* Texto secundário */
--border-subtle: #334155     /* Bordas */
```

---

## 3. BACKEND (FastAPI - Python)

### 3.1 Estrutura de Diretórios
```
backend/
├── app/
│   ├── main.py                   # Aplicação FastAPI principal
│   ├── api/
│   │   └── api_v1/
│   │       ├── api.py            # Agregador de rotas
│   │       └── endpoints/        # Endpoints por recurso
│   │           ├── auth.py       # Autenticação
│   │           ├── tickets.py    # Gerenciar tickets
│   │           ├── users.py      # Gerenciar usuários
│   │           ├── categories.py # Gerenciar categorias
│   │           ├── companies.py  # Gerenciar empresas
│   │           ├── dashboard.py  # Estatísticas
│   │           ├── evaluations.py# Avaliações
│   │           ├── reports.py    # Relatórios
│   │           ├── assets.py     # Gerenciar ativos
│   │           ├── settings.py   # Configurações
│   │           └── websocket.py  # WebSocket
│   ├── core/
│   │   ├── config.py             # Configurações (settings)
│   │   ├── database.py           # Conexão SQLite
│   │   ├── security.py           # JWT, hash de senha
│   │   ├── deps.py               # Dependências (autenticação)
│   │   └── timezone.py           # Timezone Brasil
│   ├── models/
│   │   └── models.py             # Modelos SQLAlchemy
│   ├── schemas/
│   │   └── schemas.py            # Schemas Pydantic
│   ├── services/
│   │   ├── ldap_service.py       # Autenticação LDAP
│   │   └── email_service.py      # Envio de emails
│   ├── utils/
│   │   └── ...                   # Utilitários
│   └── websocket/
│       ├── manager.py            # Gerenciador de conexões
│       └── notifications.py      # Serviço de notificações
├── alembic/                      # Migrações de banco
├── requirements.txt              # Dependências Python
├── .env                          # Variáveis de ambiente
└── tickets.db                    # Banco de dados SQLite
```

### 3.2 Dependências Python
```
fastapi==0.104.1                  # Framework web
uvicorn[standard]==0.24.0         # Servidor ASGI
sqlalchemy==2.0.23                # ORM
alembic==1.12.1                   # Migrações
pydantic==2.5.0                   # Validação
pydantic-settings==2.1.0          # Configurações
python-jose[cryptography]==3.3.0  # JWT
passlib[bcrypt]==1.7.4            # Hash de senha
python-multipart==0.0.6           # Upload de arquivos
aiofiles==23.2.1                  # Arquivos assíncronos
python-dotenv==1.0.0              # Variáveis de ambiente
email-validator==2.1.0            # Validação de email
jinja2==3.1.2                     # Templates
pytest==7.4.3                     # Testes
httpx==0.25.2                     # HTTP client
```

### 3.3 Configurações (config.py)

**Variáveis de Ambiente:**
```python
# Application
APP_NAME = "Sistema de Tickets TI"
APP_VERSION = "1.0.0"
API_V1_STR = "/api/v1"
DEBUG = False

# Timezone
TIMEZONE = "America/Sao_Paulo"  # UTC-3

# Database
DATABASE_URL = "sqlite:///./tickets.db"

# Security
SECRET_KEY = "your-super-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 horas

# LDAP Configuration
LDAP_SERVER = "ldap://your-ad-server.local:389"
LDAP_BASE_DN = "DC=empresa,DC=local"
LDAP_BIND_DN = "CN=service-account,OU=Users,DC=empresa,DC=local"
LDAP_BIND_PASSWORD = "service-account-password"

# Email Configuration
SMTP_SERVER = None
SMTP_PORT = 587
SMTP_USERNAME = None
SMTP_PASSWORD = None
SMTP_USE_TLS = True
SMTP_FROM_EMAIL = "noreply@algti.com"
EMAIL_ENABLED = True

# File Upload
MAX_FILE_SIZE = 10485760  # 10MB
ALLOWED_EXTENSIONS = "pdf,doc,docx,txt,png,jpg,jpeg,gif"

# Admin Users (fallback)
ADMIN_EMAIL = "admin@empresa.local"
ADMIN_PASSWORD = "admin123"
```

### 3.4 Modelos de Banco de Dados (models.py)

#### Enums
```python
class UserRole(str, enum.Enum):
    user = "user"              # Usuário comum
    technician = "technician"  # Técnico de TI
    admin = "admin"            # Administrador

class TicketStatus(str, enum.Enum):
    OPEN = "open"              # Aberto
    IN_PROGRESS = "in_progress"# Em andamento
    WAITING_USER = "waiting_user"  # Aguardando usuário
    RESOLVED = "resolved"      # Resolvido
    CLOSED = "closed"          # Fechado
    REOPENED = "reopened"      # Reaberto

class TicketPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class ContractStatus(str, enum.Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    PENDING_RENEWAL = "pending_renewal"
```

#### Tabelas Principais

**1. Company (Empresas)**
```python
id: int (PK)
name: str (255)              # Nome fantasia
legal_name: str (255)        # Razão social
cnpj: str (18, unique)       # CNPJ
email: str (255)
phone: str (20)
street: str (255)
number: str (20)
neighborhood: str (100)
complement: str (255)
zip_code: str (10)
has_contract: bool
contract_start_date: DateTime
contract_end_date: DateTime
contract_value: float        # Valor mensal
hourly_rate: float          # Valor hora
contract_status: Enum
commercial_responsible: str
service_type: str
notes: Text
is_active: bool
created_at: DateTime
updated_at: DateTime
```

**2. User (Usuários)**
```python
id: int (PK)
username: str (100, unique)
email: str (255, unique)
full_name: str (255)
department: str (100)
phone: str (20)
role: Enum(UserRole)        # user, technician, admin
is_active: bool
is_ldap_user: bool          # Autenticado via LDAP?
hashed_password: str (255)  # Para usuários não-LDAP
tutorial_viewed: bool
company_id: int (FK)
created_at: DateTime
updated_at: DateTime
```

**3. Ticket (Chamados)**
```python
id: int (PK)
title: str (255)
description: Text
status: Enum(TicketStatus)  # open, in_progress, etc
priority: Enum(TicketPriority)
time_spent_hours: float     # Para billing
created_by_id: int (FK)     # Quem criou
assigned_to_id: int (FK)    # Técnico atribuído
category_id: int (FK)
company_id: int (FK)
created_at: DateTime
updated_at: DateTime
resolved_at: DateTime       # Quando foi resolvido
closed_at: DateTime         # Quando foi fechado
solution: Text              # Descrição da solução
```

**4. TicketComment (Comentários)**
```python
id: int (PK)
content: Text
is_internal: bool           # Visível apenas para técnicos?
ticket_id: int (FK)
user_id: int (FK)
created_at: DateTime
updated_at: DateTime
```

**5. TicketAttachment (Anexos)**
```python
id: int (PK)
filename: str (255)         # Nome no servidor
original_filename: str (255)# Nome original
file_path: str (500)        # Caminho no disco
file_size: int
content_type: str (100)     # MIME type
ticket_id: int (FK)
uploaded_by_id: int (FK)
created_at: DateTime
```

**6. TicketActivity (Log de Atividades)**
```python
id: int (PK)
action: str (100)           # created, updated, assigned, etc
description: Text
old_value: Text
new_value: Text
ticket_id: int (FK)
user_id: int (FK)
created_at: DateTime
```

**7. TicketEvaluation (Avaliações)**
```python
id: int (PK)
rating: int                 # 1-5 stars
feedback: Text              # Comentário opcional
resolution_quality: int     # 1-5
response_time_rating: int   # 1-5
technician_rating: int      # 1-5
ticket_id: int (FK, unique) # Um ticket = uma avaliação
user_id: int (FK)
created_at: DateTime
updated_at: DateTime
```

**8. Category (Categorias)**
```python
id: int (PK)
name: str (100, unique)
description: Text
color: str (7)              # Hex color (#RRGGBB)
is_active: bool
created_at: DateTime
```

**9. Asset (Ativos/Equipamentos)**
```python
id: int (PK)
name: str (255)
asset_tag: str (100, unique)
serial_number: str (255)
status: Enum(AssetStatus)   # active, maintenance, retired
location: str (255)
purchase_date: DateTime
warranty_expiry: DateTime
purchase_cost: float
notes: Text
in_maintenance: bool
category_id: int (FK)
assigned_to_id: int (FK)
company_id: int (FK)
created_at: DateTime
updated_at: DateTime
```

### 3.5 Schemas Pydantic (Validação)

**Principais Schemas:**
```python
# Autenticação
LoginRequest:
  - username: str
  - password: str

Token:
  - access_token: str
  - token_type: str = "bearer"

TokenData:
  - username: str

# Usuário
User:
  - id: int
  - username: str
  - email: str
  - full_name: str
  - department: str
  - phone: str
  - role: str
  - is_active: bool
  - is_ldap_user: bool
  - created_at: datetime
  - updated_at: datetime

# Ticket
TicketCreate:
  - title: str
  - description: str
  - priority: str = "medium"
  - category_id: int
  - company_id: int (opcional)

TicketUpdate:
  - title: str (opcional)
  - description: str (opcional)
  - status: str (opcional)
  - priority: str (opcional)
  - assigned_to_id: int (opcional)
  - solution: str (opcional)

Ticket (response):
  - id: int
  - title: str
  - description: str
  - status: str
  - priority: str
  - created_by: User
  - assigned_to: User (opcional)
  - category: Category
  - company: Company
  - comments: List[TicketComment]
  - attachments: List[TicketAttachment]
  - evaluation: TicketEvaluation (opcional)
  - created_at: datetime
  - updated_at: datetime
  - resolved_at: datetime (opcional)
  - closed_at: datetime (opcional)

# Comentário
CommentCreate:
  - content: str
  - is_internal: bool = False

TicketComment:
  - id: int
  - content: str
  - is_internal: bool
  - user: User
  - created_at: datetime
  - updated_at: datetime

# Avaliação
TicketEvaluationCreate:
  - rating: int (1-5)
  - feedback: str (opcional)
  - resolution_quality: int (1-5, opcional)
  - response_time_rating: int (1-5, opcional)
  - technician_rating: int (1-5, opcional)

# Dashboard
DashboardStats:
  - total_tickets: int
  - open_tickets: int
  - in_progress_tickets: int
  - resolved_tickets: int
  - closed_tickets: int
  - reopened_tickets: int
  - avg_resolution_time: float (horas)
  - avg_time_open: float (horas)
  - total_users: int
  - total_technicians: int
  - total_companies: int
```

### 3.6 Dependências de Autenticação (deps.py)

**Funções Principais:**

```python
def get_current_user(
    credentials: HTTPAuthorizationCredentials,
    db: Session
) -> User:
    """
    Extrai e valida o token JWT do header Authorization.
    Retorna o usuário autenticado.
    Lança HTTPException 401 se token inválido.
    """

def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Wrapper para garantir que usuário está ativo"""

def get_current_technician(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Valida se usuário é técnico ou admin.
    Lança HTTPException 403 se não tem permissão.
    """

def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Valida se usuário é admin.
    Lança HTTPException 403 se não tem permissão.
    """

def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials]
) -> Optional[User]:
    """Retorna usuário se token válido, senão None"""

def get_user_from_token_param(
    request: Request,
    db: Session
) -> User:
    """Extrai usuário do parâmetro ?token=... na URL"""
```

### 3.7 Segurança (security.py)

**Funções:**

```python
def create_access_token(
    subject: Union[str, Any],
    expires_delta: timedelta = None
) -> str:
    """
    Cria token JWT.
    Subject: username do usuário
    Expiração: 24 horas (configurável)
    Algoritmo: HS256
    """

def verify_token(token: str) -> dict:
    """
    Decodifica e valida token JWT.
    Retorna payload com username e exp.
    Lança ValueError se inválido.
    """

def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    """
    Verifica senha contra hash.
    Suporta: bcrypt, SHA256
    """

def get_password_hash(password: str) -> str:
    """
    Gera hash da senha.
    Usa SHA256 para compatibilidade.
    """
```

### 3.8 Endpoints Principais

#### 1. Autenticação (auth.py)

```
POST /api/v1/auth/login
  Body: { username, password }
  Response: { access_token, token_type }
  Descrição: Autentica via LDAP ou local

GET /api/v1/auth/me
  Headers: Authorization: Bearer <token>
  Response: User object
  Descrição: Retorna dados do usuário autenticado

POST /api/v1/auth/refresh
  Headers: Authorization: Bearer <token>
  Response: { access_token, token_type }
  Descrição: Renova token JWT expirado
```

#### 2. Tickets (tickets.py)

```
GET /api/v1/tickets/
  Query: skip, limit, status, priority, category_id, search
  Headers: Authorization: Bearer <token>
  Response: List[Ticket]
  Descrição: Lista tickets com filtros

GET /api/v1/tickets/{id}
  Headers: Authorization: Bearer <token>
  Response: Ticket
  Descrição: Detalhes de um ticket

POST /api/v1/tickets/
  Body: TicketCreate
  Headers: Authorization: Bearer <token>
  Response: Ticket
  Descrição: Criar novo ticket

PUT /api/v1/tickets/{id}
  Body: TicketUpdate
  Headers: Authorization: Bearer <token>
  Response: Ticket
  Descrição: Atualizar ticket (status, atribuição, etc)

DELETE /api/v1/tickets/{id}
  Headers: Authorization: Bearer <token>
  Response: { message }
  Descrição: Deletar ticket

POST /api/v1/tickets/{id}/comments
  Body: CommentCreate
  Headers: Authorization: Bearer <token>
  Response: TicketComment
  Descrição: Adicionar comentário

GET /api/v1/tickets/{id}/comments
  Headers: Authorization: Bearer <token>
  Response: List[TicketComment]
  Descrição: Listar comentários do ticket

POST /api/v1/tickets/{id}/attachments
  Body: FormData (file)
  Headers: Authorization: Bearer <token>
  Response: TicketAttachment
  Descrição: Upload de arquivo

GET /api/v1/tickets/{id}/attachments/{attachment_id}/download
  Headers: Authorization: Bearer <token>
  Response: File
  Descrição: Download de arquivo
```

#### 3. Usuários (users.py)

```
GET /api/v1/users/
  Query: skip, limit, role, search
  Headers: Authorization: Bearer <token>
  Response: List[User]
  Descrição: Listar usuários (admin/tech)

GET /api/v1/users/{id}
  Headers: Authorization: Bearer <token>
  Response: User
  Descrição: Detalhes de um usuário

POST /api/v1/users/
  Body: UserCreate
  Headers: Authorization: Bearer <token>
  Response: User
  Descrição: Criar novo usuário (admin)

PUT /api/v1/users/{id}
  Body: UserUpdate
  Headers: Authorization: Bearer <token>
  Response: User
  Descrição: Atualizar usuário

PUT /api/v1/users/profile
  Body: { full_name, department, phone }
  Headers: Authorization: Bearer <token>
  Response: User
  Descrição: Atualizar próprio perfil

GET /api/v1/users/technicians
  Headers: Authorization: Bearer <token>
  Response: List[User]
  Descrição: Listar apenas técnicos

DELETE /api/v1/users/{id}
  Headers: Authorization: Bearer <token>
  Response: { message }
  Descrição: Desativar usuário
```

#### 4. Dashboard (dashboard.py)

```
GET /api/v1/dashboard/stats
  Query: days (opcional)
  Headers: Authorization: Bearer <token>
  Response: DashboardStats
  Descrição: Estatísticas gerais

GET /api/v1/dashboard/tickets-by-month
  Query: months
  Headers: Authorization: Bearer <token>
  Response: List[{ month, count }]
  Descrição: Tickets por mês

GET /api/v1/dashboard/technician-performance
  Query: days
  Headers: Authorization: Bearer <token>
  Response: List[{ technician, resolved, avg_time }]
  Descrição: Performance de técnicos

GET /api/v1/dashboard/priority-trends
  Query: days
  Headers: Authorization: Bearer <token>
  Response: List[{ priority, count }]
  Descrição: Distribuição de prioridades
```

#### 5. Avaliações (evaluations.py)

```
POST /api/v1/evaluations/tickets/{ticket_id}/evaluation
  Body: TicketEvaluationCreate
  Headers: Authorization: Bearer <token>
  Response: TicketEvaluation
  Descrição: Criar avaliação de ticket

GET /api/v1/evaluations/tickets/{ticket_id}/evaluation
  Headers: Authorization: Bearer <token>
  Response: TicketEvaluation
  Descrição: Obter avaliação de um ticket

GET /api/v1/evaluations/evaluations
  Query: skip, limit, technician_id, rating_min
  Headers: Authorization: Bearer <token>
  Response: List[TicketEvaluation]
  Descrição: Listar avaliações

GET /api/v1/evaluations/metrics/satisfaction
  Query: days, technician_id
  Headers: Authorization: Bearer <token>
  Response: { avg_rating, total_evaluations, ... }
  Descrição: Métricas de satisfação
```

#### 6. Relatórios (reports.py)

```
GET /api/v1/reports/performance/technicians
  Query: days, technician_id, start_date, end_date
  Headers: Authorization: Bearer <token>
  Response: List[TechnicianReport]
  Descrição: Performance de técnicos

GET /api/v1/reports/general
  Query: start_date, end_date
  Headers: Authorization: Bearer <token>
  Response: GeneralReport
  Descrição: Relatório geral

GET /api/v1/reports/by-company
  Query: start_date, end_date, company_id
  Headers: Authorization: Bearer <token>
  Response: CompanyReport
  Descrição: Relatório por empresa

GET /api/v1/reports/advanced/satisfaction-analysis
  Query: start_date, end_date
  Headers: Authorization: Bearer <token>
  Response: SatisfactionAnalysis
  Descrição: Análise de satisfação

GET /api/v1/reports/advanced/financial-consolidated
  Query: start_date, end_date
  Headers: Authorization: Bearer <token>
  Response: FinancialReport
  Descrição: Relatório financeiro consolidado
```

#### 7. WebSocket (websocket.py)

```
WebSocket /api/v1/notifications/ws?token=<jwt_token>
  Descrição: Conexão WebSocket para notificações em tempo real
  
Mensagens Recebidas:
  - ticket_created: Novo ticket criado
  - ticket_assigned: Ticket atribuído
  - ticket_status_changed: Status alterado
  - comment_added: Novo comentário
  - ticket_closed: Ticket fechado
  - ticket_reopened: Ticket reaberto
```

### 3.9 Serviços Internos

#### LDAP Service (ldap_service.py)
```python
def authenticate_user(username: str, password: str) -> dict:
    """
    Autentica usuário contra Active Directory.
    Retorna: {
        username, email, full_name, department, 
        phone, groups
    }
    Retorna None se falhar.
    """
```

#### Email Service (email_service.py)
```python
def send_email(
    to: str,
    subject: str,
    body: str,
    html: str = None
) -> bool:
    """
    Envia email via SMTP.
    Suporta templates Jinja2.
    """
```

#### WebSocket Manager (manager.py)
```python
class ConnectionManager:
    async def connect(user_id: int, websocket: WebSocket):
        """Registra nova conexão WebSocket"""
    
    async def disconnect(user_id: int):
        """Remove conexão WebSocket"""
    
    async def send_to_user(message: dict, user_id: int):
        """Envia mensagem para usuário específico"""
    
    async def send_to_role(message: dict, role: str):
        """Envia mensagem para todos de um role"""
    
    async def broadcast(message: dict):
        """Envia para todos conectados"""
```

#### Notification Service (notifications.py)
```python
class NotificationService:
    async def notify_ticket_created(ticket, created_by):
        """Notifica técnicos sobre novo ticket"""
    
    async def notify_ticket_assigned(ticket, assigned_to, assigned_by):
        """Notifica técnico sobre atribuição"""
    
    async def notify_ticket_status_changed(ticket, old_status, changed_by):
        """Notifica sobre mudança de status"""
    
    async def notify_comment_added(ticket, comment, user):
        """Notifica sobre novo comentário"""
```

---

## 4. BANCO DE DADOS (SQLite)

### 4.1 Configuração
- **Arquivo:** `/backend/tickets.db`
- **Tipo:** SQLite3
- **Migrações:** Alembic
- **Timezone:** America/Sao_Paulo (UTC-3)

### 4.2 Relacionamentos Principais
```
Company (1) ──→ (N) User
Company (1) ──→ (N) Ticket
Company (1) ──→ (N) Asset

User (1) ──→ (N) Ticket (created_by)
User (1) ──→ (N) Ticket (assigned_to)
User (1) ──→ (N) TicketComment
User (1) ──→ (N) TicketActivity
User (1) ──→ (N) TicketEvaluation
User (1) ──→ (N) TicketAttachment

Category (1) ──→ (N) Ticket

Ticket (1) ──→ (N) TicketComment
Ticket (1) ──→ (N) TicketAttachment
Ticket (1) ──→ (N) TicketActivity
Ticket (1) ──→ (1) TicketEvaluation

AssetCategory (1) ──→ (N) Asset
```

### 4.3 Índices
```sql
-- Users
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company_id ON users(company_id);

-- Tickets
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_created_by_id ON tickets(created_by_id);
CREATE INDEX idx_tickets_assigned_to_id ON tickets(assigned_to_id);
CREATE INDEX idx_tickets_category_id ON tickets(category_id);
CREATE INDEX idx_tickets_company_id ON tickets(company_id);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);

-- Comments
CREATE INDEX idx_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX idx_comments_user_id ON ticket_comments(user_id);

-- Attachments
CREATE INDEX idx_attachments_ticket_id ON ticket_attachments(ticket_id);

-- Activities
CREATE INDEX idx_activities_ticket_id ON ticket_activities(ticket_id);

-- Evaluations
CREATE INDEX idx_evaluations_ticket_id ON ticket_evaluations(ticket_id);
```

---

## 5. CAMADAS DE SEGURANÇA

### 5.1 Autenticação

#### JWT (JSON Web Tokens)
- **Algoritmo:** HS256
- **Expiração:** 24 horas
- **Secret Key:** Configurável via .env
- **Payload:** `{ "sub": username, "exp": timestamp }`

#### LDAP (Active Directory)
- **Servidor:** Configurável via .env
- **Base DN:** Configurável
- **Bind DN:** Service account
- **Grupos Suportados:**
  - `ti-admin` ou `helpdesk-admin` → Role: admin
  - `ti-tech` ou `helpdesk-tech` → Role: technician
  - Sem grupo → Role: user

#### Fallback Local
- **Usuário:** admin@empresa.local
- **Senha:** admin123 (hash bcrypt)
- **Uso:** Quando LDAP não disponível

### 5.2 Autorização (RBAC)

#### Roles
```
USER (Usuário Comum):
  ✓ Criar tickets
  ✓ Ver próprios tickets
  ✓ Adicionar comentários públicos
  ✓ Upload de anexos
  ✓ Avaliar tickets fechados
  ✗ Ver tickets de outros
  ✗ Alterar status
  ✗ Atribuir técnico

TECHNICIAN (Técnico):
  ✓ Ver todos os tickets
  ✓ Alterar status
  ✓ Atribuir a si mesmo
  ✓ Adicionar comentários (públicos e internos)
  ✓ Upload de solução
  ✓ Ver relatórios básicos
  ✓ Gerenciar base de conhecimento
  ✗ Criar usuários
  ✗ Gerenciar empresas
  ✗ Acessar configurações

ADMIN (Administrador):
  ✓ Tudo que technician pode fazer
  ✓ Criar/editar usuários
  ✓ Gerenciar empresas
  ✓ Gerenciar categorias
  ✓ Acessar configurações
  ✓ Ver relatórios avançados
  ✓ Gerenciar ativos
  ✓ Exportar dados
```

### 5.3 Proteção de Rotas

#### Dependências FastAPI
```python
# Rota pública
@router.get("/test")
async def test_endpoint():
    pass

# Requer autenticação
@router.get("/tickets/")
async def get_tickets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pass

# Requer role technician ou admin
@router.put("/tickets/{id}")
async def update_ticket(
    id: int,
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    pass

# Requer role admin
@router.post("/categories/")
async def create_category(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    pass
```

### 5.4 Validação de Dados

#### Pydantic Schemas
- Validação automática de tipos
- Validação de ranges (ex: rating 1-5)
- Validação de emails
- Validação de URLs
- Validação customizada

#### Exemplo:
```python
class TicketEvaluationCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)  # 1-5
    feedback: Optional[str] = Field(None, max_length=500)
    resolution_quality: Optional[int] = Field(None, ge=1, le=5)
    
    @field_validator('rating')
    def validate_rating(cls, v):
        if v < 1 or v > 5:
            raise ValueError('Rating must be between 1 and 5')
        return v
```

### 5.5 Proteção de Dados Sensíveis

#### Senhas
- Hash com bcrypt (ou SHA256 como fallback)
- Nunca armazenadas em plain text
- Verificação segura com timing-safe comparison

#### Tokens
- Armazenados apenas no localStorage do cliente
- Enviados apenas via header Authorization
- Expiração automática após 24 horas
- Renovação automática via refresh endpoint

#### Dados de Usuário
- Comentários internos visíveis apenas para técnicos
- Usuários veem apenas seus próprios tickets
- Técnicos veem todos os tickets
- Admins veem tudo

### 5.6 CORS (Cross-Origin Resource Sharing)

**Origens Permitidas:**
```python
allow_origins=[
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://ticket.algti.com.br",
    "https://ticket.algti.com",
    "http://ticket.algti.com.br",
    "http://ticket.algti.com"
]

allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]

allow_headers=[
    "Accept",
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Origin"
]
```

### 5.7 Rate Limiting
- Não implementado (pode ser adicionado com `slowapi`)
- Recomendado para produção

### 5.8 Validação de Upload

**Restrições:**
- Tamanho máximo: 10MB
- Extensões permitidas: pdf, doc, docx, txt, png, jpg, jpeg, gif
- Validação de MIME type
- Armazenamento em pasta isolada `/uploads`

---

## 6. DEPLOY E INFRAESTRUTURA

### 6.1 Ambiente de Produção

**Servidor:** Hostinger VPS
- **Host:** srv1049200.hstgr.cloud
- **OS:** Linux
- **Diretório:** `/var/www/sistema-tickets-ti`
- **Branch:** ALG_TICKETS

### 6.2 Nginx (Proxy Reverso)

**Configuração:**
```nginx
# Redirecionamento HTTP → HTTPS
server {
    listen 80;
    server_name ticket.algti.com.br ticket.algti.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name ticket.algti.com.br ticket.algti.com;
    
    ssl_certificate /etc/letsencrypt/live/ticket.algti.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ticket.algti.com.br/privkey.pem;
    
    # Frontend estático
    root /var/www/sistema-tickets-ti/frontend/build;
    index index.html;
    
    # Proxy para API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket
    location /ws {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # SPA fallback
    location / {
        try_files $uri /index.html;
    }
}
```

### 6.3 Backend (Systemd Service)

**Arquivo:** `/etc/systemd/system/tickets-backend.service`

```ini
[Unit]
Description=Sistema de Tickets Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/sistema-tickets-ti/backend
ExecStart=/usr/bin/python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Comandos:**
```bash
sudo systemctl start tickets-backend
sudo systemctl stop tickets-backend
sudo systemctl restart tickets-backend
sudo systemctl status tickets-backend
sudo journalctl -u tickets-backend -n 50 -f
```

### 6.4 Frontend (Build Estático)

```bash
cd /var/www/sistema-tickets-ti/frontend
npm install
npm run build
# Resultado: /var/www/sistema-tickets-ti/frontend/build/
```

### 6.5 SSL/HTTPS

- **Certificado:** Let's Encrypt
- **Renovação:** Automática via certbot
- **Domínios:** ticket.algti.com.br, ticket.algti.com

### 6.6 Backup

**Banco de Dados:**
```bash
# Backup manual
cp /var/www/sistema-tickets-ti/backend/tickets.db /backup/tickets_$(date +%Y%m%d).db

# Restaurar
cp /backup/tickets_YYYYMMDD.db /var/www/sistema-tickets-ti/backend/tickets.db
sudo systemctl restart tickets-backend
```

**Uploads:**
```bash
# Backup de arquivos
tar -czf /backup/uploads_$(date +%Y%m%d).tar.gz /var/www/sistema-tickets-ti/backend/uploads/
```

---

## 7. FLUXOS PRINCIPAIS

### 7.1 Fluxo de Autenticação

```
1. Usuário acessa /login
2. Insere username e password
3. Frontend POST /api/v1/auth/login
4. Backend tenta LDAP authenticate
   ├─ Sucesso: Cria/atualiza usuário no DB
   └─ Falha: Tenta autenticação local
5. Gera JWT token
6. Frontend armazena token no localStorage
7. Adiciona Authorization header em requisições futuras
8. Token expira em 24h → frontend tenta refresh
9. Se refresh falha → redireciona para login
```

### 7.2 Fluxo de Criação de Ticket

```
1. Usuário clica "Novo Ticket"
2. Preenche: título, descrição, categoria, prioridade
3. Faz upload de anexos (opcional)
4. Frontend POST /api/v1/tickets/
5. Backend valida dados com Pydantic
6. Cria registro Ticket no DB
7. Cria TicketActivity (created)
8. Envia notificação WebSocket para técnicos
9. Envia email para técnicos (se configurado)
10. Frontend redireciona para TicketDetail
```

### 7.3 Fluxo de Atribuição e Resolução

```
1. Técnico visualiza ticket
2. Clica "Atribuir a mim"
3. Frontend PUT /api/v1/tickets/{id}
   Body: { assigned_to_id: tech_id, status: "in_progress" }
4. Backend atualiza ticket
5. Cria TicketActivity (assigned)
6. Envia notificação WebSocket para técnico
7. Técnico adiciona comentários e solução
8. Marca como "resolved"
9. Usuário recebe notificação
10. Usuário confirma resolução → status "closed"
11. Avaliação fica disponível
12. Usuário avalia (1-5 stars)
13. Ticket finalizado
```

### 7.4 Fluxo de Notificações WebSocket

```
1. Usuário faz login
2. Frontend abre conexão WebSocket
   GET /api/v1/notifications/ws?token=<jwt>
3. Backend registra conexão no ConnectionManager
4. Quando evento ocorre (novo ticket, status mudou, etc):
   - Backend cria mensagem JSON
   - Envia para usuários relevantes via WebSocket
5. Frontend recebe mensagem
   - Atualiza estado
   - Mostra toast notification
   - Atualiza lista de notificações
6. Usuário clica notificação → navega para ticket
7. Ao desconectar → WebSocket fecha
```

---

## 8. VARIÁVEIS E FUNÇÕES CRÍTICAS

### 8.1 Variáveis de Ambiente (.env)

```bash
# Application
APP_NAME="Sistema de Tickets TI"
APP_VERSION="1.0.0"
DEBUG=False

# Database
DATABASE_URL="sqlite:///./tickets.db"

# Security
SECRET_KEY="change-this-in-production"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# LDAP
LDAP_SERVER="ldap://your-ad-server.local:389"
LDAP_BASE_DN="DC=empresa,DC=local"
LDAP_BIND_DN="CN=service-account,OU=Users,DC=empresa,DC=local"
LDAP_BIND_PASSWORD="password"

# Email
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT=587
SMTP_USERNAME="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM_EMAIL="noreply@algti.com"
EMAIL_ENABLED=True

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_EXTENSIONS="pdf,doc,docx,txt,png,jpg,jpeg,gif"

# Timezone
TIMEZONE="America/Sao_Paulo"
```

### 8.2 Funções Críticas do Backend

```python
# auth.py
async def login(login_data: LoginRequest, db: Session)
    → Token

async def get_current_user_info(current_user: User)
    → User

# tickets.py
async def get_tickets(filters..., current_user: User, db: Session)
    → List[Ticket]

async def create_ticket(ticket_data: TicketCreate, current_user: User, db: Session)
    → Ticket

async def update_ticket(id: int, update_data: TicketUpdate, current_user: User, db: Session)
    → Ticket

async def add_comment(id: int, comment: CommentCreate, current_user: User, db: Session)
    → TicketComment

async def upload_attachment(id: int, file: UploadFile, current_user: User, db: Session)
    → TicketAttachment

# dashboard.py
async def get_stats(current_user: User, db: Session)
    → DashboardStats

async def get_tickets_by_month(months: int, current_user: User, db: Session)
    → List[TicketsByMonth]

# evaluations.py
async def create_evaluation(ticket_id: int, eval_data: TicketEvaluationCreate, current_user: User, db: Session)
    → TicketEvaluation

# reports.py
async def get_technician_performance(days: int, current_user: User, db: Session)
    → List[TechnicianReport]

async def get_financial_consolidated(start_date, end_date, current_user: User, db: Session)
    → FinancialReport
```

### 8.3 Funções Críticas do Frontend

```javascript
// AuthContext
useAuth() → { user, token, login, logout, isAdmin, isTechnician }

// api.js
authAPI.get(url, config)     // GET com token
authAPI.post(url, data)      // POST com token
authAPI.put(url, data)       // PUT com token
authAPI.delete(url)          // DELETE com token

// Services
ticketsService.getTickets(params)
ticketsService.getTicket(id)
ticketsService.createTicket(data)
ticketsService.updateTicket(id, data)
ticketsService.addComment(id, data)
ticketsService.uploadAttachment(id, formData)

usersService.getUsers(params)
usersService.createUser(data)
usersService.updateUser(id, data)
usersService.updateProfile(data)

dashboardService.getStats(params)
dashboardService.getTicketsByMonth(params)

evaluationsService.createEvaluation(ticketId, data)
evaluationsService.getEvaluations(params)

reportsService.getTechnicianPerformance(days, technicianId)
reportsService.getFinancialConsolidated(startDate, endDate)
```

---

## 9. FLUXOS DE DADOS

### 9.1 Fluxo de Requisição HTTP

```
1. Frontend faz requisição
   GET /api/v1/tickets/?status=open
   Headers: Authorization: Bearer <token>

2. Nginx recebe em :443 (HTTPS)
   Valida certificado SSL
   Proxy para http://127.0.0.1:8000/api/v1/tickets/?status=open

3. FastAPI recebe
   - Middleware CORS valida origem
   - Extrai token do header Authorization
   - Dependência get_current_user valida JWT
   - Dependência get_db abre sessão SQLite
   - Handler executa lógica
   - Query ao banco de dados

4. SQLite retorna dados

5. FastAPI serializa com Pydantic schema
   Retorna JSON

6. Nginx envia resposta HTTPS para cliente

7. Frontend recebe JSON
   Atualiza estado React
   Re-renderiza componentes
```

### 9.2 Fluxo de WebSocket

```
1. Frontend conecta
   WebSocket wss://ticket.algti.com/api/v1/notifications/ws?token=<jwt>

2. Nginx upgrade para WebSocket
   Proxy para http://127.0.0.1:8000/api/v1/notifications/ws?token=<jwt>

3. FastAPI websocket endpoint
   Valida token JWT
   Registra conexão em ConnectionManager
   Aguarda mensagens

4. Quando evento ocorre (ex: novo ticket)
   Backend chama notification_service.notify_ticket_created()
   Cria mensagem JSON
   Envia para WebSocket connections relevantes

5. Frontend recebe mensagem
   Atualiza estado
   Mostra notificação toast
   Atualiza lista de notificações

6. Usuário clica notificação
   Navega para ticket
   Carrega detalhes via GET /api/v1/tickets/{id}
```

---

## 10. CHECKLIST DE SEGURANÇA

- [x] Autenticação JWT com expiração
- [x] LDAP/Active Directory integrado
- [x] Validação de dados com Pydantic
- [x] CORS configurado
- [x] Proteção de rotas por role
- [x] Hash de senhas (bcrypt/SHA256)
- [x] HTTPS/SSL ativo
- [x] Comentários internos protegidos
- [x] Validação de upload de arquivos
- [ ] Rate limiting (recomendado adicionar)
- [ ] Logging de auditoria (parcialmente implementado)
- [ ] Backup automático (manual atualmente)
- [ ] Monitoramento de performance (recomendado)
- [ ] Testes de segurança (recomendado)

---

## 11. PRÓXIMOS PASSOS RECOMENDADOS

1. **Segurança:**
   - Implementar rate limiting com `slowapi`
   - Adicionar logging de auditoria completo
   - Implementar 2FA (Two-Factor Authentication)
   - Adicionar CSRF protection

2. **Performance:**
   - Implementar cache com Redis
   - Adicionar paginação otimizada
   - Implementar índices de banco de dados
   - Usar CDN para arquivos estáticos

3. **Funcionalidades:**
   - Integração com Microsoft Teams
   - IA para triagem automática de tickets
   - Mobile app (React Native)
   - Integração com sistemas externos

4. **Operacional:**
   - Backup automático
   - Monitoramento com Prometheus/Grafana
   - CI/CD pipeline
   - Testes automatizados
   - Documentação API (Swagger já disponível em /docs)

---

## 12. CONTATOS E SUPORTE

- **Repositório:** https://github.com/algti/sistema-tickets-ti
- **Branch:** ALG_TICKETS
- **VPS:** srv1049200.hstgr.cloud
- **Domínios:** ticket.algti.com.br, ticket.algti.com
- **API Docs:** https://ticket.algti.com/api/docs

---

**Documento gerado em:** 2024
**Versão do Sistema:** 1.0.0
**Status:** Produção (Ativo)
