# 🔄 FLUXOS DETALHADOS DO SISTEMA DE TICKETS

## 1. FLUXO DE AUTENTICAÇÃO

### 1.1 Login com LDAP
```
┌─────────────────┐
│  Usuário        │
│  Acessa /login  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Frontend (Login.js)                │
│  - Insere username e password       │
│  - Clica "Entrar"                   │
└────────┬────────────────────────────┘
         │
         │ POST /api/v1/auth/login
         │ Body: { username, password }
         │
         ▼
┌─────────────────────────────────────┐
│  Backend (auth.py)                  │
│  1. Recebe credenciais              │
│  2. Tenta LDAP authenticate         │
└────────┬────────────────────────────┘
         │
         ├─ LDAP Sucesso ──────────────┐
         │                             │
         │                             ▼
         │                    ┌──────────────────────┐
         │                    │ Cria/Atualiza User   │
         │                    │ no banco de dados    │
         │                    │ Role baseado em      │
         │                    │ grupos AD:           │
         │                    │ - ti-admin → admin   │
         │                    │ - ti-tech → tech     │
         │                    │ - sem grupo → user   │
         │                    └──────────┬───────────┘
         │                               │
         └─ LDAP Falha ────────────────┐ │
                                       │ │
                                       ▼ ▼
                            ┌──────────────────────┐
                            │ Tenta autenticação   │
                            │ local (admin@emp)    │
                            │ Verifica hash bcrypt │
                            └──────────┬───────────┘
                                       │
                                       ▼
                            ┌──────────────────────┐
                            │ Gera JWT Token       │
                            │ - Algoritmo: HS256   │
                            │ - Expiração: 24h     │
                            │ - Payload: {         │
                            │    "sub": username,  │
                            │    "exp": timestamp  │
                            │  }                   │
                            └──────────┬───────────┘
                                       │
                                       │ Response: { access_token, token_type }
                                       │
                                       ▼
                            ┌──────────────────────┐
                            │  Frontend            │
                            │  1. Recebe token     │
                            │  2. Armazena em      │
                            │     localStorage     │
                            │  3. Define header    │
                            │     Authorization    │
                            │  4. Chama GET /me    │
                            └──────────┬───────────┘
                                       │
                                       │ GET /api/v1/auth/me
                                       │ Headers: Authorization: Bearer <token>
                                       │
                                       ▼
                            ┌──────────────────────┐
                            │  Backend             │
                            │  1. Valida token JWT │
                            │  2. Busca usuário    │
                            │  3. Retorna dados    │
                            └──────────┬───────────┘
                                       │
                                       │ Response: User object
                                       │
                                       ▼
                            ┌──────────────────────┐
                            │  Frontend            │
                            │  1. Armazena user    │
                            │     no AuthContext   │
                            │  2. Redireciona      │
                            │     para /dashboard  │
                            │  3. Abre WebSocket   │
                            │     para notificações│
                            └──────────────────────┘
```

### 1.2 Token Expirado - Refresh
```
Frontend faz requisição
         │
         ▼
Response 401 Unauthorized
         │
         ▼
Interceptor Axios
         │
         ├─ Já tentou refresh? ──→ Sim ──→ Redireciona /login
         │
         └─ Não
            │
            ▼
         POST /api/v1/auth/refresh
         Headers: Authorization: Bearer <token_expirado>
            │
            ▼
         Backend valida e gera novo token
            │
            ▼
         Response: { access_token }
            │
            ▼
         Frontend:
         1. Armazena novo token
         2. Atualiza header Authorization
         3. Retenta requisição original
            │
            ▼
         ✅ Sucesso
```

---

## 2. FLUXO DE CRIAÇÃO DE TICKET

