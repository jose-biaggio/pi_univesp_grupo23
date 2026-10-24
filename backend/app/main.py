import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

from app.routers import auth, ordem, apontamento

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

app.include_router(auth.router)
app.include_router(ordem.router)
app.include_router(apontamento.router)


@app.get("/api/", tags=["Root"])
def root():
    return {
        "app": "Manutenção Sync API",
        "version": "1.0.0",
        "status": "online",
        "message": "Servidor backend FastAPI",
    }


POSSIBLE_FRONTEND_PATHS = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend")),
    os.path.abspath("/app/frontend"),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend")),
]

frontend_dir = None
for p in POSSIBLE_FRONTEND_PATHS:
    if os.path.isdir(p):
        frontend_dir = p
        break

if frontend_dir:
    @app.get("/", include_in_schema=False)
    def root_redirect():
        return RedirectResponse(url="/pages/login.html")

    pages_dir = os.path.join(frontend_dir, "pages")
    if os.path.isdir(pages_dir):
        app.mount("/pages", StaticFiles(directory=pages_dir, html=True), name="pages")

    css_dir = os.path.join(frontend_dir, "css")
    if os.path.isdir(css_dir):
        app.mount("/css", StaticFiles(directory=css_dir), name="css")

    js_dir = os.path.join(frontend_dir, "js")
    if os.path.isdir(js_dir):
        app.mount("/js", StaticFiles(directory=js_dir), name="js")

    assets_dir = os.path.join(frontend_dir, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")