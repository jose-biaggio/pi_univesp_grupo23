from typing import Optional
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.ordem import Ordem
from app.schemas.ordem import OrdemCreate, OrdemUpdate


def obter_ordem_por_id(db: Session, ordem_id: int) -> Optional[Ordem]:
    return db.query(Ordem).filter(Ordem.id == ordem_id).first()


def obter_ordem_por_numero(db: Session, numero_ordem: str) -> Optional[Ordem]:
    return db.query(Ordem).filter(Ordem.numero_ordem == numero_ordem).first()


def listar_ordens(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    busca: Optional[str] = None,
    status: Optional[str] = None,
    centro_trabalho: Optional[str] = None,
) -> list[Ordem]:
    query = db.query(Ordem)

    if busca:
        termo = f"%{busca}%"
        query = query.filter(
            or_(
                Ordem.numero_ordem.ilike(termo),
                Ordem.descricao.ilike(termo),
            )
        )

    if status and status.upper() not in ["TODOS", "ALL"]:
        query = query.filter(Ordem.status == status)

    if centro_trabalho and centro_trabalho.upper() not in ["TODOS", "ALL"]:
        query = query.filter(Ordem.centro_trabalho == centro_trabalho)

    return query.order_by(Ordem.data_programada.desc(), Ordem.id.desc()).offset(skip).limit(limit).all()


def criar_ordem(db: Session, ordem_in: OrdemCreate, usuario_id: Optional[int] = None) -> Ordem:
    db_ordem = Ordem(
        numero_ordem=ordem_in.numero_ordem,
        descricao=ordem_in.descricao,
        operacao=ordem_in.operacao,
        centro_trabalho=ordem_in.centro_trabalho,
        horas_programadas=ordem_in.horas_programadas,
        data_programada=ordem_in.data_programada,
        status=ordem_in.status,
        usuario_criador_id=usuario_id,
    )
    db.add(db_ordem)
    db.commit()
    db.refresh(db_ordem)
    return db_ordem


def atualizar_ordem(db: Session, db_ordem: Ordem, ordem_in: OrdemUpdate) -> Ordem:
    update_data = ordem_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_ordem, field, value)
    db.commit()
    db.refresh(db_ordem)
    return db_ordem


def excluir_ordem(db: Session, db_ordem: Ordem) -> None:
    db.delete(db_ordem)
    db.commit()