```
┌──────────────────┐
│  Usuário         │
│  Clica           │
│  "Novo Ticket"   │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Frontend (CreateTicket.js)          │
│  Formulário com campos:              │
│  - Título (obrigatório)              │
│  - Descrição (obrigatório)           │
│  - Categoria (obrigatório)           │
│  - Prioridade (padrão: medium)       │
│  - Anexos (opcional, até 10MB)       │
│  - Empresa (opcional)                │
└────────┬─────────────────────────────┘
         │
         │ Usuário preenche e clica "Criar"
         │
         ▼
┌──────────────────────────────────────┐
│  Frontend (Validação)                │
│  - Valida campos obrigatórios        │
│  - Valida tamanho de arquivo         │
│  - Valida extensões permitidas       │
│  - Mostra erros se houver            │
└────────┬─────────────────────────────┘
         │
         │ Se válido:
         │
         ▼
┌──────────────────────────────────────┐
│  POST /api/v1/tickets/               │
│  Headers: Authorization: Bearer <tok>│
│  Body: {                             │
│    title: string,                    │
│    description: string,              │
│    category_id: int,                 │
│    priority: string,                 │
│    company_id: int (opt)             │
│  }                                   │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Backend (tickets.py - create_ticket)│
│  1. Extrai current_user do token     │
│  2. Valida dados com Pydantic        │
│  3. Cria objeto Ticket               │
│  4. Define created_by_id = user.id   │
│  5. Define status = "open"           │
│  6. Salva no banco de dados          │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Backend (create_activity)           │
│  Cria TicketActivity:                │
│  - action: "created"                 │
│  - description: "Ticket criado"      │
│  - user_id: current_user.id          │
│  - ticket_id: novo_ticket.id         │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Backend (notifications.py)          │
│  notify_ticket_created():            │
│  1. Cria mensagem JSON               │
│  2. Envia para role "technician"     │
│  3. Envia para role "admin"          │
│  4. Via WebSocket ConnectionManager  │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Backend (email_service.py)          │
│  Se EMAIL_ENABLED = True:            │
│  1. Busca email de técnicos          │
│  2. Envia email com detalhes         │
│  3. Template Jinja2                  │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Response: 201 Created               │
│  Body: Ticket object                 │
│  {                                   │
│    id: 123,                          │
│    title: "...",                     │
│    status: "open",                   │
│    created_by: { ... },              │
│    created_at: "2024-01-15T10:30:00" │
│  }                                   │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Frontend (TicketDetail.js)          │
│  1. Recebe ticket criado             │
│  2. Armazena no estado               │
│  3. Redireciona para /tickets/123    │
│  4. Mostra toast "Ticket criado!"    │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  Técnicos/Admins                     │
│  1. Recebem notificação WebSocket    │
│  2. Toast aparece na tela            │
│  3. Podem clicar para abrir ticket   │
│  4. Veem novo ticket na lista        │
└──────────────────────────────────────┘
```

---

## 3. FLUXO DE ATRIBUIÇÃO E RESOLUÇÃO

```
┌──────────────────────────────────────┐
│  Técnico                             │
│  Visualiza ticket em "open"          │
│  Clica "Atribuir a mim"              │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Frontend (TicketDetail.js)          │
│  PUT /api/v1/tickets/{id}            │
│  Body: {                             │
│    assigned_to_id: tech_id,          │
│    status: "in_progress"             │
│  }                                   │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Backend (update_ticket)             │
│  1. Valida permissões (tech/admin)   │
│  2. Busca ticket no banco            │
│  3. Atualiza campos                  │
│  4. Define updated_at = agora        │
│  5. Salva no banco                   │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Backend (create_activity)           │
│  Cria TicketActivity:                │
│  - action: "assigned"                │
│  - old_value: null                   │
│  - new_value: tech_name              │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Backend (notify_ticket_assigned)    │
│  1. Envia notificação para técnico   │
│  2. Envia para criador do ticket     │
│  3. Via WebSocket                    │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Técnico                             │
│  1. Recebe notificação               │
│  2. Adiciona comentários com solução │
│  3. Clica "Marcar como Resolvido"    │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Frontend (TicketDetail.js)          │
│  PUT /api/v1/tickets/{id}            │
│  Body: {                             │
│    status: "resolved",               │
│    solution: "Descrição da solução"  │
│  }                                   │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Backend                             │
│  1. Atualiza status para "resolved"  │
│  2. Define resolved_at = agora       │
│  3. Salva solução                    │
│  4. Cria TicketActivity              │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Backend (notify_ticket_status_changed)
│  Envia notificação para usuário      │
│  "Seu ticket foi resolvido!"         │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Usuário                             │
│  1. Recebe notificação               │
│  2. Acessa ticket                    │
│  3. Vê botão "Confirmar Resolução"   │
│  4. Clica botão                      │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Frontend (TicketDetail.js)          │
│  PUT /api/v1/tickets/{id}            │
│  Body: { status: "closed" }          │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Backend                             │
│  1. Atualiza status para "closed"    │
│  2. Define closed_at = agora         │
│  3. Cria TicketActivity              │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Frontend (TicketDetail.js)          │
│  Mostra formulário de avaliação:     │
│  - Rating (1-5 stars)                │
│  - Feedback (texto)                  │
│  - Resolution Quality (1-5)          │
│  - Response Time (1-5)               │
│  - Technician Rating (1-5)           │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Usuário                             │
│  1. Preenche avaliação               │
│  2. Clica "Enviar Avaliação"         │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Frontend (TicketDetail.js)          │
│  POST /api/v1/evaluations/tickets/{id}/evaluation
│  Body: {                             │
│    rating: 5,                        │
│    feedback: "Muito bom!",           │
│    resolution_quality: 5,            │
│    response_time_rating: 4,          │
│    technician_rating: 5              │
│  }                                   │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Backend (evaluations.py)            │
│  1. Valida dados                     │
│  2. Cria TicketEvaluation            │
│  3. Salva no banco                   │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Backend (dashboard.py)              │
│  Atualiza métricas:                  │
│  - avg_rating                        │
│  - total_evaluations                 │
│  - technician_avg_rating             │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Frontend                            │
│  Toast: "Avaliação enviada!"         │
│  Ticket finalizado ✅                │
└──────────────────────────────────────┘
```

