# 🔧 VARIÁVEIS E FUNÇÕES CRÍTICAS

## ÍNDICE
1. [Variáveis de Ambiente](#variáveis-de-ambiente)
2. [Variáveis de Estado (Frontend)](#variáveis-de-estado-frontend)
3. [Variáveis de Banco de Dados](#variáveis-de-banco-de-dados)
4. [Funções Críticas Backend](#funções-críticas-backend)
5. [Funções Críticas Frontend](#funções-críticas-frontend)
6. [Constantes e Enums](#constantes-e-enums)

---

## VARIÁVEIS DE AMBIENTE

### Arquivo: `.env` (Backend)

```bash
# ========== APPLICATION ==========
APP_NAME="Sistema de Tickets TI"
APP_VERSION="1.0.0"
DEBUG=False
TIMEZONE="America/Sao_Paulo"

# ========== DATABASE ==========
DATABASE_URL="sqlite:///./tickets.db"
# Alternativa PostgreSQL:
# DATABASE_URL="postgresql://user:password@localhost:5432/tickets_db"

# ========== SECURITY ==========
SECRET_KEY="change-this-in-production-use-strong-random-key"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440  # 24 horas

# ========== LDAP / ACTIVE DIRECTORY ==========
LDAP_SERVER="ldap://seu-servidor-ad.local:389"
LDAP_BASE_DN="DC=empresa,DC=local"
LDAP_BIND_DN="CN=service-account,OU=Users,DC=empresa,DC=local"
LDAP_BIND_PASSWORD="senha-do-service-account"
LDAP_USER_SEARCH_BASE="OU=Users,DC=empresa,DC=local"
LDAP_GROUP_SEARCH_BASE="OU=Groups,DC=empresa,DC=local"

# ========== EMAIL CONFIGURATION ==========
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT=587
SMTP_USERNAME="seu-email@gmail.com"
SMTP_PASSWORD="sua-senha-app"
SMTP_USE_TLS=True
SMTP_FROM_EMAIL="noreply@algti.com"
SMTP_FROM_NAME="Sistema de Tickets ALG TI"
ADMIN_NOTIFICATION_EMAIL="admin@algti.com"
EMAIL_ENABLED=True

# ========== FILE UPLOAD ==========
MAX_FILE_SIZE=10485760  # 10MB em bytes
ALLOWED_EXTENSIONS="pdf,doc,docx,txt,png,jpg,jpeg,gif"

# ========== ADMIN USERS (FALLBACK) ==========
ADMIN_EMAIL="admin@empresa.local"
ADMIN_PASSWORD="admin123"  # MUDAR EM PRODUÇÃO!
```

### Variáveis de Ambiente em Produção

```bash
# VPS Hostinger
export PYTHONUNBUFFERED=1
export PYTHONPATH=/var/www/sistema-tickets-ti/backend

# Nginx
export NGINX_WORKER_PROCESSES=4
export NGINX_WORKER_CONNECTIONS=1024

# Sistema
export LANG=pt_BR.UTF-8
export LC_ALL=pt_BR.UTF-8
```

---

## VARIÁVEIS DE ESTADO (FRONTEND)

### AuthContext.js

```javascript
// Estado global de autenticação
const authState = {
  // Usuário autenticado
  user: {
    id: number,                          // ID do usuário
    username: string,                    // Username único
    email: string,                       // Email único
    full_name: string,                   // Nome completo
    department: string,                  // Departamento
    phone: string,                       // Telefone
    role: 'user' | 'technician' | 'admin', // Papel do usuário
    is_active: boolean,                  // Usuário ativo?
    is_ldap_user: boolean,               // Autenticado via LDAP?
    tutorial_viewed: boolean,            // Viu tutorial?
    company_id: number,                  // ID da empresa
    created_at: string,                  // ISO datetime
    updated_at: string                   // ISO datetime
  },
  
  // Token JWT
  token: string,                         // JWT token armazenado
  
  // Estados
  loading: boolean,                      // Carregando dados?
  isAuthenticated: boolean,              // Usuário logado?
  
  // Helpers de role
  isAdmin: boolean,                      // user.role === 'admin'
  isTechnician: boolean,                 // user.role === 'technician' || 'admin'
  isUser: boolean                        // user.role === 'user'
};

// Funções do contexto
const authFunctions = {
  login: async (username, password) => {
    // POST /api/v1/auth/login
    // Retorna: { success: true/false, error?: string }
  },
  
  logout: () => {
    // Remove token do localStorage
    // Limpa AuthContext
    // Redireciona para /login
  },
  
  refreshToken: async () => {
    // POST /api/v1/auth/refresh
    // Renova JWT token
    // Retorna: true/false
  },
  
  updateUser: (userData) => {
    // Atualiza dados do usuário no contexto
    // Não faz requisição ao backend
  }
};
```

### ThemeContext.js

```javascript
const themeState = {
  isDark: boolean,                       // Tema escuro ativo?
  theme: {
    primary: '#0f172a',                  // Fundo principal
    secondary: '#1e293b',                // Fundo secundário
    accent: '#06b6d4',                   // Cor de destaque (cyan)
    text_primary: '#f1f5f9',             // Texto principal
    text_secondary: '#cbd5e1',           // Texto secundário
    border_subtle: '#334155'             // Bordas
  }
};

const themeFunctions = {
  toggleTheme: () => {
    // Alterna entre dark/light
    // Salva preferência em localStorage
    // Aplica CSS variables
  }
};
```

### WebSocketContext.js

```javascript
const wsState = {
  // Notificações
  notifications: Array<{
    id: string,                          // ID único
    type: string,                        // ticket_created, assigned, etc
    ticket_id: number,                   // ID do ticket relacionado
    title: string,                       // Título da notificação
    message: string,                     // Mensagem
    read: boolean,                       // Lida?
    timestamp: string,                   // ISO datetime
    data: object                         // Dados adicionais
  }>,
  
  unreadCount: number,                   // Notificações não lidas
  isConnected: boolean,                  // WebSocket conectado?
  connectionError: string | null         // Erro de conexão
};

const wsFunctions = {
  addNotification: (notification) => {
    // Adiciona notificação à lista
    // Incrementa unreadCount
    // Mostra toast
  },
  
  markAsRead: (notificationId) => {
    // Marca notificação como lida
    // Decrementa unreadCount
  },
  
  clearNotifications: () => {
    // Limpa todas as notificações
  }
};
```

### Component State Examples

```javascript
// Dashboard.js
const [stats, setStats] = useState({
  total_tickets: 0,
  open_tickets: 0,
  in_progress_tickets: 0,
  resolved_tickets: 0,
  closed_tickets: 0,
  reopened_tickets: 0,
  avg_resolution_time: 0,      // em horas
  avg_time_open: 0,             // em horas
  total_users: 0,
  total_technicians: 0,
  total_companies: 0
});

const [ticketsByMonth, setTicketsByMonth] = useState([
  { month: 'Janeiro', open: 5, in_progress: 3, resolved: 10, closed: 8 },
  // ...
]);

const [technicianPerformance, setTechnicianPerformance] = useState([
  {
    technician_id: 1,
    technician_name: 'João Silva',
    resolved_count: 25,
    avg_resolution_time: 4.5,    // horas
    avg_rating: 4.8,             // 1-5 stars
    total_evaluations: 20
  },
  // ...
]);

// Tickets.js
const [tickets, setTickets] = useState([]);
const [filters, setFilters] = useState({
  status: null,
  priority: null,
  category_id: null,
  assigned_to_id: null,
  search: '',
  skip: 0,
  limit: 50
});
const [totalCount, setTotalCount] = useState(0);
const [loading, setLoading] = useState(false);

// TicketDetail.js
const [ticket, setTicket] = useState({
  id: 0,
  title: '',
  description: '',
  status: 'open',
  priority: 'medium',
  created_by: {},
  assigned_to: null,
  category: {},
  company: {},
  comments: [],
  attachments: [],
  evaluation: null,
  created_at: '',
  updated_at: '',
  resolved_at: null,
  closed_at: null
});

const [comments, setComments] = useState([]);
const [newComment, setNewComment] = useState('');
const [isInternalComment, setIsInternalComment] = useState(false);
const [submittingComment, setSubmittingComment] = useState(false);
```

---

## VARIÁVEIS DE BANCO DE DADOS

### Tabela: users

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  phone VARCHAR(20),
  role ENUM('user', 'technician', 'admin') DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  is_ldap_user BOOLEAN DEFAULT TRUE,
  hashed_password VARCHAR(255),
  tutorial_viewed BOOLEAN DEFAULT FALSE,
  company_id INTEGER FOREIGN KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela: tickets

```sql
CREATE TABLE tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status ENUM('open', 'in_progress', 'waiting_user', 'resolved', 'closed', 'reopened') DEFAULT 'open',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  time_spent_hours FLOAT DEFAULT 0.0,
  created_by_id INTEGER NOT NULL FOREIGN KEY,
  assigned_to_id INTEGER FOREIGN KEY,
  category_id INTEGER FOREIGN KEY,
  company_id INTEGER FOREIGN KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  closed_at DATETIME,
  solution TEXT
);
```

### Tabela: ticket_comments

```sql
CREATE TABLE ticket_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,  -- Visível apenas para técnicos
  ticket_id INTEGER NOT NULL FOREIGN KEY,
  user_id INTEGER NOT NULL FOREIGN KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela: ticket_evaluations

```sql
CREATE TABLE ticket_evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rating INTEGER NOT NULL,            -- 1-5 stars
  feedback TEXT,
  resolution_quality INTEGER,         -- 1-5
  response_time_rating INTEGER,       -- 1-5
  technician_rating INTEGER,          -- 1-5
  ticket_id INTEGER NOT NULL UNIQUE FOREIGN KEY,
  user_id INTEGER NOT NULL FOREIGN KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## FUNÇÕES CRÍTICAS BACKEND

### Authentication (app/core/security.py)

```python
def create_access_token(
    subject: Union[str, Any],
    expires_delta: timedelta = None
) -> str:
    """
    Cria JWT token para autenticação.
    
    Args:
        subject: Username do usuário
        expires_delta: Tempo de expiração (padrão: 24h)
    
    Returns:
        Token JWT codificado
    
    Exemplo:
        token = create_access_token("joao.silva")
        # Retorna: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

def verify_token(token: str) -> dict:
    """
    Verifica e decodifica JWT token.
    
    Args:
        token: Token JWT a validar
    
    Returns:
        Payload do token { "sub": username, "exp": timestamp }
    
    Raises:
        ValueError: Se token inválido ou expirado
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        raise ValueError("Invalid token")

def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    """
    Verifica senha contra hash.
    
    Args:
        plain_password: Senha em texto plano
        hashed_password: Hash armazenado no banco
    
    Returns:
        True se senha válida, False caso contrário
    """
    try:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return pwd_context.verify(plain_password, hashed_password)
    except:
        return False

def get_password_hash(password: str) -> str:
    """
    Gera hash de uma senha.
    
    Args:
        password: Senha em texto plano
    
    Returns:
        Hash bcrypt da senha
    """
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    return pwd_context.hash(password)
```

### Dependencies (app/core/deps.py)

```python
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Extrai e valida usuário do token JWT.
    
    Args:
        credentials: Token do header Authorization
        db: Sessão do banco de dados
    
    Returns:
        Objeto User autenticado
    
    Raises:
        HTTPException: 401 se token inválido
        HTTPException: 403 se usuário inativo
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user")
    
    return user

def get_current_technician(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Valida se usuário é técnico ou admin.
    
    Raises:
        HTTPException: 403 se não tem permissão
    """
    user_role = current_user.role
    if isinstance(user_role, str):
        user_role = user_role.lower()
    else:
        user_role = user_role.value.lower()
    
    if user_role not in ['technician', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Technician role required."
        )
    return current_user

def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Valida se usuário é admin.
    
    Raises:
        HTTPException: 403 se não é admin
    """
    user_role = current_user.role
    if isinstance(user_role, str):
        user_role = user_role.lower()
    else:
        user_role = user_role.value.lower()
    
    if user_role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin role required."
        )
    return current_user
```

### Tickets Endpoints (app/api/api_v1/endpoints/tickets.py)

```python
@router.get("/", response_model=List[dict])
async def get_tickets(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    category_id: Optional[str] = Query(None),
    assigned_to_id: Optional[str] = Query(None),
    created_by_id: Optional[str] = Query(None),
    company_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lista tickets com filtros e paginação.
    
    Query Parameters:
        skip: Número de registros a pular (padrão: 0)
        limit: Número de registros a retornar (padrão: 50, máx: 100)
        status: Filtrar por status (open, in_progress, etc)
        priority: Filtrar por prioridade (low, medium, high, urgent)
        category_id: Filtrar por categoria
        assigned_to_id: Filtrar por técnico atribuído
        created_by_id: Filtrar por criador
        company_id: Filtrar por empresa
        search: Buscar em título/descrição
    
    Returns:
        List[Ticket]: Lista de tickets
    
    Exemplo:
        GET /api/v1/tickets/?status=open&priority=high&limit=20
    """
    # Implementação...
    pass

@router.post("/", response_model=dict)
async def create_ticket(
    ticket_data: TicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cria novo ticket.
    
    Body:
        title: str (obrigatório)
        description: str (obrigatório)
        category_id: int (obrigatório)
        priority: str (padrão: "medium")
        company_id: int (opcional)
    
    Returns:
        Ticket: Ticket criado
    
    Exemplo:
        POST /api/v1/tickets/
        {
            "title": "Internet não funciona",
            "description": "Conexão caiu ontem",
            "category_id": 5,
            "priority": "high"
        }
    """
    # Implementação...
    pass

@router.put("/{ticket_id}", response_model=dict)
async def update_ticket(
    ticket_id: int,
    update_data: TicketUpdate,
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """
    Atualiza ticket (status, atribuição, solução, etc).
    
    Path Parameters:
        ticket_id: ID do ticket
    
    Body:
        title: str (opcional)
        description: str (opcional)
        status: str (opcional)
        priority: str (opcional)
        assigned_to_id: int (opcional)
        solution: str (opcional)
    
    Returns:
        Ticket: Ticket atualizado
    
    Exemplo:
        PUT /api/v1/tickets/123
        {
            "status": "in_progress",
            "assigned_to_id": 5
        }
    """
    # Implementação...
    pass

@router.post("/{ticket_id}/comments", response_model=dict)
async def add_comment(
    ticket_id: int,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Adiciona comentário a um ticket.
    
    Path Parameters:
        ticket_id: ID do ticket
    
    Body:
        content: str (obrigatório)
        is_internal: bool (padrão: False)
    
    Returns:
        TicketComment: Comentário criado
    
    Exemplo:
        POST /api/v1/tickets/123/comments
        {
            "content": "Problema resolvido!",
            "is_internal": false
        }
    """
    # Implementação...
    pass

@router.post("/{ticket_id}/attachments", response_model=dict)
async def upload_attachment(
    ticket_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Faz upload de arquivo para ticket.
    
    Path Parameters:
        ticket_id: ID do ticket
    
    Form Data:
        file: Arquivo (máx 10MB)
    
    Returns:
        TicketAttachment: Arquivo enviado
    
    Validações:
        - Tamanho máximo: 10MB
        - Extensões permitidas: pdf, doc, docx, txt, png, jpg, jpeg, gif
    
    Exemplo:
        POST /api/v1/tickets/123/attachments
        Content-Type: multipart/form-data
        file: <arquivo binário>
    """
    # Implementação...
    pass
```

### Dashboard (app/api/api_v1/endpoints/dashboard.py)

```python
@router.get("/stats", response_model=dict)
async def get_stats(
    days: int = Query(30, ge=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retorna estatísticas gerais do sistema.
    
    Query Parameters:
        days: Número de dias para análise (padrão: 30)
    
    Returns:
        DashboardStats: {
            total_tickets: int,
            open_tickets: int,
            in_progress_tickets: int,
            resolved_tickets: int,
            closed_tickets: int,
            reopened_tickets: int,
            avg_resolution_time: float (horas),
            avg_time_open: float (horas),
            total_users: int,
            total_technicians: int,
            total_companies: int
        }
    
    Exemplo:
        GET /api/v1/dashboard/stats?days=30
    """
    # Implementação...
    pass

@router.get("/tickets-by-month", response_model=List[dict])
async def get_tickets_by_month(
    months: int = Query(12, ge=1, le=24),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retorna tickets agrupados por mês.
    
    Query Parameters:
        months: Número de meses (padrão: 12)
    
    Returns:
        List[{
            month: str,
            year: int,
            open: int,
            in_progress: int,
            resolved: int,
            closed: int
        }]
    
    Exemplo:
        GET /api/v1/dashboard/tickets-by-month?months=12
    """
    # Implementação...
    pass

@router.get("/technician-performance", response_model=List[dict])
async def get_technician_performance(
    days: int = Query(30, ge=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retorna performance de cada técnico.
    
    Query Parameters:
        days: Número de dias (padrão: 30)
    
    Returns:
        List[{
            technician_id: int,
            technician_name: str,
            resolved_count: int,
            avg_resolution_time: float (horas),
            avg_rating: float (1-5),
            total_evaluations: int
        }]
    
    Exemplo:
        GET /api/v1/dashboard/technician-performance?days=30
    """
    # Implementação...
    pass
```

### Evaluations (app/api/api_v1/endpoints/evaluations.py)

```python
@router.post("/tickets/{ticket_id}/evaluation", response_model=dict)
async def create_evaluation(
    ticket_id: int,
    eval_data: TicketEvaluationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cria avaliação de satisfação para um ticket.
    
    Path Parameters:
        ticket_id: ID do ticket
    
    Body:
        rating: int (1-5, obrigatório)
        feedback: str (opcional)
        resolution_quality: int (1-5, opcional)
        response_time_rating: int (1-5, opcional)
        technician_rating: int (1-5, opcional)
    
    Returns:
        TicketEvaluation: Avaliação criada
    
    Validações:
        - Ticket deve estar em status "closed"
        - Usuário deve ser o criador do ticket
        - Apenas uma avaliação por ticket
    
    Exemplo:
        POST /api/v1/evaluations/tickets/123/evaluation
        {
            "rating": 5,
            "feedback": "Muito bom!",
            "resolution_quality": 5,
            "response_time_rating": 4,
            "technician_rating": 5
        }
    """
    # Implementação...
    pass

@router.get("/metrics/satisfaction", response_model=dict)
async def get_satisfaction_metrics(
    days: int = Query(30, ge=1),
    technician_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retorna métricas de satisfação.
    
    Query Parameters:
        days: Número de dias (padrão: 30)
        technician_id: ID do técnico (opcional)
    
    Returns:
        {
            avg_rating: float,
            total_evaluations: int,
            rating_distribution: { 1: int, 2: int, 3: int, 4: int, 5: int },
            avg_resolution_quality: float,
            avg_response_time_rating: float,
            avg_technician_rating: float
        }
    
    Exemplo:
        GET /api/v1/evaluations/metrics/satisfaction?days=30&technician_id=5
    """
    # Implementação...
    pass
```

### WebSocket (app/api/api_v1/endpoints/websocket.py)

```python
@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    WebSocket para notificações em tempo real.
    
    Query Parameters:
        token: JWT token para autenticação
    
    Mensagens Recebidas:
        {
            "type": "ticket_created",
            "ticket_id": 123,
            "title": "...",
            "priority": "high",
            "created_by": { ... },
            "message": "Novo ticket criado",
            "timestamp": "2024-01-15T10:30:00"
        }
    
    Tipos de Notificação:
        - ticket_created: Novo ticket criado
        - ticket_assigned: Ticket atribuído
        - ticket_status_changed: Status alterado
        - comment_added: Novo comentário
        - ticket_closed: Ticket fechado
        - ticket_reopened: Ticket reaberto
    
    Exemplo:
        ws = new WebSocket('wss://ticket.algti.com/api/v1/notifications/ws?token=...')
        ws.onmessage = (event) => {
            const notification = JSON.parse(event.data)
            console.log(notification)
        }
    """
    # Implementação...
    pass
```

---

## FUNÇÕES CRÍTICAS FRONTEND

### API Service (src/services/api.js)

```javascript
// Criar instância Axios
const authAPI = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de requisição
authAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de resposta (trata token expirado)
authAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const response = await authAPI.post('/auth/refresh');
        const { access_token } = response.data;
        
        localStorage.setItem('token', access_token);
        authAPI.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
        
        return authAPI(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// ========== AUTH SERVICE ==========
export const authService = {
  login: (username, password) => 
    authAPI.post('/auth/login', { username, password }),
  
  getCurrentUser: () => 
    authAPI.get('/auth/me'),
  
  refreshToken: () => 
    authAPI.post('/auth/refresh'),
};

// ========== TICKETS SERVICE ==========
export const ticketsService = {
  getTickets: (params = {}) => {
    console.log('🔍 DEBUG API: Chamando /tickets/ com params:', params);
    return authAPI.get('/tickets/', { params });
  },
  
  getTicket: (id) => 
    authAPI.get(`/tickets/${id}`),
  
  createTicket: (data) => 
    authAPI.post('/tickets/', data),
  
  updateTicket: (id, data) => 
    authAPI.put(`/tickets/${id}`, data),
  
  addComment: (id, data) => 
    authAPI.post(`/tickets/${id}/comments`, data),
  
  uploadAttachment: (id, formData) => 
    authAPI.post(`/tickets/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  deleteTicket: (id) =>
    authAPI.delete(`/tickets/${id}`),
  
  getTicketComments: (id) => 
    authAPI.get(`/tickets/${id}/comments`),
  
  getTechnicians: () => 
    authAPI.get('/users/technicians'),
};

// ========== USERS SERVICE ==========
export const usersService = {
  getUsers: (params = {}) => 
    authAPI.get('/users/', { params }),
  
  getUser: (id) => 
    authAPI.get(`/users/${id}`),
  
  createUser: (data) => 
    authAPI.post('/users/', data),
  
  updateUser: (id, data) => 
    authAPI.put(`/users/${id}`, data),
  
  updateProfile: (data) => {
    console.log('API: Sending updateProfile request with data:', data);
    return authAPI.put('/users/profile', data);
  },
  
  changePassword: (data) => 
    authAPI.put('/users/profile/password', data),
  
  deactivateUser: (id) => 
    authAPI.delete(`/users/${id}`),
  
  activateUser: (id) => 
    authAPI.put(`/users/${id}/activate`),
};

// ========== DASHBOARD SERVICE ==========
export const dashboardService = {
  getStats: (params = {}) => 
    authAPI.get('/dashboard/stats', { params }),
  
  getTicketsByMonth: (params = {}) => 
    authAPI.get('/dashboard/tickets-by-month', { params }),
  
  getTechnicianPerformance: (params = {}) => 
    authAPI.get('/dashboard/technician-performance', { params }),
  
  getPriorityTrends: (params = {}) => 
    authAPI.get('/dashboard/priority-trends', { params }),
};

// ========== EVALUATIONS SERVICE ==========
export const evaluationsService = {
  createEvaluation: (ticketId, evaluationData) => 
    authAPI.post(`/evaluations/tickets/${ticketId}/evaluation`, evaluationData),
  
  getEvaluation: (ticketId) => 
    authAPI.get(`/evaluations/tickets/${ticketId}/evaluation`),
  
  updateEvaluation: (ticketId, evaluationData) => 
    authAPI.put(`/evaluations/tickets/${ticketId}/evaluation`, evaluationData),
  
  getEvaluations: (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });
    return authAPI.get(`/evaluations/evaluations?${queryParams}`);
  },
  
  getSatisfactionMetrics: (days = 30, technicianId = null) => {
    const params = new URLSearchParams({ days: days.toString() });
    if (technicianId) params.append('technician_id', technicianId);
    return authAPI.get(`/evaluations/metrics/satisfaction?${params}`);
  },
};

// ========== REPORTS SERVICE ==========
export const reportsService = {
  getTechnicianPerformance: (days = 30, technicianId = null, startDate = null, endDate = null) => {
    const params = new URLSearchParams();
    if (startDate && endDate) {
      params.append('start_date', startDate);
      params.append('end_date', endDate);
    } else {
      params.append('days', days.toString());
    }
    if (technicianId) params.append('technician_id', technicianId.toString());
    return authAPI.get(`/reports/performance/technicians?${params}`);
  },
  
  getGeneralReport: (startDate, endDate) => {
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    return authAPI.get(`/reports/general?${params}`);
  },
  
  getFinancialConsolidated: (startDate, endDate) => {
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    return authAPI.get(`/reports/advanced/financial-consolidated?${params}`);
  },
};
```

### Auth Context (src/contexts/AuthContext.js)

```javascript
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      authAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      getCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const getCurrentUser = async () => {
    try {
      const response = await authAPI.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Error getting current user:', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      delete authAPI.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setLoading(true);
      const response = await authAPI.post('/auth/login', {
        username,
        password
      });
      
      const { access_token } = response.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      authAPI.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      await getCurrentUser();
      
      toast.success('Login realizado com sucesso!');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.detail || 'Erro ao fazer login';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete authAPI.defaults.headers.common['Authorization'];
    toast.success('Logout realizado com sucesso!');
  };

  const refreshToken = async () => {
    try {
      const response = await authAPI.post('/auth/refresh');
      const { access_token } = response.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      authAPI.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      return false;
    }
  };

  const updateUser = (userData) => {
    console.log('AuthContext: Updating user data:', userData);
    setUser(userData);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    refreshToken,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role?.toLowerCase() === 'admin',
    isTechnician: user?.role?.toLowerCase() === 'technician' || user?.role?.toLowerCase() === 'admin',
    isUser: user?.role?.toLowerCase() === 'user'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

### WebSocket Context (src/contexts/WebSocketContext.js)

```javascript
export const WebSocketProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const { token, user } = useAuth();
  const wsRef = useRef(null);

  useEffect(() => {
    if (!token || !user) return;

    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/v1/notifications/ws?token=${token}`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket conectado');
        setIsConnected(true);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📬 Notificação recebida:', message);
          
          const notification = {
            id: `${Date.now()}-${Math.random()}`,
            ...message,
            read: false
          };
          
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          toast.success(message.message);
        } catch (error) {
          console.error('Erro ao processar notificação:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket erro:', error);
        setIsConnected(false);
      };

      wsRef.current.onclose = () => {
        console.log('❌ WebSocket desconectado');
        setIsConnected(false);
        
        // Reconectar em 5 segundos
        setTimeout(connectWebSocket, 5000);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [token, user]);

  const addNotification = (notification) => {
    const newNotification = {
      id: `${Date.now()}-${Math.random()}`,
      ...notification,
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const value = {
    notifications,
    unreadCount,
    isConnected,
    addNotification,
    markAsRead,
    clearNotifications
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
```

---

## CONSTANTES E ENUMS

### Backend Enums (app/models/models.py)

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
    LOW = "low"                # Baixa
    MEDIUM = "medium"          # Média
    HIGH = "high"              # Alta
    URGENT = "urgent"          # Urgente

class ContractStatus(str, enum.Enum):
    ACTIVE = "active"          # Ativo
    EXPIRED = "expired"        # Expirado
    PENDING_RENEWAL = "pending_renewal"  # Pendente renovação

class AssetStatus(str, enum.Enum):
    active = "active"          # Ativo
    maintenance = "maintenance"# Em manutenção
    retired = "retired"        # Aposentado
```

### Frontend Constants (src/constants.js)

```javascript
export const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  WAITING_USER: 'waiting_user',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  REOPENED: 'reopened'
};

export const TICKET_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

export const USER_ROLE = {
  USER: 'user',
  TECHNICIAN: 'technician',
  ADMIN: 'admin'
};

export const STATUS_COLORS = {
  open: '#ef4444',           // Vermelho
  in_progress: '#f59e0b',    // Laranja
  waiting_user: '#eab308',   // Amarelo
  resolved: '#8b5cf6',       // Roxo
  closed: '#10b981',         // Verde
  reopened: '#f97316'        // Laranja escuro
};

export const PRIORITY_COLORS = {
  low: '#10b981',            // Verde
  medium: '#3b82f6',         // Azul
  high: '#f59e0b',           // Laranja
  urgent: '#ef4444'          // Vermelho
};

export const STATUS_LABELS = {
  open: 'Aberto',
  in_progress: 'Em Andamento',
  waiting_user: 'Aguardando Usuário',
  resolved: 'Resolvido',
  closed: 'Fechado',
  reopened: 'Reaberto'
};

export const PRIORITY_LABELS = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente'
};
```

---

**Documento de Variáveis e Funções Críticas**
**Versão:** 1.0.0
**Status:** Completo
