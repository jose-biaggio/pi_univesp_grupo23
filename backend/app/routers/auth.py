from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.auth import TokenResponse, UsuarioResponse
from app.security import create_access_token, get_current_user, verify_password

router = APIRouter(prefix="/api/auth", tags=["Autenticação"])


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Realizar login e obter token JWT",
    description="Autentica o usuário e emite um token JWT de acesso. Suporta payload JSON e formulário OAuth2.",
)
async def login(
    request: Request,
    db: Session = Depends(get_db),
):
    content_type = request.headers.get("content-type", "")
    username = None
    password = None

    if "application/json" in content_type:
        try:
            body = await request.json()
            username = body.get("usuario") or body.get("username")
            password = body.get("senha") or body.get("password")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="JSON inválido no corpo da requisição",
            )
    else:
        form = await request.form()
        username = form.get("username") or form.get("usuario")
        password = form.get("password") or form.get("senha")

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Campos obrigatórios: usuário e senha",
        )

    user = db.query(Usuario).filter(Usuario.usuario == username).first()

    if not user or not verify_password(password, user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha inválidos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso bloqueado: usuário inativo",
        )

    access_token = create_access_token(data={"sub": user.usuario})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        mensagem="Login realizado com sucesso",
        usuario=UsuarioResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UsuarioResponse,
    summary="Obter dados do usuário logado via JWT",
    description="Retorna os dados cadastrais do usuário autenticado a partir do token Bearer JWT.",
)
def get_me(current_user: Usuario = Depends(get_current_user)):
    return current_user