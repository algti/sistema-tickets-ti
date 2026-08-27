# 🤖 TESTES AUTOMATIZADOS - FASE 3

## 📋 TESTES COM CURL (Backend)

### Setup Inicial
```bash
# Variáveis
API_URL="http://127.0.0.1:8000/api/v1"
TEST_EMAIL="test@example.com"
TEST_NAME="Test User"
TEST_DEPT="TI"
```

---

## 1️⃣ TESTES DE REQUEST OTP

### Teste 1.1: Request OTP - Email Válido
```bash
curl -X POST $API_URL/auth/request-otp \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}" \
  -w "\nStatus: %{http_code}\n"
```
**Esperado:** 200 ou 404 (se email não existe)

### Teste 1.2: Request OTP - Email Inválido
```bash
curl -X POST $API_URL/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email"}' \
  -w "\nStatus: %{http_code}\n"
```
**Esperado:** 422

### Teste 1.3: Request OTP - Email Vazio
```bash
curl -X POST $API_URL/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":""}' \
  -w "\nStatus: %{http_code}\n"
```
**Esperado:** 422

---

## 2️⃣ TESTES DE VERIFY OTP

### Teste 2.1: Verify OTP - Código Inválido
```bash
curl -X POST $API_URL/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"code\":\"000000\"}" \
  -w "\nStatus: %{http_code}\n"
```
**Esperado:** 400

### Teste 2.2: Verify OTP - Código com Letras
```bash
curl -X POST $API_URL/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"code\":\"ABCDEF\"}" \
  -w "\nStatus: %{http_code}\n"
```
**Esperado:** 422

### Teste 2.3: Verify OTP - Código Muito Curto
```bash
curl -X POST $API_URL/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"code\":\"12345\"}" \
  -w "\nStatus: %{http_code}\n"
```
**Esperado:** 422

### Teste 2.4: Verify OTP - Código Muito Longo
```bash
curl -X POST $API_URL/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"code\":\"1234567\"}" \
  -w "\nStatus: %{http_code}\n"
```
**Esperado:** 422

---

## 3️⃣ TESTES DE REGISTER

### Teste 3.1: Register - Dados Válidos
```bash
curl -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"newuser$(date +%s)@example.com\",\"full_name\":\"$TEST_NAME\",\"department\":\"$TEST_DEPT\"}" \
  -w "\nStatus: %{http_code}\n"
```
**Esperado:** 200

### Teste 3.2: Register - Email Inválido
```bash
curl -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"invalid-email\",\"full_name\":\"$TEST_NAME\",\"department\":\"$TEST_DEPT\"}" \
  -w "\nStatus: %{http_code}\n"
```
**Esperado:** 422

### Teste 3.3: Register - Nome Muito Curto
```bash
curl -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user@example.com\",\"full_name\":\"AB\",\"department\":\"$TEST_DEPT\"}" \
  -w "\nStatus: %{http_code}\n"
```
**Esperado:** 422

### Teste 3.4: Register - Email Duplicado
```bash
curl -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"existing@example.com\",\"full_name\":\"$TEST_NAME\",\"department\":\"$TEST_DEPT\"}" \
  -w "\nStatus: %{http_code}\n"
```
**Esperado:** 409

---

## 4️⃣ TESTES DE RESEND OTP

### Teste 4.1: Resend OTP - Email Válido
```bash
curl -X POST $API_URL/auth/resend-otp \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}" \
  -w "\nStatus: %{http_code}\n"
```
**Esperado:** 200

### Teste 4.2: Resend OTP - Email Inválido
```bash
curl -X POST $API_URL/auth/resend-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email"}' \
  -w "\nStatus: %{http_code}\n"
```
**Esperado:** 422

---

## 5️⃣ TESTES COM SCRIPT BASH

### Script: Teste Completo de Fluxo
```bash
#!/bin/bash

API_URL="http://127.0.0.1:8000/api/v1"
TEST_EMAIL="test_$(date +%s)@example.com"
TEST_NAME="Test User $(date +%s)"

echo "🧪 Iniciando testes..."
echo ""

# 1. Register
echo "1️⃣ Registrando novo usuário..."
REGISTER_RESPONSE=$(curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"full_name\":\"$TEST_NAME\",\"department\":\"TI\"}")

echo "Response: $REGISTER_RESPONSE"
echo ""

# 2. Request OTP
echo "2️⃣ Solicitando código OTP..."
OTP_RESPONSE=$(curl -s -X POST $API_URL/auth/request-otp \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}")

echo "Response: $OTP_RESPONSE"
echo ""

# 3. Verificar OTP no banco (se tiver acesso)
echo "3️⃣ Verificando código no banco..."
echo "SELECT code FROM login_otp WHERE email='$TEST_EMAIL' ORDER BY created_at DESC LIMIT 1;" | sqlite3 backend/tickets.db

echo ""
echo "✅ Testes concluídos!"
```

### Script: Teste de Carga
```bash
#!/bin/bash

API_URL="http://127.0.0.1:8000/api/v1"
NUM_REQUESTS=10

echo "🔥 Teste de Carga - $NUM_REQUESTS requisições simultâneas"
echo ""

for i in $(seq 1 $NUM_REQUESTS); do
  (
    EMAIL="load_test_$i@example.com"
    curl -s -X POST $API_URL/auth/request-otp \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$EMAIL\"}" > /dev/null
    echo "✅ Requisição $i concluída"
  ) &
done

wait
echo ""
echo "✅ Teste de carga concluído!"
```

---

## 6️⃣ TESTES COM POSTMAN

