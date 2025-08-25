# Sistema de Tickets TI

Sistema completo de gerenciamento de chamados para equipe de TI com integração Active Directory.

## 🚀 Tecnologias

- **Frontend**: React.js + TailwindCSS
- **Backend**: FastAPI + Python
- **Banco de Dados**: PostgreSQL
- **Autenticação**: Active Directory (LDAP) + JWT
- **Deploy**: Docker + Docker Compose

## 📁 Estrutura do Projeto

```
sistema-tickets-ti/
├── backend/                 # API FastAPI
│   ├── app/
│   │   ├── api/            # Rotas da API
│   │   ├── core/           # Configurações e segurança
│   │   ├── models/         # Modelos SQLAlchemy
│   │   ├── schemas/        # Schemas Pydantic
│   │   ├── services/       # Lógica de negócio
│   │   └── utils/          # Utilitários
│   ├── alembic/            # Migrações do banco
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               # Aplicação React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── services/       # Chamadas para API
│   │   ├── hooks/          # Custom hooks
│   │   └── utils/          # Utilitários
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml      # Orquestração dos serviços
└── docs/                   # Documentação
```

## 🔧 Instalação e Configuração

### Pré-requisitos
- Docker e Docker Compose
- Node.js 18+ (para desenvolvimento)
- Python 3.11+ (para desenvolvimento)

### Configuração Rápida com Docker

1. Clone o repositório
2. Configure as variáveis de ambiente:
   ```bash
   cp backend/.env.example backend/.env
   ```
3. Inicie os serviços:
   ```bash
   docker-compose up -d
   ```

### Desenvolvimento Local

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

## 🔐 Configuração do Active Directory

Configure as variáveis no arquivo `.env`:
```
LDAP_SERVER=ldap://seu-servidor-ad.local
LDAP_BASE_DN=DC=empresa,DC=local
LDAP_BIND_DN=CN=service-account,OU=Users,DC=empresa,DC=local
LDAP_BIND_PASSWORD=senha-do-service-account
```

## 📊 Funcionalidades

### Usuário Comum (AD)
- ✅ Login com credenciais do Active Directory
- ✅ Criar chamados com anexos
- ✅ Acompanhar status dos chamados
- ✅ Chat com técnicos
- ✅ Avaliar atendimento

### Técnico de TI
- ✅ Dashboard de chamados
- ✅ Filtros avançados
- ✅ Atualizar status e comentários
- ✅ Upload de arquivos de solução
- ✅ Relatórios básicos

### Administrador
- ✅ Painel administrativo completo
- ✅ Gerenciar técnicos e categorias
- ✅ Relatórios detalhados
- ✅ Exportação de dados
- ✅ Logs de auditoria

## 🌐 Acesso ao Sistema

- **Frontend**: http://localhost:3000
- **API**: http://localhost:8000
- **Documentação API**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432

## 🚀 Deploy em Produção

### Ambiente Corporativo (Intranet)

1. **Servidor Linux/Windows Server**:
   - Docker Engine instalado
   - Acesso à rede do Active Directory
   - Portas 80/443 liberadas

2. **Configuração SSL**:
   - Certificado SSL válido
   - Proxy reverso (Nginx/Apache)

3. **Backup**:
   - Backup automático do PostgreSQL
   - Backup dos arquivos uploadados

### Escalabilidade Futura

- **Integração Microsoft Teams**: Notificações via webhook
- **IA para Triagem**: Classificação automática de chamados
- **Mobile App**: React Native
- **Relatórios Avançados**: PowerBI/Grafana
- **API Externa**: Integração com outros sistemas

## 📝 Licença

Este projeto é de uso interno da empresa.
