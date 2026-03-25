# 📧 Configurar Domínio @algti.com no Brevo

## 🎯 Objetivo

Configurar o domínio `algti.com` no Brevo para enviar emails como `tickets@algti.com` em vez de usar o domínio do Brevo.

## ⚠️ Importante

Atualmente, os emails serão enviados usando as credenciais do Brevo, mas o remetente pode aparecer como:
- **Sem configuração de domínio**: Emails podem ser marcados como spam ou mostrar "via brevo.com"
- **Com configuração de domínio**: Emails aparecem como vindos diretamente de `tickets@algti.com`

## 📋 Passo a Passo

### 1. Adicionar Remetente no Brevo

1. Acesse o painel do Brevo: https://app.brevo.com
2. Vá em **"Transacional"** → **"Configurações"** → **"Remetentes"**
3. Clique em **"Adicionar remetente"**
4. Preencha:
   - **Email**: `tickets@algti.com`
   - **Nome**: `Sistema de Tickets ALG TI`
5. Clique em **"Adicionar"**

### 2. Verificar o Email

O Brevo enviará um email de verificação para `tickets@algti.com`. Você precisa:
1. Acessar a caixa de entrada de `tickets@algti.com`
2. Abrir o email do Brevo
3. Clicar no link de verificação

### 3. Autenticar o Domínio (Recomendado)

Para melhor deliverability e evitar spam, configure SPF e DKIM:

#### **3.1. Acessar Configurações de Domínio**
1. No Brevo, vá em **"Transacional"** → **"Configurações"** → **"Domínios"**
2. Clique em **"Adicionar domínio"**
3. Digite: `algti.com`

#### **3.2. Obter Registros DNS**
O Brevo fornecerá registros DNS que você precisa adicionar. Exemplo:

**Registro SPF (TXT):**
```
Tipo: TXT
Nome: @
Valor: v=spf1 include:spf.brevo.com ~all
```

**Registro DKIM (TXT):**
```
Tipo: TXT
Nome: mail._domainkey
Valor: [valor fornecido pelo Brevo]
```

**Registro DMARC (TXT) - Opcional:**
```
Tipo: TXT
Nome: _dmarc
Valor: v=DMARC1; p=none; rua=mailto:contato@algti.com
```

#### **3.3. Adicionar Registros no seu Provedor DNS**

Você precisa adicionar esses registros no painel onde gerencia o DNS de `algti.com`:

**Se usar Cloudflare:**
1. Acesse https://dash.cloudflare.com
2. Selecione o domínio `algti.com`
3. Vá em **DNS** → **Records**
4. Adicione cada registro conforme fornecido pelo Brevo

**Se usar Registro.br:**
1. Acesse https://registro.br
2. Entre na gestão do domínio `algti.com`
3. Vá em **DNS** → **Editar Zona**
4. Adicione os registros TXT

**Se usar outro provedor:**
- Acesse o painel do seu provedor de DNS
- Procure por "Gerenciar DNS" ou "DNS Records"
- Adicione os registros TXT fornecidos

#### **3.4. Verificar Configuração**

Após adicionar os registros DNS:
1. Aguarde propagação (pode levar até 48h, mas geralmente 15-30 minutos)
2. No Brevo, clique em **"Verificar"** ao lado do domínio
3. Se tudo estiver correto, aparecerá ✅ **Verificado**

## ✅ Testar Configuração

Após configurar tudo:

1. **Teste de envio:**
   - Crie um ticket no sistema
   - Verifique se recebeu o email
   - Confira o remetente: deve aparecer `tickets@algti.com`

2. **Verificar cabeçalhos do email:**
   - Abra o email recebido
   - Veja os detalhes/cabeçalhos
   - Procure por `SPF: PASS` e `DKIM: PASS`

## 🚀 Aplicar na VPS (Após Configurar Domínio)

Depois de configurar o domínio no Brevo:

```bash
# 1. Fazer pull das alterações
cd /var/www/sistema-tickets-ti
git pull origin ALG_TICKETS

# 2. Editar .env com as credenciais do Brevo
cd backend
nano .env

# Adicione:
SMTP_SERVER=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USERNAME=a6066d001@smtp-brevo.com
SMTP_PASSWORD=0v7TVbOfEkF283Ap
SMTP_USE_TLS=true
SMTP_FROM_EMAIL=tickets@algti.com
SMTP_FROM_NAME=Sistema de Tickets ALG TI
ADMIN_NOTIFICATION_EMAIL=contato@algti.com
EMAIL_ENABLED=true

# 3. Reiniciar serviço
sudo systemctl restart tickets-backend
sudo systemctl status tickets-backend

# 4. Testar
# Crie um ticket e verifique se recebeu o email
```

## 📊 Monitoramento

### Ver estatísticas no Brevo:
1. Acesse o painel Brevo
2. Vá em **"Transacional"** → **"Estatísticas"**
3. Veja emails enviados, entregues, abertos, etc.

### Ver logs no servidor:
```bash
# Logs em tempo real
sudo journalctl -u tickets-backend -f | grep -i "email"

# Verificar erros de email
sudo journalctl -u tickets-backend | grep -i "failed to send email"
```

## 🔍 Troubleshooting

### Emails não chegam
- ✅ Verifique se o domínio está verificado no Brevo
- ✅ Verifique registros SPF e DKIM
- ✅ Confira se `EMAIL_ENABLED=true` no .env
- ✅ Veja os logs: `sudo journalctl -u tickets-backend -f`

### Emails vão para spam
- ✅ Configure SPF, DKIM e DMARC
- ✅ Verifique se o domínio está autenticado no Brevo
- ✅ Evite palavras como "grátis", "promoção" no assunto

### Limite de envio atingido
- ✅ Brevo gratuito: 300 emails/dia
- ✅ Verifique uso no painel Brevo
- ✅ Considere upgrade se necessário

## 💡 Dicas

1. **Comece simples**: Primeiro teste sem configurar domínio. Os emails funcionarão, mas podem mostrar "via brevo.com"
2. **Configure DNS depois**: Quando tiver tempo, configure SPF e DKIM para melhor deliverability
3. **Monitore uso**: Fique de olho nos 300 emails/dia do plano gratuito
4. **Backup Gmail**: Mantenha as credenciais do Gmail como backup no .env.example

## 📞 Suporte

- **Documentação Brevo**: https://help.brevo.com
- **Verificar DNS**: https://mxtoolbox.com/spf.aspx
- **Testar DKIM**: https://mxtoolbox.com/dkim.aspx
