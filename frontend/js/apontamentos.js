import { Auth } from "./auth.js";
import { apiFetch } from "./api.js";
import {
    bootstrap,
    inicializarLayout,
    formatarData,
    obterBadgeStatus
} from "./app.js";

Auth.exigirAutenticacao();
inicializarLayout();

const tabela = document.getElementById("tabelaApontamentos");
const filtroPesquisa = document.getElementById("filtroPesquisaApontamento");
const filtroStatus = document.getElementById("filtroStatusApontamento");
const filtroData = document.getElementById("filtroDataApontamento");
const btnAtualizarFiltro = document.getElementById("btnAtualizarFiltroApontamento");

const kpiTotalApont = document.getElementById("kpiTotalApontamentos");
const kpiHorasApont = document.getElementById("kpiHorasApontadas");
const kpiOrdensApont = document.getElementById("kpiOrdensApontadas");
const kpiAderenciaMedia = document.getElementById("kpiAderenciaMedia");

const btnAbrirModal = document.getElementById("btnAbrirModalNovoApontamento");
const modalNovoEl = document.getElementById("modalApontamento");
const formNovoApontamento = document.getElementById("formNovoApontamento");
const selectOrdem = document.getElementById("selectOrdemApontamento");
const inputData = document.getElementById("inputDataApontamento");
const inputHoras = document.getElementById("inputHorasApontadas");
const selectStatus = document.getElementById("selectStatusApontamento");
const inputObservacao = document.getElementById("inputObservacaoApontamento");
const msgErro = document.getElementById("msgErroApontamento");

const modalNovo = modalNovoEl && bootstrap ? bootstrap.Modal.getOrCreateInstance(modalNovoEl) : null;

const modalExcluirEl = document.getElementById("modalExcluirApontamento");
const btnConfirmarExcluir = document.getElementById("btnConfirmarExcluirApontamento");
const modalExcluir = modalExcluirEl && bootstrap ? bootstrap.Modal.getOrCreateInstance(modalExcluirEl) : null;

const modalEditarEl = document.getElementById("modalEditarApontamento");
const formEditarApontamento = document.getElementById("formEditarApontamento");
const editarInfoOrdem = document.getElementById("editarInfoOrdem");
const editarData = document.getElementById("editarDataApontamento");
const editarHoras = document.getElementById("editarHorasApontadas");
const editarStatus = document.getElementById("editarSelectStatusApontamento");
const editarObservacao = document.getElementById("editarObservacaoApontamento");
const msgErroEditar = document.getElementById("msgErroEditarApontamento");
const btnSalvarEdicao = document.getElementById("btnSalvarEdicaoApontamento");
const modalEditar = modalEditarEl && bootstrap ? bootstrap.Modal.getOrCreateInstance(modalEditarEl) : null;

let apontamentosCarregados = [];
let ordensCarregadas = [];
let idApontamentoPendenteExclusao = null;
let idApontamentoPendenteEdicao = null;

function converterParaDataLocal(valor) {
    if (!valor) return "";
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return "";
    data.setMinutes(data.getMinutes() - data.getTimezoneOffset());
    return data.toISOString().slice(0, 16);
}

function obterDataHoraAtualLocal() {
    const agora = new Date();
    agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
    return agora.toISOString().slice(0, 16);
}

async function carregarOrdens() {
    try {
        const resp = await apiFetch("/ordens/?limit=500");
        if (resp.ok) {
            ordensCarregadas = await resp.json();
            atualizarSelectOrdens();
        }
    } catch (err) {
        console.error("Erro ao carregar ordens:", err);
    }
}

function atualizarSelectOrdens() {
    if (!selectOrdem) return;

    if (ordensCarregadas.length === 0) {
        selectOrdem.innerHTML = '<option value="">Nenhuma ordem cadastrada</option>';
        return;
    }

    selectOrdem.innerHTML = '<option value="">Selecione uma ordem...</option>' +
        ordensCarregadas.map(o => `
            <option value="${o.id}">
                ${o.numero_ordem} - ${o.descricao} (${o.centro_trabalho})
            </option>
        `).join("");
}