---

## 4. FLUXO DE NOTIFICAÇÕES WEBSOCKET

```
┌──────────────────────────────────────┐
│  Usuário faz login                   │
│  Frontend armazena token             │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Frontend (WebSocketContext.js)      │
│  Abre conexão WebSocket:             │
│  WS /api/v1/notifications/ws?token=<jwt>
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Nginx (proxy reverso)               │
│  Upgrade para WebSocket              │
│  Proxy para http://127.0.0.1:8000    │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Backend (websocket.py)              │
│  1. Recebe conexão                   │
│  2. Valida token JWT                 │
│  3. Busca usuário no banco           │
│  4. Registra em ConnectionManager    │
│     manager.connections[user_id] = ws
│  5. Aguarda mensagens                │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Evento ocorre (ex: novo ticket)     │
│  Backend (tickets.py - create_ticket)│
│  Chama:                              │
│  await notify_ticket_created(        │
│    ticket, created_by               │
│  )                                   │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Backend (notifications.py)          │
│  Cria mensagem JSON:                 │
│  {                                   │
│    "type": "ticket_created",         │
│    "ticket_id": 123,                 │
│    "title": "...",                   │
│    "priority": "high",               │
│    "created_by": { ... },            │
│    "message": "Novo ticket criado",  │
│    "timestamp": "2024-01-15T10:30"   │
│  }                                   │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Backend (manager.py)                │
│  Envia para role "technician":       │
│  for user_id in technicians:         │
│    if user_id in connections:        │
│      await ws.send_json(message)     │
│                                      │
│  Envia para role "admin":            │
│  for user_id in admins:              │
│    if user_id in connections:        │
│      await ws.send_json(message)     │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Frontend (WebSocketContext.js)      │
│  Recebe mensagem JSON                │
│  1. Atualiza estado (notifications)  │
│  2. Incrementa unreadCount           │
│  3. Chama toast notification         │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Frontend (UI)                       │
│  1. Toast aparece no canto           │
│  2. Ícone de notificação pisca       │
│  3. Badge com número de não lidas    │
│  4. Usuário clica notificação        │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Frontend (Notifications.js)         │
│  1. Navega para /tickets/123         │
│  2. Marca notificação como lida      │
│  3. Carrega TicketDetail             │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  Ao desconectar:                     │
│  1. WebSocket fecha                  │
│  2. Backend remove de connections    │
│  3. Ao reconectar: registra novamente│
└──────────────────────────────────────┘
```

---

## 5. FLUXO DE UPLOAD DE ARQUIVO

```
┌──────────────────────────────────────┐
│  Usuário em TicketDetail             │
│  Clica "Adicionar Anexo"             │
│  Seleciona arquivo                   │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Frontend (TicketDetail.js)          │
│  Validação local:                    │
│  1. Tamanho < 10MB?                  │
│  2. Extensão permitida?              │
│  3. Mostra erro se inválido          │
└────────┬─────────────────────────────┘
         │ Se válido:
         │
         ▼
┌──────────────────────────────────────┐
│  Frontend (FormData)                 │
│  POST /api/v1/tickets/{id}/attachments
│  Headers:                            │
│    Authorization: Bearer <token>     │
│    Content-Type: multipart/form-data │
│  Body:                               │
│    file: <arquivo binário>           │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Backend (tickets.py - upload_file)  │
│  1. Extrai arquivo do FormData       │
│  2. Valida extensão                  │
│  3. Valida tamanho                   │
│  4. Gera nome único com UUID         │
│  5. Salva em /uploads/               │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Backend (models.py)                 │
│  Cria TicketAttachment:              │
│  - filename: "abc123def.pdf"         │
│  - original_filename: "documento.pdf"│
│  - file_path: "/uploads/abc123def"   │
│  - file_size: 1024000                │
│  - content_type: "application/pdf"   │
│  - ticket_id: 123                    │
│  - uploaded_by_id: user_id           │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Response: 201 Created               │
│  Body: TicketAttachment object       │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Frontend                            │
│  1. Recebe attachment criado         │
│  2. Adiciona à lista de anexos       │
│  3. Mostra preview/ícone             │
│  4. Toast: "Arquivo enviado!"        │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  Para download:                      │
│  GET /api/v1/tickets/{id}/attachments/{aid}/download
│  Backend:                            │
│  1. Valida permissões                │
│  2. Busca arquivo no disco           │
│  3. Retorna FileResponse             │
│  4. Browser faz download             │
└──────────────────────────────────────┘
```

