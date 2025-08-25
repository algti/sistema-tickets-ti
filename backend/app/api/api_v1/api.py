from fastapi import APIRouter

from app.api.api_v1.endpoints import auth, tickets, users, categories, dashboard, settings, websocket, evaluations, reports

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(tickets.router, prefix="/tickets", tags=["tickets"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(websocket.router, prefix="/notifications", tags=["websocket"])
api_router.include_router(evaluations.router, prefix="/evaluations", tags=["evaluations"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