async function carregarApontamentos() {
    if (!tabela) return;

    tabela.innerHTML = `
        <tr>
            <td colspan="10" class="text-center py-4">
                <i class="fa-solid fa-spinner fa-spin me-2"></i>
                Carregando apontamentos...
            </td>
        </tr>
    `;

    try {
        const resp = await apiFetch("/apontamentos/?limit=500");
        if (!resp.ok) {
            throw new Error(`Erro ${resp.status}`);
        }

        apontamentosCarregados = await resp.json();
        renderizarTabela();
        atualizarKPIs();
    } catch (err) {
        console.error("Erro ao carregar apontamentos:", err);
        tabela.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-4 text-danger">
                    <i class="fa-solid fa-triangle-exclamation me-2"></i>
                    Falha ao carregar apontamentos de manutenção.
                </td>
            </tr>
        `;
    }
}

function obterApontamentosFiltrados() {
    const termo = filtroPesquisa?.value.trim().toLowerCase() || "";
    const statusFiltro = filtroStatus?.value || "";
    const dataFiltro = filtroData?.value || "";

    return apontamentosCarregados.filter(item => {
        if (statusFiltro && item.status !== statusFiltro) {
            return false;
        }

        if (dataFiltro) {
            const dataIso = item.data_apontamento?.slice(0, 10);
            if (dataIso !== dataFiltro) return false;
        }

        if (termo) {
            const numOrdem = (item.numero_ordem || "").toLowerCase();
            const desc = (item.descricao_ordem || "").toLowerCase();
            const obs = (item.observacao || "").toLowerCase();
            const operador = (item.nome_usuario || "").toLowerCase();

            if (!numOrdem.includes(termo) && !desc.includes(termo) && !obs.includes(termo) && !operador.includes(termo)) {
                return false;
            }
        }

        return true;
    });
}

function renderizarTabela() {
    if (!tabela) return;

    const lista = obterApontamentosFiltrados();

    if (lista.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-4 text-muted">
                    <i class="fa-solid fa-inbox me-2"></i>
                    Nenhum apontamento encontrado com os filtros selecionados.
                </td>
            </tr>
        `;
        return;
    }

    tabela.innerHTML = lista.map(item => {
        const dataFmt = formatarData(item.data_apontamento);
        const ordemNum = item.numero_ordem || `ID ${item.ordem_id}`;
        const desc = item.descricao_ordem || "-";
        const op = item.operacao_ordem || "0010";
        const centro = item.centro_trabalho_ordem || "-";
        const horas = Number(item.horas_apontadas || 0).toFixed(1);
        const operador = item.nome_usuario || "Operador";
        const obs = item.observacao || "-";

        let badgeStatus = `<span class="badge bg-success">Concluído</span>`;
        if (item.status === "PARCIAL") {
            badgeStatus = `<span class="badge bg-warning text-dark">Parcial</span>`;
        }

        return `
            <tr>
                <td>${dataFmt}</td>
                <td><strong>${ordemNum}</strong></td>
                <td>${desc}</td>
                <td>${op}</td>
                <td>${centro}</td>
                <td><span class="badge bg-light text-dark">${horas} h</span></td>
                <td>${operador}</td>
                <td>${badgeStatus}</td>
                <td class="text-truncate" style="max-width: 180px;" title="${obs}">${obs}</td>
                <td>
                    <div class="d-flex gap-1 justify-content-center">
                        <button class="btn btn-outline-primary btn-sm btn-editar" data-id="${item.id}" title="Editar apontamento">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm btn-excluir" data-id="${item.id}" title="Excluir apontamento">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    tabela.querySelectorAll(".btn-editar").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            abrirModalEdicao(id);
        });
    });

    tabela.querySelectorAll(".btn-excluir").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            abrirModalExclusao(id);
        });
    });
}

function atualizarKPIs() {
    const total = apontamentosCarregados.length;
    const totalHoras = apontamentosCarregados.reduce((acc, a) => acc + (Number(a.horas_apontadas) || 0), 0);
    const ordensDistintas = new Set(apontamentosCarregados.map(a => a.ordem_id)).size;

    let horasProgTotal = 0;
    const ordensApontadasSet = new Set(apontamentosCarregados.map(a => a.ordem_id));
    ordensCarregadas.forEach(o => {
        if (ordensApontadasSet.has(o.id)) {
            horasProgTotal += Number(o.horas_programadas) || 0;
        }
    });

    const aderencia = horasProgTotal > 0
        ? Math.min(100, Math.round((totalHoras / horasProgTotal) * 100))
        : 0;

    if (kpiTotalApont) kpiTotalApont.textContent = total;
    if (kpiHorasApont) kpiHorasApont.textContent = `${totalHoras.toFixed(1)} h`;
    if (kpiOrdensApont) kpiOrdensApont.textContent = ordensDistintas;
    if (kpiAderenciaMedia) kpiAderenciaMedia.textContent = `${aderencia}%`;
}

btnAbrirModal?.addEventListener("click", () => {
    if (inputData) inputData.value = obterDataHoraAtualLocal();
    if (msgErro) msgErro.classList.add("d-none");
    if (formNovoApontamento) formNovoApontamento.reset();
    if (inputData) inputData.value = obterDataHoraAtualLocal();
    modalNovo?.show();
});

formNovoApontamento?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const ordemId = parseInt(selectOrdem.value, 10);
    const dataApontamento = inputData.value;
    const horasApontadas = parseFloat(inputHoras.value);
    const statusApontamento = selectStatus.value;
    const observacao = inputObservacao.value.trim() || null;

    if (!ordemId) {
        mostrarErro("Por favor, selecione uma ordem de manutenção.");
        return;
    }

    if (!horasApontadas || horasApontadas <= 0) {
        mostrarErro("As horas apontadas devem ser maiores que zero.");
        return;
    }

    try {
        const payload = {
            ordem_id: ordemId,
            data_apontamento: new Date(dataApontamento).toISOString(),
            horas_apontadas: horasApontadas,
            status: statusApontamento,
            observacao: observacao
        };

        const resp = await apiFetch("/apontamentos/", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        if (!resp.ok) {
            const errData = await resp.json().catch(() => ({}));
            throw new Error(errData.detail || "Erro ao registrar apontamento.");
        }

        modalNovo?.hide();
        formNovoApontamento.reset();
        await carregarApontamentos();
        await carregarOrdens();
    } catch (err) {
        mostrarErro(err.message);
    }
});

function mostrarErro(msg) {
    if (!msgErro) return;
    msgErro.textContent = msg;
    msgErro.classList.remove("d-none");
}

function mostrarErroEdicao(msg) {
    if (!msgErroEditar) return;
    msgErroEditar.textContent = msg;
    msgErroEditar.classList.remove("d-none");
}

function abrirModalEdicao(id) {
    const item = apontamentosCarregados.find(a => String(a.id) === String(id));
    if (!item) {
        alert("Apontamento não encontrado.");
        return;
    }

    idApontamentoPendenteEdicao = item.id;

    if (editarInfoOrdem) {
        const ordemNum = item.numero_ordem || `ID ${item.ordem_id}`;
        const desc = item.descricao_ordem || "";
        editarInfoOrdem.value = `${ordemNum} - ${desc}`;
    }

    if (editarData) {
        editarData.value = converterParaDataLocal(item.data_apontamento);
    }

    if (editarHoras) {
        editarHoras.value = item.horas_apontadas ?? "";
    }

    if (editarStatus) {
        editarStatus.value = item.status || "CONCLUIDO";
    }

    if (editarObservacao) {
        editarObservacao.value = item.observacao || "";
    }

    if (msgErroEditar) {
        msgErroEditar.classList.add("d-none");
        msgErroEditar.textContent = "";
    }

    modalEditar?.show();
}

formEditarApontamento?.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!idApontamentoPendenteEdicao) return;

    const dataApontamento = editarData.value;
    const horasApontadas = parseFloat(editarHoras.value);
    const statusApontamento = editarStatus.value;
    const observacao = editarObservacao.value.trim() || null;

    if (!dataApontamento) {
        mostrarErroEdicao("Informe uma data e hora válidas.");
        return;
    }

    if (!horasApontadas || horasApontadas <= 0) {
        mostrarErroEdicao("As horas apontadas devem ser maiores que zero.");
        return;
    }

    if (btnSalvarEdicao) {
        btnSalvarEdicao.disabled = true;
        btnSalvarEdicao.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Salvando...';
    }

    try {
        const payload = {
            data_apontamento: new Date(dataApontamento).toISOString(),
            horas_apontadas: horasApontadas,
            status: statusApontamento,
            observacao: observacao,
        };

        const resp = await apiFetch(`/apontamentos/${idApontamentoPendenteEdicao}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });

        if (!resp.ok) {
            const errData = await resp.json().catch(() => ({}));
            throw new Error(errData.detail || "Erro ao atualizar apontamento.");
        }

        modalEditar?.hide();
        formEditarApontamento.reset();
        idApontamentoPendenteEdicao = null;
        await carregarApontamentos();
        await carregarOrdens();
    } catch (err) {
        mostrarErroEdicao(err.message);
    } finally {
        if (btnSalvarEdicao) {
            btnSalvarEdicao.disabled = false;
            btnSalvarEdicao.innerHTML = '<i class="fa-solid fa-floppy-disk me-1"></i> Salvar alterações';
        }
    }
});

function abrirModalExclusao(id) {
    idApontamentoPendenteExclusao = id;
    modalExcluir?.show();
}

btnConfirmarExcluir?.addEventListener("click", async () => {
    if (!idApontamentoPendenteExclusao) return;

    try {
        const resp = await apiFetch(`/apontamentos/${idApontamentoPendenteExclusao}`, {
            method: "DELETE"
        });

        if (!resp.ok) {
            throw new Error("Falha ao excluir apontamento.");
        }

        modalExcluir?.hide();
        idApontamentoPendenteExclusao = null;
        await carregarApontamentos();
        await carregarOrdens();
    } catch (err) {
        console.error("Erro ao excluir:", err);
        alert(err.message);
    }
});

btnAtualizarFiltro?.addEventListener("click", renderizarTabela);
filtroPesquisa?.addEventListener("input", renderizarTabela);
filtroStatus?.addEventListener("change", renderizarTabela);
filtroData?.addEventListener("change", renderizarTabela);

carregarOrdens();
carregarApontamentos();