---

## 6. FLUXO DE DASHBOARD

```
┌──────────────────────────────────────┐
│  Usuário acessa /dashboard           │
│  Frontend (Dashboard.js)             │
└────────┬─────────────────────────────┘
         │
         ├─ GET /api/v1/dashboard/stats
         │  Query: ?days=30
         │
         ├─ GET /api/v1/dashboard/tickets-by-month
         │  Query: ?months=12
         │
         ├─ GET /api/v1/dashboard/technician-performance
         │  Query: ?days=30
         │
         └─ GET /api/v1/dashboard/priority-trends
            Query: ?days=30
         │
         ▼
┌──────────────────────────────────────┐
│  Backend (dashboard.py)              │
│                                      │
│  get_stats():                        │
│  1. Query tickets por status         │
│  2. Calcula avg_resolution_time      │
│  3. Calcula avg_time_open            │
│  4. Conta usuários/técnicos/empresas │
│  5. Retorna DashboardStats           │
│                                      │
│  get_tickets_by_month():             │
│  1. Agrupa tickets por mês           │
│  2. Conta por status                 │
│  3. Retorna lista com dados          │
│                                      │
│  get_technician_performance():       │
│  1. Para cada técnico:               │
│     - Conta tickets resolvidos       │
│     - Calcula tempo médio            │
│     - Calcula taxa de satisfação     │
│  2. Ordena por performance           │
│  3. Retorna lista                    │
│                                      │
│  get_priority_trends():              │
│  1. Agrupa por prioridade            │
│  2. Conta por status                 │
│  3. Retorna distribuição             │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Frontend (Dashboard.js)             │
│  Recebe dados de todas as requisições│
│  1. Armazena em estado React         │
│  2. Renderiza componentes:           │
│     - Cards com números              │
│     - Gráficos Recharts              │
│     - Tabelas de performance         │
│     - Indicadores de tendência       │
│  3. Atualiza a cada 30s (opcional)   │
└──────────────────────────────────────┘
```

---

## 7. FLUXO DE FILTROS E BUSCA

```
┌──────────────────────────────────────┐
│  Usuário em /tickets                 │
│  Seleciona filtros:                  │
│  - Status: "in_progress"             │
│  - Prioridade: "high"                │
│  - Categoria: "Network"              │
│  - Técnico: "João Silva"             │
│  - Busca: "internet"                 │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Frontend (Tickets.js)               │
│  Constrói query params:              │
│  ?status=in_progress                 │
│  &priority=high                      │
│  &category_id=5                      │
│  &assigned_to_id=3                   │
│  &search=internet                    │
│  &skip=0                             │
│  &limit=50                           │
└────────┬─────────────────────────────┘
         │
         │ GET /api/v1/tickets/?status=...&priority=...
         │
         ▼
┌──────────────────────────────────────┐
│  Backend (tickets.py - get_tickets)  │
│  1. Extrai query params              │
│  2. Inicia query base: SELECT * FROM │
│     tickets                          │
│  3. Aplica filtros:                  │
│     if status:                       │
│       WHERE status = status          │
│     if priority:                     │
│       AND priority = priority        │
│     if category_id:                  │
│       AND category_id = category_id  │
│     if assigned_to_id:               │
│       AND assigned_to_id = ...       │
│     if search:                       │
│       AND (title LIKE search OR      │
│            description LIKE search)  │
│  4. Filtra por role do usuário:      │
│     if user.role == "user":          │
│       AND created_by_id = user.id    │
│     else (tech/admin):               │
│       (sem restrição)                │
│  5. Ordena por created_at DESC       │
│  6. Aplica paginação (skip, limit)   │
│  7. Executa query                    │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Response: List[Ticket]              │
│  [                                   │
│    { id, title, status, ... },       │
│    { id, title, status, ... },       │
│    ...                               │
│  ]                                   │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Frontend (Tickets.js)               │
│  1. Recebe lista de tickets          │
│  2. Armazena em estado               │
│  3. Renderiza tabela/cards           │
│  4. Mostra total de resultados       │
│  5. Habilita paginação               │
└──────────────────────────────────────┘
```

