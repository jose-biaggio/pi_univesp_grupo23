from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ApontamentoBase(BaseModel):
    ordem_id: int = Field(..., description="ID da ordem de manutenção")
    data_apontamento: datetime = Field(..., description="Data e hora da execução do apontamento")
    horas_apontadas: float = Field(..., gt=0, description="Horas apontadas (deve ser maior que 0)")
    status: str = Field(default="CONCLUIDO", max_length=30, description="Status do apontamento (ex: PARCIAL, CONCLUIDO)")
    observacao: Optional[str] = Field(None, max_length=255, description="Observação técnica ou descrição da atividade")


class ApontamentoCreate(ApontamentoBase):
    pass


class ApontamentoResponse(ApontamentoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    usuario_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    numero_ordem: Optional[str] = None
    descricao_ordem: Optional[str] = None
    operacao_ordem: Optional[str] = None
    centro_trabalho_ordem: Optional[str] = None
    nome_usuario: Optional[str] = None
