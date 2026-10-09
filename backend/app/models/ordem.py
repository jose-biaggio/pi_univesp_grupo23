from __future__ import annotations
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.usuario import Usuario


class Ordem(Base):
    __tablename__ = "ordens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True)
    numero_ordem: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    descricao: Mapped[str] = mapped_column(String(255), nullable=False)
    operacao: Mapped[str] = mapped_column(String(20), default="0010", nullable=False)
    centro_trabalho: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    horas_programadas: Mapped[float] = mapped_column(Float, nullable=False)
    data_programada: Mapped[datetime] = mapped_column(DateTime, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="NAO_APONTADO", index=True, nullable=False)
    usuario_criador_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("usuarios.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    usuario_criador: Mapped[Usuario | None] = relationship(
        "Usuario",
        back_populates="ordens"
    )

    def __repr__(self) -> str:
        return f"<Ordem(id={self.id}, numero_ordem='{self.numero_ordem}', status='{self.status}')>"