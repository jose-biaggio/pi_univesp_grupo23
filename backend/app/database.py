import os
import logging
from urllib.parse import quote_plus
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Suporte a variáveis DB_* e às variáveis nativas do Railway (MYSQL*)
DB_HOST = os.getenv("DB_HOST") or os.getenv("MYSQLHOST") or "db"
DB_PORT = os.getenv("DB_PORT") or os.getenv("MYSQLPORT") or "3306"
DB_USER = os.getenv("DB_USER") or os.getenv("MYSQLUSER") or "sync_user"
DB_PASSWORD = os.getenv("DB_PASSWORD") or os.getenv("MYSQLPASSWORD") or "sync_password"
DB_NAME = os.getenv("DB_NAME") or os.getenv("MYSQLDATABASE") or "manutencao_sync"

encoded_password = quote_plus(DB_PASSWORD)
DEFAULT_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"

raw_url = (os.getenv("DATABASE_URL") or os.getenv("MYSQL_URL") or os.getenv("MYSQL_PRIVATE_URL") or "").strip()

# Se não foi informada, ou não possui protocolo (://), ou é template não resolvido (${{...}})
if not raw_url or "://" not in raw_url or raw_url.startswith("${{"):
    DATABASE_URL = DEFAULT_DATABASE_URL
else:
    DATABASE_URL = raw_url
    if DATABASE_URL.startswith("mysql://"):
        DATABASE_URL = DATABASE_URL.replace("mysql://", "mysql+pymysql://", 1)

    if "charset=" not in DATABASE_URL:
        separator = "&" if "?" in DATABASE_URL else "?"
        DATABASE_URL = f"{DATABASE_URL}{separator}charset=utf8mb4"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> dict:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "connected", "database": DB_NAME}
    except Exception as exc:
        logger.warning("Falha ao conectar com MariaDB: %s", exc)
        return {"status": "disconnected", "error": str(exc)}
