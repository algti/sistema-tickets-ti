from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from app.api.api_v1.api import api_router
from app.core.config import settings
import logging
import os
import json
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
        "http://127.0.0.1:3001"
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

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"=== 422 VALIDATION ERROR DETAILED ===")
    print(f"Request URL: {request.url}")
    print(f"Request method: {request.method}")
    print(f"Request headers: {dict(request.headers)}")
    
    # Try to get body from different sources
    body_content = None
    try:
        # Try to get body directly
        body_content = await request.body()
        if body_content:
            print(f"Request body (raw): {body_content}")
            try:
                parsed_body = json.loads(body_content)
                print(f"Request body (parsed): {parsed_body}")
            except:
                print(f"Request body (as string): {body_content.decode()}")
    except Exception as e:
        print(f"Could not read request body: {e}")
    
    # Log detailed validation errors
    print(f"Validation errors count: {len(exc.errors())}")
    print(f"Full exception details: {exc}")
    print(f"Exception type: {type(exc)}")
    
    for i, error in enumerate(exc.errors()):
        print(f"=== Error {i+1} Details ===")
        print(f"  Full error: {error}")
        if 'loc' in error:
            print(f"  Location: {error['loc']}")
        if 'msg' in error:
            print(f"  Message: {error['msg']}")
        if 'type' in error:
            print(f"  Type: {error['type']}")
        if 'input' in error:
            print(f"  Input: {error['input']}")
        if 'ctx' in error:
            print(f"  Context: {error['ctx']}")
    
    # Check if this is our profile endpoint
    if "/users/profile" in str(request.url):
        print(f"=== PROFILE ENDPOINT SPECIFIC DEBUG ===")
        print(f"Path params: {request.path_params}")
        print(f"Query params: {dict(request.query_params)}")
        
        # Try to understand what FastAPI is trying to validate
        try:
            from fastapi.routing import APIRoute
            for route in app.routes:
                if hasattr(route, 'path') and '/users/profile' in route.path:
                    print(f"Found matching route: {route.path}")
                    print(f"Route methods: {route.methods}")
                    if hasattr(route, 'dependant'):
                        print(f"Route dependant: {route.dependant}")
        except Exception as route_error:
            print(f"Error inspecting routes: {route_error}")
    
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
