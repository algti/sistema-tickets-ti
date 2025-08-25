#!/usr/bin/env python3
"""
Script para debugar o problema dos tickets não aparecendo
"""
import requests
import json

# Configurações
BASE_URL = "http://127.0.0.1:8000/api/v1"
ADMIN_CREDENTIALS = {
    "username": "admin",
    "password": "admin123"
}

def test_login():
    """Testa o login do administrador"""
    print("🔐 Testando login do administrador...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            data=ADMIN_CREDENTIALS,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            print(f"✅ Login bem-sucedido! Token: {token[:20]}...")
            return token
        else:
            print(f"❌ Erro no login: {response.status_code}")
            print(f"Resposta: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Erro na requisição de login: {e}")
        return None

def test_tickets(token):
    """Testa o endpoint de tickets com autenticação"""
    print("\n🎫 Testando endpoint de tickets...")
    
    if not token:
        print("❌ Sem token de autenticação")
        return
    
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(f"{BASE_URL}/tickets/", headers=headers)
        
        if response.status_code == 200:
            tickets = response.json()
            print(f"✅ Tickets recuperados com sucesso!")
            print(f"📊 Total de tickets: {len(tickets)}")
            
            for ticket in tickets:
                print(f"  - Ticket {ticket['id']}: {ticket['title']} (Status: {ticket['status']})")
                
        else:
            print(f"❌ Erro ao buscar tickets: {response.status_code}")
            print(f"Resposta: {response.text}")
            
    except Exception as e:
        print(f"❌ Erro na requisição de tickets: {e}")

def test_backend_health():
    """Testa se o backend está respondendo"""
    print("🏥 Testando saúde do backend...")
    
    try:
        response = requests.get(f"{BASE_URL.replace('/api/v1', '')}/docs")
        if response.status_code == 200:
            print("✅ Backend está respondendo")
        else:
            print(f"⚠️ Backend respondeu com status: {response.status_code}")
    except Exception as e:
        print(f"❌ Backend não está respondendo: {e}")

if __name__ == "__main__":
    print("🚀 Iniciando debug do sistema de tickets...\n")
    
    # Testa saúde do backend
    test_backend_health()
    
    # Testa login
    token = test_login()
    
    # Testa tickets
    test_tickets(token)
    
    print("\n✅ Debug concluído!")
