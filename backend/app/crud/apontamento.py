from typing import Optional
from sqlalchemy.orm import Session

from app.models.apontamento import Apontamento
from app.models.ordem import Ordem
from app.schemas.apontamento import ApontamentoCreate, ApontamentoUpdate


def _recalcular_status_ordem(db: Session, ordem_id: int) -> None:
    """Recalcula reativamente o status da ordem com base nos apontamentos vinculados."""
    ordem = db.query(Ordem).filter(Ordem.id == ordem_id).first()
    if not ordem:
        return

    apontamentos = db.query(Apontamento).filter(Apontamento.ordem_id == ordem_id).all()
    if not apontamentos:
        ordem.status = "NAO_APONTADO"
    elif any(a.status and a.status.upper() == "CONCLUIDO" for a in apontamentos):
        ordem.status = "CONCLUIDO"
    else:
        ordem.status = "EM_ANDAMENTO"


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
    db.flush()
    _recalcular_status_ordem(db, apontamento_in.ordem_id)
    db.commit()
    db.refresh(db_apontamento)
    return db_apontamento


def atualizar_apontamento(
    db: Session,
    db_apontamento: Apontamento,
    apontamento_in: ApontamentoUpdate,
) -> Apontamento:
    update_data = apontamento_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_apontamento, field, value)
    db.flush()
    _recalcular_status_ordem(db, db_apontamento.ordem_id)
    db.commit()
    db.refresh(db_apontamento)
    return db_apontamento


def excluir_apontamento(db: Session, db_apontamento: Apontamento) -> None:
    ordem_id = db_apontamento.ordem_id
    db.delete(db_apontamento)
    db.flush()
    _recalcular_status_ordem(db, ordem_id)
    db.commit()
