@echo off
echo 🚀 Iniciando Sistema de Tickets TI - Ambiente de Desenvolvimento
echo.

echo 📦 Verificando dependências...
cd backend
if not exist "venv" (
    echo Criando ambiente virtual Python...
    python -m venv venv
)

echo Ativando ambiente virtual...
call venv\Scripts\activate.bat

echo Instalando dependências Python...
pip install -r requirements.txt

echo.
echo 🗄️ Configurando banco de dados...
if not exist ".env" (
    echo Copiando arquivo de configuração...
    copy .env.example .env
    echo ⚠️  IMPORTANTE: Configure o arquivo .env com suas credenciais do Active Directory
)

echo.
echo 🌱 Executando seed do banco de dados...
python -m app.utils.seed

echo.
echo 🖥️ Iniciando backend (FastAPI)...
start "Backend API" cmd /k "uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

cd ..\frontend
echo.
echo 📱 Instalando dependências do frontend...
if not exist "node_modules" (
    npm install
)

echo.
echo 🎨 Iniciando frontend (React)...
start "Frontend React" cmd /k "npm start"

echo.
echo ✅ Sistema iniciado com sucesso!
echo.
echo 🌐 Acesse o sistema em:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:8000
echo    Documentação API: http://localhost:8000/docs
echo.
echo 👤 Credenciais de teste:
echo    Usuário: admin
echo    Senha: admin123
echo.
pause
