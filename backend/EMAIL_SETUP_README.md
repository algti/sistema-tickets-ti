# 📧 Configuração de E-mail Transacional - Sistema de Tickets

## 📋 Visão Geral

O sistema agora possui **notificações por e-mail transacional** que enviam mensagens automáticas para:

- **Admin**: Recebe e-mail de **TODAS** as movimentações de tickets
- **Solicitantes**: Recebem e-mails apenas dos **seus próprios tickets**

## 🎯 Tipos de Notificações

### 1. **Ticket Criado**
- ✅ Admin recebe notificação de novo ticket
- ✅ Solicitante recebe confirmação de criação

### 2. **Ticket Atualizado**
- ✅ Admin recebe detalhes das alterações
- ✅ Solicitante recebe notificação das mudanças no seu ticket

### 3. **Status Alterado**
- ✅ Admin recebe notificação de mudança de status
- ✅ Solicitante recebe atualização do status do seu ticket

### 4. **Ticket Atribuído**
- ✅ Admin recebe notificação de atribuição
- ✅ Técnico atribuído recebe notificação
- ✅ Solicitante recebe informação de quem está responsável

### 5. **Novo Comentário**
- ✅ Admin recebe notificação de novo comentário
- ✅ Solicitante recebe notificação quando alguém comenta no seu ticket

## 🔧 Configuração

### Opção 1: Gmail (Recomendado para Testes)

1. **Criar Senha de App no Gmail:**
   - Acesse: https://myaccount.google.com/apppasswords
   - Crie uma senha de app para "Mail"
   - Copie a senha gerada (16 caracteres)

2. **Configurar .env:**
```bash
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=seu-email@gmail.com
SMTP_PASSWORD=xxxx-xxxx-xxxx-xxxx  # Senha de app gerada
SMTP_USE_TLS=true
SMTP_FROM_EMAIL=noreply@algti.com
SMTP_FROM_NAME=Sistema de Tickets ALG TI
ADMIN_NOTIFICATION_EMAIL=seu-email-admin@gmail.com
EMAIL_ENABLED=true
```

### Opção 2: SendGrid (Recomendado para Produção)

1. **Criar conta no SendGrid:**
   - Acesse: https://sendgrid.com
   - Crie uma conta gratuita (100 emails/dia)

2. **Criar API Key:**
   - Settings → API Keys → Create API Key
   - Permissões: Full Access
   - Copie a API Key

3. **Configurar .env:**
```bash
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # API Key
SMTP_USE_TLS=true
SMTP_FROM_EMAIL=noreply@algti.com
SMTP_FROM_NAME=Sistema de Tickets ALG TI
ADMIN_NOTIFICATION_EMAIL=admin@algti.com
EMAIL_ENABLED=true
```

### Opção 3: Mailgun

1. **Criar conta no Mailgun:**
   - Acesse: https://www.mailgun.com
   - Plano gratuito: 5.000 emails/mês

2. **Obter credenciais SMTP:**
   - Domain Settings → SMTP Credentials

3. **Configurar .env:**
```bash
SMTP_SERVER=smtp.mailgun.org
SMTP_PORT=587
SMTP_USERNAME=postmaster@seu-dominio.mailgun.org
SMTP_PASSWORD=sua-senha-smtp
SMTP_USE_TLS=true
SMTP_FROM_EMAIL=noreply@algti.com
SMTP_FROM_NAME=Sistema de Tickets ALG TI
ADMIN_NOTIFICATION_EMAIL=admin@algti.com
EMAIL_ENABLED=true
```

### Opção 4: Servidor SMTP Próprio

```bash
SMTP_SERVER=smtp.seuservidor.com
SMTP_PORT=587
SMTP_USERNAME=usuario@seuservidor.com
SMTP_PASSWORD=sua-senha
SMTP_USE_TLS=true
SMTP_FROM_EMAIL=noreply@algti.com
SMTP_FROM_NAME=Sistema de Tickets ALG TI
ADMIN_NOTIFICATION_EMAIL=admin@algti.com
EMAIL_ENABLED=true
```

## 🚀 Aplicar na VPS

### 1. Fazer Pull das Alterações

```bash
cd /var/www/sistema-tickets-ti
git pull origin ALG_TICKETS
```

### 2. Configurar Variáveis de Ambiente

```bash
cd /var/www/sistema-tickets-ti/backend
nano .env
```

Adicione as configurações de e-mail conforme uma das opções acima.

### 3. Instalar Dependências (se necessário)

O serviço de e-mail usa apenas bibliotecas padrão do Python, mas verifique:

```bash
# Não é necessário instalar nada adicional
# O módulo smtplib já vem com Python
```

### 4. Reiniciar o Serviço

