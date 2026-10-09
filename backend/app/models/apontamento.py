from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class Apontamento(Base):
    __tablename__ = "apontamentos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    data: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    hora: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    categoria: Mapped[str] = mapped_column(String(50), nullable=False)
    descricao: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="NAO_APONTADO")
    usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("usuarios.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)