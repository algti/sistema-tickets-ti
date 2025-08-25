#!/bin/bash

echo "🚀 Iniciando Sistema de Tickets TI - Ambiente de Desenvolvimento"
echo

echo "📦 Verificando dependências..."
cd backend

if [ ! -d "venv" ]; then
    echo "Criando ambiente virtual Python..."
    python3 -m venv venv
fi

echo "Ativando ambiente virtual..."
source venv/bin/activate

echo "Instalando dependências Python..."
pip install -r requirements.txt

echo
echo "🗄️ Configurando banco de dados..."
if [ ! -f ".env" ]; then
    echo "Copiando arquivo de configuração..."
    cp .env.example .env
    echo "⚠️  IMPORTANTE: Configure o arquivo .env com suas credenciais do Active Directory"
fi

echo
echo "🌱 Executando seed do banco de dados..."
python -m app.utils.seed

echo
echo "🖥️ Iniciando backend (FastAPI)..."
gnome-terminal -- bash -c "uvicorn app.main:app --reload --host 0.0.0.0 --port 8000; exec bash" 2>/dev/null || \
xterm -e "uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" 2>/dev/null || \
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &

cd ../frontend
echo
echo "📱 Instalando dependências do frontend..."
if [ ! -d "node_modules" ]; then
    npm install
fi

echo
echo "🎨 Iniciando frontend (React)..."
gnome-terminal -- bash -c "npm start; exec bash" 2>/dev/null || \
xterm -e "npm start" 2>/dev/null || \
npm start &

echo
echo "✅ Sistema iniciado com sucesso!"
echo
echo "🌐 Acesse o sistema em:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   Documentação API: http://localhost:8000/docs"
echo
echo "👤 Credenciais de teste:"
echo "   Usuário: admin"
echo "   Senha: admin123"
echo

read -p "Pressione Enter para continuar..."
