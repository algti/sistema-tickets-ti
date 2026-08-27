# 🚀 FASE 4: DEPLOY NA VPS - GUIA COMPLETO

## 📋 PRÉ-REQUISITOS

Antes de fazer o deploy, certifique-se de que:

- ✅ Todas as alterações foram commitadas no Git
- ✅ Branch `feature/passwordless-otp` está atualizada
- ✅ VPS está acessível via SSH
- ✅ Backend está rodando na VPS
- ✅ Nginx está configurado

---

## 🚀 PASSO 1: FAZER PUSH PARA GITHUB

Primeiro, envie todas as alterações para o GitHub:

```bash
# No seu computador local
git push origin feature/passwordless-otp
```

**Verificar se o push foi bem-sucedido:**
- Acesse https://github.com/algti/sistema-tickets-ti
- Verifique se a branch `feature/passwordless-otp` tem os commits mais recentes

---

## 🔌 PASSO 2: CONECTAR NA VPS

Conecte-se à VPS via SSH:

```bash
ssh root@srv1049200.hstgr.cloud
```

**Senha:** (use a senha da VPS)

---

## 📂 PASSO 3: NAVEGAR PARA O DIRETÓRIO DO PROJETO

```bash
cd /var/www/sistema-tickets-ti
```

**Verificar se está no diretório correto:**
```bash
pwd
# Deve mostrar: /var/www/sistema-tickets-ti

ls -la
# Deve mostrar: backend/ frontend/ .git/ etc.
```

---

## 🔄 PASSO 4: FAZER PULL DAS ALTERAÇÕES

Atualize o repositório local com as alterações do GitHub:

```bash
# Configurar Git para permitir este diretório
sudo git config --global --add safe.directory /var/www/sistema-tickets-ti

# Fazer fetch das alterações
git fetch origin

# Fazer pull da branch feature/passwordless-otp
git pull origin feature/passwordless-otp
```

**Verificar se o pull foi bem-sucedido:**
```bash
git log --oneline -5
# Deve mostrar os commits mais recentes
```

---

## 🔨 PASSO 5: REINICIAR O BACKEND

O backend precisa ser reiniciado para carregar as novas alterações:

```bash
# Reiniciar o serviço do backend
sudo systemctl restart tickets-backend

# Verificar se o serviço está rodando
sudo systemctl status tickets-backend
```

**Esperado:**
```
● tickets-backend.service - Sistema de Tickets TI Backend
   Loaded: loaded (/etc/systemd/system/tickets-backend.service; enabled; vendor preset: enabled)
   Active: active (running) since ...
```

---

## 📊 PASSO 6: VERIFICAR LOGS DO BACKEND

Verifique se o backend iniciou sem erros:

```bash
# Ver últimos 50 linhas dos logs
sudo journalctl -u tickets-backend -n 50

# Ver logs em tempo real (Ctrl+C para sair)
sudo journalctl -u tickets-backend -f
```

**Procure por:**
- ✅ "Application startup complete"
- ✅ "Uvicorn running on 0.0.0.0:8000"
- ❌ Evite erros como "ModuleNotFoundError", "ImportError", etc.

---

## 🧪 PASSO 7: TESTAR O BACKEND

Teste se o backend está respondendo corretamente:

```bash
# Teste 1: Health check
curl http://127.0.0.1:8000/

# Esperado:
# {"message":"Bem-vindo ao Sistema de Tickets TI","version":"1.0.0","docs":"/docs"}

# Teste 2: Request OTP
curl -X POST http://127.0.0.1:8000/api/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa.local"}'

# Esperado:
# {"message":"Código enviado para seu email","expires_in":480}
# ou
# {"detail":"Email não cadastrado no sistema"}
```

---

## 📧 PASSO 8: VERIFICAR ENVIO DE EMAIL

Teste se o email está sendo enviado corretamente:

