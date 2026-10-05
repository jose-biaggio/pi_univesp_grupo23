from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import check_database_connection

app = FastAPI(
    title="Manutenção Sync API",
    description="API para gestão de ordens e apontamentos de manutenção - UNIVESP PI Grupo 23",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/", tags=["Root"])
def root():
    return {
        "app": "Manutenção Sync API",
        "version": "1.0.0",
        "status": "online",
        "message": "Servidor backend FastAPI",
    }


@app.get("/api/health", tags=["Health"])
def health_check():
    db_status = check_database_connection()
    return {
        "status": "ok",
        "api": "healthy",
        "database": db_status,
    }
