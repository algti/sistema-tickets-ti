# 🔧 DIAGNÓSTICO - ERRO DO BACKEND NA VPS

## ⚠️ PROBLEMA IDENTIFICADO

Backend não está iniciando:
```
Active: activating (auto-restart) (Result: exit-code) since Thu 2026-08-27 13:33:00 -03
Process: 1486 ExecStart=/var/www/sistema-tickets-ti/backend/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 (code=exited, status=1/FAILURE)
```

---

## 🔍 PASSO 1: VER LOGS DETALHADOS

Execute na VPS:

```bash
sudo journalctl -u tickets-backend -n 100 --no-pager
```

Isso vai mostrar o erro exato. **Copie e cole a saída aqui para que eu possa diagnosticar.**

---

## 🆘 POSSÍVEIS CAUSAS

### 1. Erro de Importação
```
ModuleNotFoundError: No module named 'app.services.email_service'
```
**Solução:** Verificar se `email_service.py` existe em `backend/app/services/`

### 2. Erro de Sintaxe
```
SyntaxError: invalid syntax
```
**Solução:** Verificar sintaxe do arquivo modificado

### 3. Erro de Configuração
```
ValueError: SMTP_SERVER not configured
```
**Solução:** Verificar variáveis de ambiente no `.env`

### 4. Erro de Banco de Dados
```
sqlalchemy.exc.OperationalError
```
**Solução:** Verificar se banco de dados está acessível

### 5. Erro de Permissões
```
PermissionError: [Errno 13] Permission denied
```
**Solução:** Ajustar permissões dos arquivos

---

## ✅ VERIFICAÇÕES RÁPIDAS

### Verificar se arquivo existe
```bash
ls -la /var/www/sistema-tickets-ti/backend/app/services/email_service.py
```

### Verificar sintaxe Python
```bash
cd /var/www/sistema-tickets-ti/backend
python -m py_compile app/services/email_service.py
```

### Verificar imports
```bash
cd /var/www/sistema-tickets-ti/backend
python -c "from app.services.email_service import email_service; print('OK')"
```

### Verificar variáveis de ambiente
```bash
cat /var/www/sistema-tickets-ti/backend/.env | grep SMTP
```

### Verificar permissões
```bash
ls -la /var/www/sistema-tickets-ti/backend/app/services/
```

---

## 🔧 SOLUÇÕES COMUNS

### Se for erro de sintaxe em email_service.py

```bash
# Voltar para versão anterior
cd /var/www/sistema-tickets-ti
git checkout HEAD~1 backend/app/services/email_service.py

# Ou fazer pull novamente
git pull origin feature/passwordless-otp --force

# Reiniciar
sudo systemctl restart tickets-backend
```

### Se for erro de importação

```bash
# Verificar se arquivo foi commitado
git log --oneline backend/app/services/email_service.py

# Se não estiver, fazer pull novamente
git pull origin feature/passwordless-otp

# Reiniciar
sudo systemctl restart tickets-backend
```

### Se for erro de permissões

```bash
# Ajustar permissões
sudo chown -R www-data:www-data /var/www/sistema-tickets-ti
sudo chmod -R 755 /var/www/sistema-tickets-ti

# Reiniciar
sudo systemctl restart tickets-backend
```

### Se for erro de SMTP

```bash
# Verificar .env
cat /var/www/sistema-tickets-ti/backend/.env

# Se SMTP_SERVER estiver vazio, adicionar:
echo "SMTP_SERVER=seu-servidor-smtp.com" >> /var/www/sistema-tickets-ti/backend/.env
echo "SMTP_PORT=587" >> /var/www/sistema-tickets-ti/backend/.env
echo "SMTP_USERNAME=seu-usuario" >> /var/www/sistema-tickets-ti/backend/.env
echo "SMTP_PASSWORD=sua-senha" >> /var/www/sistema-tickets-ti/backend/.env

# Reiniciar
sudo systemctl restart tickets-backend
```

---

## 📋 PRÓXIMOS PASSOS

1. **Execute:** `sudo journalctl -u tickets-backend -n 100 --no-pager`
2. **Copie a saída** e envie para diagnóstico
3. **Eu vou identificar** o erro exato
4. **Vamos corrigir** juntos

---

**Aguardando logs para diagnóstico...**