```bash
# Solicitar OTP para um email válido
curl -X POST http://127.0.0.1:8000/api/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"seu-email@empresa.com"}'
```

**Verificar:**
- ✅ Resposta HTTP 200 ou 404
- ✅ Email recebido na caixa de entrada
- ✅ Email contém código OTP
- ✅ Email tem template profissional

---

## 🌐 PASSO 9: TESTAR NO NAVEGADOR

Acesse o sistema no navegador:

```
https://ticket.algti.com.br/otp-login
```

**Verificar:**
- ✅ Página carrega sem erros
- ✅ Campo de email aparece
- ✅ Botão "Enviar Código" funciona
- ✅ Após enviar, muda para tela de código
- ✅ Timer começa em 8:00

---

## ✅ PASSO 10: EXECUTAR TESTES COMPLETOS

Execute os testes documentados:

```bash
# Opção 1: Testes manuais (seguir checklist)
# Ver: PLANO_TESTES_FASE3.md

# Opção 2: Testes com CURL (rápido)
curl -X POST https://ticket.algti.com.br/api/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@empresa.com"}'

# Opção 3: Testes com Python (automático)
# Ver: TESTES_AUTOMATIZADOS.md
```

---

## 🎯 RESUMO DOS COMANDOS

### Deploy Rápido (Copiar e Colar)

```bash
# 1. Conectar na VPS
ssh root@srv1049200.hstgr.cloud

# 2. Navegar para o projeto
cd /var/www/sistema-tickets-ti

# 3. Configurar Git
sudo git config --global --add safe.directory /var/www/sistema-tickets-ti

# 4. Fazer pull das alterações
git fetch origin
git pull origin feature/passwordless-otp

# 5. Reiniciar backend
sudo systemctl restart tickets-backend

# 6. Verificar status
sudo systemctl status tickets-backend

# 7. Ver logs
sudo journalctl -u tickets-backend -n 50

# 8. Testar backend
curl http://127.0.0.1:8000/

# 9. Testar OTP
curl -X POST http://127.0.0.1:8000/api/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa.local"}'
```

---

## 🔄 COMO ATUALIZAR O SISTEMA NA VPS (DEPOIS DO DEPLOY)

Depois que o deploy inicial for feito, sempre que houver novas alterações, siga este processo:

### Atualização Padrão (Sem Mudanças no Banco)

```bash
# 1. Conectar na VPS
ssh root@srv1049200.hstgr.cloud

# 2. Navegar para o projeto
cd /var/www/sistema-tickets-ti

# 3. Fazer pull das alterações
git pull origin feature/passwordless-otp

# 4. Reiniciar backend
sudo systemctl restart tickets-backend

# 5. Verificar status
sudo systemctl status tickets-backend
```

**Tempo estimado:** 1-2 minutos

---

### Atualização com Mudanças no Frontend

```bash
# 1. Conectar na VPS
ssh root@srv1049200.hstgr.cloud

# 2. Navegar para o projeto
cd /var/www/sistema-tickets-ti

# 3. Fazer pull das alterações
git pull origin feature/passwordless-otp

# 4. Fazer build do frontend
cd frontend
npm run build

# 5. Voltar para o diretório raiz
cd ..

# 6. Reiniciar backend (se houver mudanças)
sudo systemctl restart tickets-backend

# 7. Recarregar Nginx (para servir novo build)
sudo systemctl reload nginx

# 8. Verificar status
sudo systemctl status tickets-backend
sudo systemctl status nginx
```

**Tempo estimado:** 3-5 minutos

---

### Atualização com Mudanças no Banco