```bash
sudo systemctl restart tickets-backend
sudo systemctl status tickets-backend
```

### 5. Verificar Logs

```bash
sudo journalctl -u tickets-backend -f
```

## ✅ Testar Funcionamento

### Teste 1: Criar Ticket
1. Crie um novo ticket no sistema
2. Verifique se você recebeu 2 emails:
   - Um para o admin
   - Um para o solicitante (você)

### Teste 2: Comentar em Ticket
1. Adicione um comentário em um ticket
2. Verifique se recebeu notificação por email

### Teste 3: Alterar Status
1. Mude o status de um ticket
2. Verifique se recebeu notificação da mudança

## 🎨 Templates de Email

Os emails são enviados em **HTML profissional** com:

- ✅ Design responsivo
- ✅ Cores da marca ALG TI (cyan/teal)
- ✅ Botão para acessar o ticket diretamente
- ✅ Informações formatadas e organizadas
- ✅ Prioridades com cores (Alta=Vermelho, Média=Laranja, Baixa=Verde)

## 🔒 Segurança

### Boas Práticas:

1. **Nunca commitar credenciais no Git**
   - O arquivo `.env` está no `.gitignore`
   - Use `.env.example` como referência

2. **Usar Senhas de App (Gmail)**
   - Não use sua senha principal do Gmail
   - Use senhas de app específicas

3. **Limitar Permissões (SendGrid/Mailgun)**
   - Use API Keys com permissões mínimas necessárias

4. **Monitorar Uso**
   - Verifique limites de envio do seu provedor
   - Configure alertas de quota

## 🛠️ Desabilitar Emails (Temporariamente)

Se precisar desabilitar o envio de emails sem remover as configurações:

```bash
# No arquivo .env
EMAIL_ENABLED=false
```

Depois reinicie o serviço:
```bash
sudo systemctl restart tickets-backend
```

## 📊 Monitoramento

### Ver Logs de Email

```bash
# Logs em tempo real
sudo journalctl -u tickets-backend -f | grep -i "email"

# Logs de erros de email
sudo journalctl -u tickets-backend | grep -i "failed to send email"
```

### Verificar Configuração

Você pode verificar se as configurações estão corretas olhando os logs ao iniciar o serviço:

```bash
sudo systemctl restart tickets-backend
sudo journalctl -u tickets-backend -n 50
```

## 🐛 Troubleshooting

### Problema: Emails não estão sendo enviados

**Solução:**
1. Verifique se `EMAIL_ENABLED=true` no `.env`
2. Verifique credenciais SMTP
3. Verifique logs: `sudo journalctl -u tickets-backend -f`
4. Teste conexão SMTP manualmente

### Problema: Erro de autenticação SMTP

**Solução:**
1. Gmail: Use senha de app, não senha normal
2. Verifique se 2FA está ativado (necessário para senhas de app)
3. Verifique se o servidor SMTP está correto

### Problema: Emails vão para spam

**Solução:**
1. Configure SPF, DKIM e DMARC no seu domínio
2. Use um serviço profissional (SendGrid, Mailgun)
3. Verifique se o email "From" está correto

### Problema: Limite de envio atingido

**Solução:**
1. Gmail: 500 emails/dia (conta gratuita)
2. SendGrid: 100 emails/dia (plano gratuito)
3. Mailgun: 5.000 emails/mês (plano gratuito)
4. Considere upgrade do plano se necessário

## 📝 Exemplo de Email Recebido

```
De: Sistema de Tickets ALG TI <noreply@algti.com>
Para: admin@algti.com
Assunto: [Novo Ticket #123] Problema com impressora

Novo Ticket Criado

Um novo ticket foi aberto no sistema por João Silva.

┌─────────────────────────────────────┐
│ Ticket: #123                        │
│ Título: Problema com impressora     │
│ Prioridade: ALTA                    │
│ Categoria: Hardware                 │
│ Descrição:                          │
│ A impressora não está funcionando   │
└─────────────────────────────────────┘

[Ver Ticket] → https://ticket.algti.com/tickets/123

Você receberá atualizações sobre este ticket por email.
```

## 🎯 Próximos Passos

Após configurar o email:

1. ✅ Teste criando um ticket
2. ✅ Teste comentando em um ticket
3. ✅ Teste alterando status
4. ✅ Verifique se admin recebe todos os emails
5. ✅ Verifique se usuários recebem apenas seus tickets

## 💡 Dicas

- **Gmail**: Ideal para testes e desenvolvimento
- **SendGrid/Mailgun**: Ideal para produção
- **SMTP Próprio**: Se você já tem servidor de email corporativo

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Verifique os logs do sistema
2. Teste as credenciais SMTP manualmente
3. Verifique se o firewall permite conexões SMTP (porta 587)
