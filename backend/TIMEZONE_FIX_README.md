# Correção de Timezone - Sistema de Tickets

## 📋 Problema Identificado

O sistema estava registrando todos os horários em UTC (horário de Greenwich), resultando em timestamps 3 horas adiantados em relação ao horário de Brasília.

**Exemplo:**
- Ticket criado às 10:00 (horário de Brasília)
- Sistema registrava: 13:00 (UTC)
- Exibição incorreta: 13:00

## ✅ Solução Implementada

### Arquivos Criados/Modificados

1. **`backend/app/core/timezone.py`** (NOVO)
   - Utilitário centralizado para gerenciamento de timezone
   - Função `get_brazil_now()` retorna datetime no horário de Brasília (UTC-3)

2. **`backend/fix_timezone_database.py`** (NOVO)
   - Script para corrigir timestamps existentes no banco de dados
   - Subtrai 3 horas de todos os registros históricos

3. **Endpoints Atualizados:**
   - `backend/app/api/api_v1/endpoints/tickets.py`
   - `backend/app/api/api_v1/endpoints/evaluations.py`
   - `backend/app/api/api_v1/endpoints/dashboard.py`
   - `backend/app/api/api_v1/endpoints/companies.py`
   - `backend/app/core/config.py`

### Mudanças Realizadas

Todas as ocorrências de `datetime.utcnow()` foram substituídas por `get_brazil_now()`:

```python
# ANTES
ticket.resolved_at = datetime.utcnow()

# DEPOIS
from app.core.timezone import get_brazil_now
ticket.resolved_at = get_brazil_now()
```

## 🚀 Instruções para Deploy na VPS

### 1. Fazer Backup do Banco de Dados (OBRIGATÓRIO)

```bash
cd /var/www/sistema-tickets-ti/backend
cp tickets.db tickets.db.backup_$(date +%Y%m%d_%H%M%S)
```

### 2. Atualizar o Código

```bash
cd /var/www/sistema-tickets-ti
git pull origin ALG_TICKETS
```

### 3. Parar o Serviço

```bash
sudo systemctl stop tickets-backend
```

### 4. Executar Script de Correção do Banco

```bash
cd /var/www/sistema-tickets-ti/backend
python3 fix_timezone_database.py
```

Quando solicitado, digite **SIM** para confirmar.

### 5. Reiniciar o Serviço

```bash
sudo systemctl start tickets-backend
sudo systemctl status tickets-backend
```

### 6. Verificar Logs

```bash
sudo journalctl -u tickets-backend -f
```

## ⚠️ Observações Importantes

1. **Execute o script de correção apenas UMA VEZ**
   - Se executar novamente, vai subtrair mais 3 horas dos timestamps

2. **Backup é obrigatório**
   - Em caso de problemas, você pode restaurar: `cp tickets.db.backup_XXXXXX tickets.db`

3. **Novos registros já usarão horário correto**
   - Após o deploy, todos os novos tickets/comentários/atividades serão criados com horário de Brasília

4. **Validação**
   - Crie um novo ticket após o deploy
   - Verifique se o horário de criação está correto (horário de Brasília)

## 📊 Tabelas Afetadas pelo Script de Correção

O script `fix_timezone_database.py` corrige os seguintes timestamps:

- ✅ **tickets**: created_at, updated_at, resolved_at, closed_at
- ✅ **ticket_comments**: created_at, updated_at
- ✅ **ticket_activities**: created_at
- ✅ **ticket_evaluations**: created_at
- ✅ **users**: created_at, updated_at
- ✅ **companies**: created_at, updated_at, contract_start_date, contract_end_date

## 🔧 Rollback (Se Necessário)

Se algo der errado, você pode reverter:

```bash
# Parar o serviço
sudo systemctl stop tickets-backend

# Restaurar backup do banco
cd /var/www/sistema-tickets-ti/backend
cp tickets.db.backup_XXXXXX tickets.db

# Reverter código (voltar para commit anterior)
cd /var/www/sistema-tickets-ti
git reset --hard HEAD~1

# Reiniciar serviço
sudo systemctl start tickets-backend
```

## ✅ Checklist de Deploy

- [ ] Backup do banco de dados criado
- [ ] Código atualizado via git pull
- [ ] Serviço parado
- [ ] Script de correção executado (digitou SIM)
- [ ] Serviço reiniciado
- [ ] Logs verificados (sem erros)
- [ ] Teste criando novo ticket
- [ ] Horário do novo ticket está correto

## 📞 Suporte

Em caso de dúvidas ou problemas durante o deploy, consulte os logs:

```bash
# Logs do serviço
sudo journalctl -u tickets-backend -n 100

# Logs em tempo real
sudo journalctl -u tickets-backend -f
```
