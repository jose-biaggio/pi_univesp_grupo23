from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class OrdemBase(BaseModel):
    numero_ordem: str = Field(..., min_length=1, max_length=50, description="Número ou identificador da ordem")
    descricao: str = Field(..., min_length=1, max_length=255, description="Descrição da atividade de manutenção")
    operacao: str = Field(default="0010", max_length=20, description="Código da operação")
    centro_trabalho: str = Field(..., min_length=1, max_length=100, description="Centro de trabalho responsável")
    horas_programadas: float = Field(..., gt=0, description="Carga horária programada (deve ser maior que 0)")
    data_programada: datetime = Field(..., description="Data e hora programada para execução")
    status: str = Field(default="NAO_APONTADO", max_length=30, description="Status operacional da ordem")


class OrdemCreate(OrdemBase):
    pass


class OrdemUpdate(BaseModel):
    descricao: Optional[str] = Field(None, min_length=1, max_length=255)
    operacao: Optional[str] = Field(None, max_length=20)
    centro_trabalho: Optional[str] = Field(None, min_length=1, max_length=100)
    horas_programadas: Optional[float] = Field(None, gt=0)
    data_programada: Optional[datetime] = None
    status: Optional[str] = Field(None, max_length=30)


class OrdemResponse(OrdemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    usuario_criador_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
