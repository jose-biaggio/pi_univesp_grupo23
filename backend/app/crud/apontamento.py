from typing import Optional
from sqlalchemy.orm import Session

from app.models.apontamento import Apontamento
from app.models.ordem import Ordem
from app.schemas.apontamento import ApontamentoCreate


def obter_apontamento_por_id(db: Session, apontamento_id: int) -> Optional[Apontamento]:
    return db.query(Apontamento).filter(Apontamento.id == apontamento_id).first()


def listar_apontamentos(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    ordem_id: Optional[int] = None,
    usuario_id: Optional[int] = None,
) -> list[Apontamento]:
    query = db.query(Apontamento)

    if ordem_id is not None:
        query = query.filter(Apontamento.ordem_id == ordem_id)

    if usuario_id is not None:
        query = query.filter(Apontamento.usuario_id == usuario_id)

    return (
        query.order_by(Apontamento.data_apontamento.desc(), Apontamento.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def criar_apontamento(
    db: Session,
    apontamento_in: ApontamentoCreate,
    usuario_id: int,
) -> Apontamento:
    db_apontamento = Apontamento(
        ordem_id=apontamento_in.ordem_id,
        usuario_id=usuario_id,
        data_apontamento=apontamento_in.data_apontamento,
        horas_apontadas=apontamento_in.horas_apontadas,
        status=apontamento_in.status,
        observacao=apontamento_in.observacao,
    )
    db.add(db_apontamento)

    # Atualização reativa do status da ordem
    ordem = db.query(Ordem).filter(Ordem.id == apontamento_in.ordem_id).first()
    if ordem:
        if apontamento_in.status.upper() == "CONCLUIDO":
            ordem.status = "CONCLUIDO"
        elif ordem.status == "NAO_APONTADO":
            ordem.status = "EM_ANDAMENTO"

    db.commit()
    db.refresh(db_apontamento)
    return db_apontamento


def excluir_apontamento(db: Session, db_apontamento: Apontamento) -> None:
    db.delete(db_apontamento)
    db.commit()
