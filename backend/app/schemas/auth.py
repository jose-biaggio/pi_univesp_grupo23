from typing import Optional
from pydantic import BaseModel, ConfigDict


class LoginRequest(BaseModel):
    usuario: str
    senha: str


class UsuarioResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    usuario: str
    email: str
    perfil: str
    ativo: bool


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    mensagem: str = "Login realizado com sucesso"
    usuario: UsuarioResponse


class TokenData(BaseModel):
    sub: Optional[str] = None