---

## 8. FLUXO DE RELATÓRIOS

```
┌──────────────────────────────────────┐
│  Usuário (tech/admin)                │
│  Acessa /reports                     │
│  Seleciona:                          │
│  - Tipo de relatório                 │
│  - Data início                       │
│  - Data fim                          │
│  - Filtros adicionais                │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Frontend (Reports.js)               │
│  GET /api/v1/reports/general         │
│  Query: ?start_date=2024-01-01       │
│         &end_date=2024-01-31         │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Backend (reports.py)                │
│  1. Valida datas                     │
│  2. Query tickets no período         │
│  3. Calcula métricas:                │
│     - Total de tickets               │
│     - Por status                     │
│     - Por prioridade                 │
│     - Por categoria                  │
│     - Tempo médio de resolução       │
│     - Taxa de satisfação             │
│     - Performance por técnico        │
│  4. Agrupa dados                     │
│  5. Retorna relatório                │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Frontend (Reports.js)               │
│  1. Recebe dados do relatório        │
│  2. Renderiza:                       │
│     - Tabelas com dados              │
│     - Gráficos Recharts              │
│     - Indicadores KPI                │
│  3. Oferece opções:                  │
│     - Exportar Excel                 │
│     - Exportar PDF                   │
│     - Imprimir                       │
└────────┬─────────────────────────────┘
         │
         ├─ Clica "Exportar Excel"
         │  │
         │  ▼
         │  Frontend (XLSX library)
         │  1. Cria workbook
         │  2. Adiciona dados
         │  3. Faz download
         │
         └─ Clica "Exportar PDF"
            │
            ▼
            Frontend (JSPDF library)
            1. Cria documento
            2. Adiciona tabelas/gráficos
            3. Faz download
```

---

## 9. FLUXO DE REABERTURA DE TICKET

```
┌──────────────────────────────────────┐
│  Usuário                             │
│  Ticket estava "closed"              │
│  Problema não foi resolvido          │
│  Clica "Reabrir Ticket"              │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Frontend (TicketDetail.js)          │
│  PUT /api/v1/tickets/{id}            │
│  Body: { status: "reopened" }        │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Backend (tickets.py)                │
│  1. Valida permissões                │
│  2. Atualiza status para "reopened"  │
│  3. Cria TicketActivity              │
│  4. Limpa closed_at                  │
│  5. Salva no banco                   │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Backend (notifications.py)          │
│  notify_ticket_reopened():           │
│  Envia notificação para:             │
│  - Técnico atribuído                 │
│  - Admins                            │
│  Mensagem: "Ticket reaberto"         │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Frontend                            │
│  1. Atualiza status na tela          │
│  2. Mostra badge "Reaberto"          │
│  3. Toast: "Ticket reaberto!"        │
│  4. Técnico recebe notificação       │
└──────────────────────────────────────┘
```

---

## 10. FLUXO DE PERMISSÕES (RBAC)

```
┌──────────────────────────────────────┐
│  Requisição chega ao Backend         │
│  Headers: Authorization: Bearer <jwt>│
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Middleware CORS                     │
│  Valida origem da requisição         │
│  Se não permitida: 403 Forbidden     │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Dependência get_current_user        │
│  1. Extrai token do header           │
│  2. Decodifica JWT                   │
│  3. Busca usuário no banco           │
│  4. Valida se ativo                  │
│  Se falha: 401 Unauthorized          │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Endpoint requer role específico?    │
│                                      │
│  @router.put("/tickets/{id}")        │
│  async def update_ticket(            │
│    current_user = Depends(           │
│      get_current_technician          │
│    )                                 │
│  )                                   │
│                                      │
│  get_current_technician():           │
│  1. Chama get_current_user           │
│  2. Verifica role                    │
│  3. Se role in ["technician","admin"]│
│     → Permite                        │
│  4. Senão → 403 Forbidden            │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Lógica de negócio                   │
│  Validações adicionais:              │
│                                      │
│  if user.role == "user":             │
│    # Pode ver apenas seus tickets    │
│    tickets = tickets.filter(         │
│      created_by_id = user.id         │
│    )                                 │
│                                      │
│  if user.role == "technician":       │
│    # Pode ver todos                  │
│    # Mas não pode deletar            │
│                                      │
│  if user.role == "admin":            │
│    # Acesso total                    │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Response                            │
│  200 OK + dados                      │
│  ou                                  │
│  403 Forbidden                       │
└──────────────────────────────────────┘
```

---

**Documento de Fluxos Detalhados**
**Versão:** 1.0.0
**Status:** Completo