### Collection JSON
```json
{
  "info": {
    "name": "OTP Login Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Request OTP",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"test@example.com\"}"
        },
        "url": {
          "raw": "http://127.0.0.1:8000/api/v1/auth/request-otp",
          "protocol": "http",
          "host": ["127", "0", "0", "1"],
          "port": "8000",
          "path": ["api", "v1", "auth", "request-otp"]
        }
      }
    },
    {
      "name": "Verify OTP",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"test@example.com\",\"code\":\"123456\"}"
        },
        "url": {
          "raw": "http://127.0.0.1:8000/api/v1/auth/verify-otp",
          "protocol": "http",
          "host": ["127", "0", "0", "1"],
          "port": "8000",
          "path": ["api", "v1", "auth", "verify-otp"]
        }
      }
    },
    {
      "name": "Register",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"newuser@example.com\",\"full_name\":\"New User\",\"department\":\"TI\"}"
        },
        "url": {
          "raw": "http://127.0.0.1:8000/api/v1/auth/register",
          "protocol": "http",
          "host": ["127", "0", "0", "1"],
          "port": "8000",
          "path": ["api", "v1", "auth", "register"]
        }
      }
    }
  ]
}
```

---

## 7️⃣ TESTES COM PYTHON

### Script: Teste Completo
```python
import requests
import json
import time
from datetime import datetime

API_URL = "http://127.0.0.1:8000/api/v1"

class OTPTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_email = f"test_{int(time.time())}@example.com"
        self.results = []
    
    def test_request_otp(self):
        """Teste: Solicitar OTP"""
        print("🧪 Teste 1: Request OTP")
        response = self.session.post(
            f"{API_URL}/auth/request-otp",
            json={"email": self.test_email}
        )
        
        status = "✅ PASSOU" if response.status_code in [200, 404] else "❌ FALHOU"
        print(f"   Status: {response.status_code} {status}")
        self.results.append(("Request OTP", response.status_code, status))
        
        return response
    
    def test_verify_otp_invalid(self):
        """Teste: Verificar OTP com código inválido"""
        print("🧪 Teste 2: Verify OTP (inválido)")
        response = self.session.post(
            f"{API_URL}/auth/verify-otp",
            json={"email": self.test_email, "code": "000000"}
        )
        
        status = "✅ PASSOU" if response.status_code == 400 else "❌ FALHOU"
        print(f"   Status: {response.status_code} {status}")
        self.results.append(("Verify OTP Invalid", response.status_code, status))
    
    def test_register(self):
        """Teste: Registrar novo usuário"""
        print("🧪 Teste 3: Register")
        response = self.session.post(
            f"{API_URL}/auth/register",
            json={
                "email": f"newuser_{int(time.time())}@example.com",
                "full_name": "Test User",
                "department": "TI"
            }
        )
        
        status = "✅ PASSOU" if response.status_code == 200 else "❌ FALHOU"
        print(f"   Status: {response.status_code} {status}")
        self.results.append(("Register", response.status_code, status))
    
    def test_resend_otp(self):
        """Teste: Reenviar OTP"""
        print("🧪 Teste 4: Resend OTP")
        response = self.session.post(
            f"{API_URL}/auth/resend-otp",
            json={"email": self.test_email}
        )
        
        status = "✅ PASSOU" if response.status_code in [200, 404] else "❌ FALHOU"
        print(f"   Status: {response.status_code} {status}")
        self.results.append(("Resend OTP", response.status_code, status))
    
    def run_all_tests(self):
        """Executar todos os testes"""
        print("=" * 50)
        print("🚀 INICIANDO TESTES AUTOMATIZADOS")
        print("=" * 50)
        print()
        
        self.test_request_otp()
        print()
        self.test_verify_otp_invalid()
        print()
        self.test_register()
        print()
        self.test_resend_otp()
        print()
        
        self.print_summary()
    
    def print_summary(self):
        """Imprimir resumo dos testes"""
        print("=" * 50)
        print("📊 RESUMO DOS TESTES")
        print("=" * 50)
        
        passed = sum(1 for _, _, status in self.results if "PASSOU" in status)
        failed = sum(1 for _, _, status in self.results if "FALHOU" in status)
        
        for test_name, status_code, status in self.results:
            print(f"{status} {test_name}: {status_code}")
        
        print()
        print(f"Total: {len(self.results)} testes")
        print(f"Passou: {passed} ✅")
        print(f"Falhou: {failed} ❌")
        print()

if __name__ == "__main__":
    tester = OTPTester()
    tester.run_all_tests()
```

---

## 8️⃣ COMO EXECUTAR OS TESTES

### Opção 1: Testes com CURL
```bash
# Executar teste individual
curl -X POST http://127.0.0.1:8000/api/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Executar script bash
bash TESTES_BASH.sh
```

### Opção 2: Testes com Python
```bash
# Instalar requests
pip install requests

# Executar testes
python TESTES_PYTHON.py
```

### Opção 3: Testes com Postman
1. Importar collection JSON
2. Clicar em "Run" (Runner)
3. Executar testes

### Opção 4: Testes Manuais no Frontend
1. Abrir `http://localhost:3000/otp-login`
2. Seguir checklist em PLANO_TESTES_FASE3.md

---

## 📊 MÉTRICAS DE SUCESSO

| Métrica | Alvo | Status |
|---------|------|--------|
| Taxa de Sucesso | 100% | ⏳ |
| Tempo de Resposta | < 500ms | ⏳ |
| Cobertura de Testes | > 90% | ⏳ |
| Bugs Encontrados | 0 | ⏳ |

---

**Testes Automatizados - Fase 3**
**Data:** 27 de Agosto de 2026
**Status:** Pronto para Execução
