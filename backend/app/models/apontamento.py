from __future__ import annotations
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.ordem import Ordem
    from app.models.usuario import Usuario


class Apontamento(Base):
    __tablename__ = "apontamentos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True)
    ordem_id: Mapped[int] = mapped_column(Integer, ForeignKey("ordens.id", ondelete="CASCADE"), nullable=False, index=True)
    usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    data_apontamento: Mapped[datetime] = mapped_column(DateTime, index=True, nullable=False)
    horas_apontadas: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="CONCLUIDO", nullable=False)
    observacao: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    ordem: Mapped[Ordem] = relationship(
        "Ordem",
        back_populates="apontamentos",
    )
    usuario: Mapped[Usuario] = relationship(
        "Usuario",
        back_populates="apontamentos",
    )

    def __repr__(self) -> str:
        return f"<Apontamento(id={self.id}, ordem_id={self.ordem_id}, horas={self.horas_apontadas})>"

    @property
    def numero_ordem(self) -> str | None:
        return self.ordem.numero_ordem if self.ordem else None

    @property
    def descricao_ordem(self) -> str | None:
        return self.ordem.descricao if self.ordem else None

    @property
    def operacao_ordem(self) -> str | None:
        return self.ordem.operacao if self.ordem else None

    @property
    def centro_trabalho_ordem(self) -> str | None:
        return self.ordem.centro_trabalho if self.ordem else None

    @property
    def nome_usuario(self) -> str | None:
        return self.usuario.nome if self.usuario else None