```bash
# 1. Conectar na VPS
ssh root@srv1049200.hstgr.cloud

# 2. Navegar para o projeto
cd /var/www/sistema-tickets-ti

# 3. Fazer pull das alterações
git pull origin feature/passwordless-otp

# 4. Fazer backup do banco (IMPORTANTE!)
cp backend/tickets.db backend/tickets.db.backup.$(date +%Y%m%d_%H%M%S)

# 5. Aplicar migrações (se houver)
cd backend
alembic upgrade head

# 6. Voltar para o diretório raiz
cd ..

# 7. Reiniciar backend
sudo systemctl restart tickets-backend

# 8. Verificar status
sudo systemctl status tickets-backend

# 9. Verificar logs
sudo journalctl -u tickets-backend -n 50
```

**Tempo estimado:** 2-3 minutos

---

### Atualização Completa (Backend + Frontend + Banco)

```bash
# 1. Conectar na VPS
ssh root@srv1049200.hstgr.cloud

# 2. Navegar para o projeto
cd /var/www/sistema-tickets-ti

# 3. Fazer pull das alterações
git pull origin feature/passwordless-otp

# 4. Fazer backup do banco
cp backend/tickets.db backend/tickets.db.backup.$(date +%Y%m%d_%H%M%S)

# 5. Aplicar migrações
cd backend
alembic upgrade head
cd ..

# 6. Fazer build do frontend
cd frontend
npm run build
cd ..

# 7. Reiniciar backend
sudo systemctl restart tickets-backend

# 8. Recarregar Nginx
sudo systemctl reload nginx

# 9. Verificar status
sudo systemctl status tickets-backend
sudo systemctl status nginx

# 10. Ver logs
sudo journalctl -u tickets-backend -n 50
```

**Tempo estimado:** 5-10 minutos

---

## 🆘 TROUBLESHOOTING

### Problema: Backend não inicia

```bash
# Ver logs detalhados
sudo journalctl -u tickets-backend -n 100

# Tentar iniciar manualmente para ver erro
cd /var/www/sistema-tickets-ti/backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Problema: Erro de permissões

```bash
# Ajustar permissões
sudo chown -R www-data:www-data /var/www/sistema-tickets-ti
sudo chmod -R 755 /var/www/sistema-tickets-ti
```

### Problema: Porta 8000 já está em uso

```bash
# Ver qual processo está usando a porta
sudo lsof -i :8000

# Matar o processo (se necessário)
sudo kill -9 <PID>

# Reiniciar backend
sudo systemctl restart tickets-backend
```

### Problema: Email não está sendo enviado

```bash
# Verificar configurações SMTP
grep -r "SMTP" /var/www/sistema-tickets-ti/backend/.env

# Testar conexão SMTP
python3 -c "
import smtplib
server = smtplib.SMTP('seu-servidor-smtp.com', 587)
server.starttls()
server.login('seu-usuario', 'sua-senha')
print('SMTP OK')
"
```

---

## 📊 CHECKLIST DE DEPLOY

- [ ] Alterações commitadas no Git
- [ ] Push realizado para GitHub
- [ ] Conectado na VPS via SSH
- [ ] Git pull executado com sucesso
- [ ] Backend reiniciado
- [ ] Logs verificados (sem erros)
- [ ] Health check respondendo
- [ ] OTP request funcionando
- [ ] Email sendo enviado
- [ ] Frontend carregando
- [ ] Login funcionando
- [ ] Testes passando

---

## 📞 RESUMO

### Deploy Inicial
1. Push para GitHub
2. SSH na VPS
3. Git pull
4. Reiniciar backend
5. Verificar logs
6. Testar endpoints

### Atualizações Futuras
- **Sem mudanças no banco:** `git pull` + `systemctl restart`
- **Com mudanças no frontend:** Adicionar `npm run build`
- **Com mudanças no banco:** Adicionar `alembic upgrade head`
- **Completa:** Tudo junto

---

**Status:** ✅ **PRONTO PARA DEPLOY**
**Data:** 27 de Agosto de 2026
**VPS:** srv1049200.hstgr.cloud
**Projeto:** /var/www/sistema-tickets-ti
**Branch:** feature/passwordless-otp
