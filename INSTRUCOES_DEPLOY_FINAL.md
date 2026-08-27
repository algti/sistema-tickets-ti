# 🚀 INSTRUÇÕES FINAIS DE DEPLOY - PRONTO PARA EXECUTAR!

## ✅ STATUS ATUAL

- ✅ **Código:** Pronto na branch `feature/passwordless-otp`
- ✅ **GitHub:** Push realizado com sucesso
- ✅ **Documentação:** Completa
- ✅ **Testes:** Documentados
- ✅ **Email:** Integrado

---

## 🎯 PRÓXIMOS PASSOS

### PASSO 1: Conectar na VPS

```bash
ssh root@srv1049200.hstgr.cloud
```

Você será solicitado a inserir a senha da VPS.

---

### PASSO 2: Executar Deploy (Copiar e Colar)

Após conectar na VPS, execute este bloco de comandos:

```bash
# Navegar para o projeto
cd /var/www/sistema-tickets-ti

# Configurar Git
sudo git config --global --add safe.directory /var/www/sistema-tickets-ti

# Fazer pull das alterações
git fetch origin
git pull origin feature/passwordless-otp

# Reiniciar backend
sudo systemctl restart tickets-backend

# Verificar status
sudo systemctl status tickets-backend

# Ver logs (últimas 50 linhas)
sudo journalctl -u tickets-backend -n 50
```

---

### PASSO 3: Testar o Deploy

Após o deploy, teste se está funcionando:

```bash
# Teste 1: Health check
curl http://127.0.0.1:8000/

# Teste 2: Request OTP
curl -X POST http://127.0.0.1:8000/api/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa.local"}'
```

**Esperado:**
- Teste 1: Resposta JSON com mensagem de boas-vindas
- Teste 2: Resposta 200 com "Código enviado para seu email"

---

### PASSO 4: Acessar no Navegador

Abra o navegador e acesse:

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

## 📧 TESTAR ENVIO DE EMAIL

1. Na página `/otp-login`, insira um email válido
2. Clique "Enviar Código"
3. Verifique a caixa de entrada do email
4. Você deve receber um email com:
   - Código de 6 dígitos em destaque
   - Tempo de expiração (8 minutos)
   - Avisos de segurança
   - Branding ALG TI

---

## 🔄 COMO ATUALIZAR O SISTEMA DEPOIS

Depois que o deploy inicial for feito, sempre que houver novas alterações, use um destes comandos:

### Atualização Simples (Sem mudanças no banco ou frontend)

```bash
ssh root@srv1049200.hstgr.cloud
cd /var/www/sistema-tickets-ti
git pull origin feature/passwordless-otp
sudo systemctl restart tickets-backend
sudo systemctl status tickets-backend
```

**Tempo:** 1-2 minutos

---

### Atualização com Mudanças no Frontend

```bash
ssh root@srv1049200.hstgr.cloud
cd /var/www/sistema-tickets-ti
git pull origin feature/passwordless-otp
cd frontend
npm run build
cd ..
sudo systemctl restart tickets-backend
sudo systemctl reload nginx
sudo systemctl status tickets-backend
```

**Tempo:** 3-5 minutos

---

### Atualização com Mudanças no Banco

```bash
ssh root@srv1049200.hstgr.cloud
cd /var/www/sistema-tickets-ti

# Fazer backup do banco
cp backend/tickets.db backend/tickets.db.backup.$(date +%Y%m%d_%H%M%S)

# Fazer pull
git pull origin feature/passwordless-otp

# Aplicar migrações
cd backend
alembic upgrade head
cd ..

# Reiniciar backend
sudo systemctl restart tickets-backend
sudo systemctl status tickets-backend
```

**Tempo:** 2-3 minutos

---

## 🆘 SE ALGO DER ERRADO

### Backend não inicia

```bash
# Ver logs detalhados
sudo journalctl -u tickets-backend -n 100

# Se precisar reiniciar manualmente
sudo systemctl restart tickets-backend
```

### Erro de permissões

```bash
# Ajustar permissões
sudo chown -R www-data:www-data /var/www/sistema-tickets-ti
sudo chmod -R 755 /var/www/sistema-tickets-ti
```

### Email não está sendo enviado

Verifique se as configurações SMTP estão corretas no `.env`:

```bash
grep -r "SMTP" /var/www/sistema-tickets-ti/backend/.env
```

---

## 📊 CHECKLIST FINAL

Antes de considerar o deploy concluído, verifique:

- [ ] SSH conectado na VPS
- [ ] Git pull executado com sucesso
- [ ] Backend reiniciado sem erros
- [ ] Health check respondendo (curl http://127.0.0.1:8000/)
- [ ] OTP request funcionando (curl POST /auth/request-otp)
- [ ] Frontend carregando (https://ticket.algti.com.br/otp-login)
- [ ] Email sendo enviado corretamente
- [ ] Login funcionando com código OTP
- [ ] Auditoria registrando eventos

---

## 📝 DOCUMENTAÇÃO DISPONÍVEL

Todos estes documentos estão no repositório:

1. **DEPLOY_VPS_FASE4.md** - Guia completo de deploy
2. **PLANO_TESTES_FASE3.md** - 60+ testes manuais
3. **TESTES_AUTOMATIZADOS.md** - Scripts de testes
4. **INTEGRACAO_EMAIL_OTP_CONCLUIDA.md** - Detalhes da integração
5. **RESUMO_FASE3_COMPLETA.md** - Resumo executivo

---

## 🎯 RESUMO

### O que foi implementado:

✅ **Backend OTP** - Geração, validação, expiração, limite de tentativas
✅ **Frontend OTP** - UI moderna, dark theme, validações
✅ **Email OTP** - Template profissional, integrado com SMTP
✅ **Testes** - 60+ testes documentados e scripts prontos
✅ **Auditoria** - Todos os eventos registrados
✅ **Segurança** - Todas as proteções implementadas

### Próximas ações:

1. Conectar na VPS
2. Executar comandos de deploy
3. Testar endpoints
4. Acessar no navegador
5. Testar envio de email
6. Executar testes

---

## 📞 SUPORTE

Se tiver dúvidas durante o deploy:

1. Verifique os logs: `sudo journalctl -u tickets-backend -n 50`
2. Consulte DEPLOY_VPS_FASE4.md para troubleshooting
3. Verifique se o Git pull foi bem-sucedido
4. Confirme que o backend está rodando

---

**Status:** ✅ **PRONTO PARA DEPLOY**
**Branch:** feature/passwordless-otp
**VPS:** srv1049200.hstgr.cloud
**Projeto:** /var/www/sistema-tickets-ti
**Data:** 27 de Agosto de 2026

---

## 🚀 COMEÇAR AGORA!

```bash
# Copie e cole este comando para conectar na VPS:
ssh root@srv1049200.hstgr.cloud
```

Depois execute os comandos de deploy listados acima.

**Boa sorte! 🎉**
