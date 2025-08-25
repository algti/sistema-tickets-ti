# Documentação Técnica - Sistema de Tickets TI

## 📋 Visão Geral

Sistema completo de gerenciamento de tickets para equipe de TI com integração Active Directory, desenvolvido com FastAPI (backend) e React (frontend).

## 🏗️ Arquitetura

### Backend (FastAPI)
```
backend/
├── app/
│   ├── api/v1/endpoints/     # Rotas da API
│   ├── core/                 # Configurações e segurança
│   ├── models/               # Modelos SQLAlchemy
│   ├── schemas/              # Schemas Pydantic
│   ├── services/             # Lógica de negócio
│   └── utils/                # Utilitários
├── requirements.txt          # Dependências Python
└── Dockerfile               # Container Docker
```

### Frontend (React)
```
frontend/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   ├── pages/               # Páginas da aplicação
│   ├── contexts/            # Context API (Auth)
│   ├── services/            # Chamadas para API
│   └── utils/               # Utilitários
├── package.json             # Dependências Node.js
└── Dockerfile              # Container Docker
```

## 🔧 Tecnologias Utilizadas

### Backend
- **FastAPI**: Framework web moderno e rápido
- **SQLAlchemy**: ORM para Python
- **PostgreSQL**: Banco de dados relacional
- **python-ldap3**: Integração com Active Directory
- **JWT**: Autenticação via tokens
- **Pydantic**: Validação de dados
- **Alembic**: Migrações do banco

### Frontend
- **React 18**: Biblioteca para interfaces
- **TailwindCSS**: Framework CSS utilitário
- **React Query**: Gerenciamento de estado servidor
- **React Router**: Roteamento
- **Axios**: Cliente HTTP
- **React Hook Form**: Formulários
- **Heroicons**: Ícones

## 🗄️ Modelo de Dados

### Principais Entidades

#### Users
```sql
- id (PK)
- username (unique)
- email (unique)
- full_name
- department
- phone
- role (user|technician|admin)
- is_active
- is_ldap_user
- hashed_password (para usuários não-LDAP)
```

#### Tickets
```sql
- id (PK)
- title
- description
- status (open|in_progress|waiting_user|resolved|closed|reopened)
- priority (low|medium|high|urgent)
- created_by_id (FK)
- assigned_to_id (FK)
- category_id (FK)
- solution
- timestamps
```

#### Categories
```sql
- id (PK)
- name (unique)
- description
- color
- is_active
```

### Relacionamentos
- User 1:N Tickets (criados)
- User 1:N Tickets (atribuídos)
- Category 1:N Tickets
- Ticket 1:N Comments
- Ticket 1:N Attachments
- Ticket 1:N Activities
- Ticket 1:1 Evaluation

## 🔐 Autenticação e Autorização

### Fluxo de Autenticação
1. Usuário envia credenciais (username/password)
2. Sistema tenta autenticar via LDAP
3. Se sucesso, cria/atualiza usuário no banco
4. Gera JWT token
5. Frontend armazena token e faz requisições autenticadas

### Níveis de Acesso
- **User**: Criar tickets, comentar nos próprios tickets
- **Technician**: Visualizar todos tickets, atribuir, resolver
- **Admin**: Acesso total, gerenciar usuários e categorias

## 🌐 API Endpoints

### Autenticação
```
POST /api/v1/auth/login          # Login
GET  /api/v1/auth/me             # Usuário atual
POST /api/v1/auth/refresh        # Renovar token
```

### Tickets
```
GET    /api/v1/tickets           # Listar tickets
POST   /api/v1/tickets           # Criar ticket
GET    /api/v1/tickets/{id}      # Obter ticket
PUT    /api/v1/tickets/{id}      # Atualizar ticket
POST   /api/v1/tickets/{id}/comments    # Adicionar comentário
POST   /api/v1/tickets/{id}/attachments # Upload arquivo
```

### Usuários
```
GET    /api/v1/users             # Listar usuários
POST   /api/v1/users             # Criar usuário
GET    /api/v1/users/{id}        # Obter usuário
PUT    /api/v1/users/{id}        # Atualizar usuário
DELETE /api/v1/users/{id}        # Desativar usuário
```

### Dashboard
```
GET /api/v1/dashboard/stats                    # Estatísticas
GET /api/v1/dashboard/tickets-by-month         # Tickets por mês
GET /api/v1/dashboard/technician-performance   # Performance técnicos
```

## 🔧 Configuração LDAP

### Variáveis de Ambiente
```env
LDAP_SERVER=ldap://seu-servidor-ad.local:389
LDAP_BASE_DN=DC=empresa,DC=local
LDAP_BIND_DN=CN=service-account,OU=Users,DC=empresa,DC=local
LDAP_BIND_PASSWORD=senha-service-account
LDAP_USER_SEARCH_BASE=OU=Users,DC=empresa,DC=local
LDAP_GROUP_SEARCH_BASE=OU=Groups,DC=empresa,DC=local
```

### Mapeamento de Grupos
O sistema verifica grupos do AD para definir roles:
- `ti-admin` ou `helpdesk-admin` → Admin
- `ti-tech` ou `helpdesk-tech` → Technician
- Outros → User

## 🚀 Deploy

### Desenvolvimento
```bash
# Windows
start-dev.bat

# Linux/Mac
chmod +x start-dev.sh
./start-dev.sh
```

### Produção com Docker
```bash
# Configurar variáveis no docker-compose.yml
docker-compose up -d
```

### Produção Manual
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm install
npm run build
serve -s build -l 3000
```

## 📊 Monitoramento

### Logs
- Backend: Logs estruturados via FastAPI
- Frontend: Console do navegador
- Banco: Logs do PostgreSQL

### Métricas
- Tempo de resposta da API
- Número de tickets por status
- Performance dos técnicos
- Tempo médio de resolução

## 🔒 Segurança

### Implementadas
- Autenticação JWT com expiração
- Validação de entrada com Pydantic
- Sanitização de uploads
- CORS configurado
- Hashing de senhas com bcrypt

### Recomendações Produção
- HTTPS obrigatório
- Rate limiting
- Backup automático
- Logs de auditoria
- Firewall configurado

## 🧪 Testes

### Backend
```bash
cd backend
pytest
```

### Frontend
```bash
cd frontend
npm test
```

## 📈 Escalabilidade

### Otimizações Implementadas
- Índices no banco de dados
- Paginação nas listagens
- Cache de queries (React Query)
- Lazy loading de componentes

### Melhorias Futuras
- Redis para cache
- CDN para assets
- Load balancer
- Microserviços
- Kubernetes

## 🐛 Troubleshooting

### Problemas Comuns

#### LDAP não conecta
- Verificar conectividade de rede
- Validar credenciais do service account
- Conferir DN base e search base

#### Frontend não carrega
- Verificar se backend está rodando
- Conferir CORS no backend
- Validar variáveis de ambiente

#### Banco de dados
- Verificar conexão PostgreSQL
- Executar migrações: `alembic upgrade head`
- Verificar permissões do usuário

## 📞 Suporte

Para dúvidas técnicas:
1. Consultar logs da aplicação
2. Verificar documentação da API: `/docs`
3. Revisar configurações de ambiente
4. Contatar equipe de desenvolvimento
