from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from app.api.api_v1.api import api_router
from app.core.config import settings
import logging
import os
from app.core.database import engine
from app.models import models
from app.websocket.manager import manager

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Middleware removed - was consuming request body and preventing endpoint execution

# CORS middleware - Explicit configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001", 
        "http://127.0.0.1:3001",
        "https://ticket.algti.com.br",
        "https://ticket.algti.com",
        "http://ticket.algti.com.br",
        "http://ticket.algti.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
    ],
    expose_headers=["*"],
)

# Mount static files for uploads
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include API router
from fastapi.exceptions import RequestValidationError

logger = logging.getLogger(__name__)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Loga apenas o essencial (método, URL e os campos que falharam a
    # validação) - nunca headers ou corpo da requisição, que podem conter
    # dados sensíveis (ex: Authorization, senhas).
    error_locations = [error.get("loc") for error in exc.errors()]
    logger.warning(
        "422 Validation error: %s %s - campos inválidos: %s",
        request.method, request.url.path, error_locations
    )
    
    # Detalhes completos (incluindo valores de input) só em modo debug local
    if settings.DEBUG:
        logger.info("Detalhes completos da validação: %s", exc.errors())
    
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "message": f"Bem-vindo ao {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": settings.APP_NAME}
