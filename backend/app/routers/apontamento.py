from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.apontamento import ApontamentoCreate, ApontamentoResponse
from app.security import get_current_user
from app.crud import apontamento as crud_apontamento
from app.crud import ordem as crud_ordem

router = APIRouter(prefix="/api/apontamentos", tags=["apontamentos"])


@router.post(
    "/",
    response_model=ApontamentoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar novo apontamento de manutenção",
)
def criar_apontamento(
    apontamento_in: ApontamentoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    ordem_existente = crud_ordem.obter_ordem_por_id(db, apontamento_in.ordem_id)
    if not ordem_existente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ordem de manutenção não encontrada.",
        )

    return crud_apontamento.criar_apontamento(
        db=db,
        apontamento_in=apontamento_in,
        usuario_id=current_user.id,
    )


@router.get(
    "/",
    response_model=list[ApontamentoResponse],
    summary="Listar apontamentos de manutenção",
)
def listar_apontamentos(
    ordem_id: Optional[int] = Query(None, description="Filtrar por ID da ordem"),
    usuario_id: Optional[int] = Query(None, description="Filtrar por ID do usuário"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return crud_apontamento.listar_apontamentos(
        db=db,
        skip=skip,
        limit=limit,
        ordem_id=ordem_id,
        usuario_id=usuario_id,
    )


@router.get(
    "/{apontamento_id}",
    response_model=ApontamentoResponse,
    summary="Obter detalhes de um apontamento",
)
def obter_apontamento(
    apontamento_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    apontamento = crud_apontamento.obter_apontamento_por_id(db, apontamento_id)
    if not apontamento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Apontamento não encontrado.",
        )
    return apontamento


@router.delete(
    "/{apontamento_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir um apontamento de manutenção",
)
def excluir_apontamento(
    apontamento_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    apontamento = crud_apontamento.obter_apontamento_por_id(db, apontamento_id)
    if not apontamento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Apontamento não encontrado.",
        )
    crud_apontamento.excluir_apontamento(db, apontamento)
    return None
