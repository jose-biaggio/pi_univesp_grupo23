import logging
from app.database import SessionLocal
from app.models.usuario import Usuario
from app.security import hash_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")


def seed_admin_user() -> None:
    """criar usuário admin."""
    db = SessionLocal()
    try:
        user = db.query(Usuario).filter(Usuario.usuario == "admin").first()
        if user:
            print("Usuário 'admin' já existe!")
            return

        admin = Usuario(
            nome="Administrador do Sistema",
            usuario="admin",
            email="admin@manutencaosync.com.br",
            senha_hash=hash_password("admin123"),
            perfil="ADMIN",
            ativo=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"Usuário admin '{admin.usuario}' (id={admin.id}) criado com sucesso!")
    except Exception as exc:
        db.rollback()
        print(f"Erro ao criar usuário admin: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin_user()
