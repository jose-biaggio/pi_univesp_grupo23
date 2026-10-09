from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.ordem import OrdemCreate, OrdemResponse, OrdemUpdate
from app.security import get_current_user
from app.crud import ordem as crud_ordem

router = APIRouter(prefix="/api/ordens", tags=["ordens"])


@router.post(
    "/",
    response_model=OrdemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cadastrar nova ordem de manutenção",
)
def criar_ordem(
    ordem_in: OrdemCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    ordem_existente = crud_ordem.obter_ordem_por_numero(db, ordem_in.numero_ordem)
    if ordem_existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ordem de manutenção com número '{ordem_in.numero_ordem}' já existe.",
        )
    print(">>> DEBUG:", db)
    print(">>> DEBUG:", ordem_in)
    print(">>> DEBUG:", current_user.id)

    return crud_ordem.criar_ordem(db, ordem_in, usuario_id=current_user.id)


@router.get(
    "/",
    response_model=list[OrdemResponse],
    summary="Listar ordens de manutenção com filtros",
)
def listar_ordens(
    busca: Optional[str] = Query(None, description="Busca por número ou descrição"),
    status: Optional[str] = Query(None, description="Filtrar por status"),
    centro_trabalho: Optional[str] = Query(None, description="Filtrar por centro de trabalho"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return crud_ordem.listar_ordens(
        db=db,
        skip=skip,
        limit=limit,
        busca=busca,
        status=status,
        centro_trabalho=centro_trabalho,
    )


@router.get(
    "/{ordem_id}",
    response_model=OrdemResponse,
    summary="Obter detalhes de uma ordem de manutenção",
)
def obter_ordem(
    ordem_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    db_ordem = crud_ordem.obter_ordem_por_id(db, ordem_id)
    if not db_ordem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ordem de manutenção não encontrada.",
        )
    return db_ordem


@router.put(
    "/{ordem_id}",
    response_model=OrdemResponse,
    summary="Atualizar dados de uma ordem de manutenção",
)
def atualizar_ordem(
    ordem_id: int,
    ordem_in: OrdemUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    db_ordem = crud_ordem.obter_ordem_por_id(db, ordem_id)
    if not db_ordem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ordem de manutenção não encontrada.",
        )
    return crud_ordem.atualizar_ordem(db, db_ordem, ordem_in)


@router.delete(
    "/{ordem_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir uma ordem de manutenção",
)
def excluir_ordem(
    ordem_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    db_ordem = crud_ordem.obter_ordem_por_id(db, ordem_id)
    if not db_ordem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ordem de manutenção não encontrada.",
        )
    crud_ordem.excluir_ordem(db, db_ordem)
    return None
