#!/usr/bin/env python3
"""
Script para testar especificamente a API /tickets/ que a página de tickets usa
"""
import requests
import json

def test_tickets_api():
    """Testa a API /tickets/ com autenticação admin"""
    print("🚀 Testando API /tickets/ para admin...\n")
    
    # 1. Fazer login como admin
    print("1️⃣ Fazendo login como admin...")
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        login_response = requests.post(
            "http://127.0.0.1:8000/api/v1/auth/login",
            json=login_data
        )
        
        if login_response.status_code != 200:
            print(f"❌ Erro no login: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            return
            
        token_data = login_response.json()
        access_token = token_data["access_token"]
        print(f"✅ Login realizado com sucesso")
        print(f"Token: {access_token[:50]}...")
        
    except Exception as e:
        print(f"❌ Erro na requisição de login: {e}")
        return
    
    # 2. Testar API /tickets/ 
    print(f"\n2️⃣ Testando API /tickets/...")
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # Simular exatamente os parâmetros que o frontend envia
    params = {
        "status": "",
        "priority": "", 
        "search": "",
        "_t": "1234567890"  # cache busting
    }
    
    try:
        tickets_response = requests.get(
            "http://127.0.0.1:8000/api/v1/tickets/",
            headers=headers,
            params=params
        )
        
        print(f"Status Code: {tickets_response.status_code}")
        
        if tickets_response.status_code != 200:
            print(f"❌ Erro na API tickets: {tickets_response.status_code}")
            print(f"Response: {tickets_response.text}")
            return
            
        tickets_data = tickets_response.json()
        print(f"✅ API /tickets/ funcionou!")
        print(f"Total de tickets retornados: {len(tickets_data)}")
        
        if tickets_data:
            print(f"\n📋 Tickets encontrados:")
            for ticket in tickets_data:
                print(f"  - ID: {ticket['id']} | {ticket['title']} | Status: {ticket['status']}")
        else:
            print(f"❌ Nenhum ticket retornado para admin!")
            
    except Exception as e:
        print(f"❌ Erro na requisição de tickets: {e}")
        return
    
    # 3. Testar API /dashboard/stats para comparação
    print(f"\n3️⃣ Testando API /dashboard/stats para comparação...")
    
    try:
        dashboard_response = requests.get(
            "http://127.0.0.1:8000/api/v1/dashboard/stats",
            headers=headers
        )
        
        print(f"Dashboard Status Code: {dashboard_response.status_code}")
        
        if dashboard_response.status_code != 200:
            print(f"❌ Erro na API dashboard: {dashboard_response.status_code}")
            print(f"Response: {dashboard_response.text}")
        else:
            dashboard_data = dashboard_response.json()
            print(f"✅ API /dashboard/stats funcionou!")
            print(f"Total tickets no dashboard: {dashboard_data.get('total_tickets', 0)}")
            
    except Exception as e:
        print(f"❌ Erro na requisição de dashboard: {e}")

if __name__ == "__main__":
    test_tickets_api()
