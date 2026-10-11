
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

const tabela = document.getElementById("tabelaProgramacao");
const filtroPesquisa = document.getElementById("filtroPesquisa");
const filtroStatus = document.getElementById("filtroStatus");
const filtroCentro = document.getElementById("filtroCentro");
const btnAtualizarFiltro = document.getElementById("btnAtualizarFiltro");

const kpiOrdens = document.getElementById("kpiOrdensProgramadas");
const kpiHorasProg = document.getElementById("kpiHorasProgramadas");
const kpiHorasApont = document.getElementById("kpiHorasApontadas");
const kpiAderencia = document.getElementById("kpiAderencia");

let centrosConhecidos = new Set();
let ordensCarregadas = [];
const edicoesLocais = new Map();

let ordemEmEdicao = null;
let chaveOrdemEmEdicao = null;

const modalEditarEl = document.getElementById("modalEditarOrdem");
const formEditarOrdem = document.getElementById("formEditarOrdem");
const msgErroEdicao = document.getElementById("msgErroEdicao");
const btnSalvarEdicao = document.getElementById("btnSalvarEdicao");

const modalEditar = modalEditarEl
    ? new bootstrap.Modal(modalEditarEl)
    : null;

function obterChaveOrdem(ordem) {
    return String(ordem.id ?? ordem.numero_ordem);
}

function converterParaDataLocal(valor) {
    if (!valor) return "";

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) return "";

    data.setMinutes(data.getMinutes() - data.getTimezoneOffset());

    return data.toISOString().slice(0, 16);
}

async function carregarOrdens() {
    if (!tabela) return;

    tabela.innerHTML = `
        <tr>
            <td colspan="8" class="text-center py-4">
                <i class="fa-solid fa-spinner fa-spin me-2"></i>
                Carregando ordens de manutenção...
            </td>
        </tr>
    `;

    const params = new URLSearchParams();
    const termo = filtroPesquisa?.value.trim();
    const status = filtroStatus?.value;
    const centro = filtroCentro?.value;

    if (termo) params.append("busca", termo);
    if (status) params.append("status", status);
    if (centro) params.append("centro_trabalho", centro);

    try {
        const response = await apiFetch(`/ordens/?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`Erro ${response.status}: Falha ao buscar ordens`);
        }

        const ordens = await response.json();
        ordensCarregadas = ordens;

        renderizarTabela(ordens);
        atualizarCentrosDisponiveis(ordens);
    } catch (error) {
        console.error("Erro ao carregar ordens:", error);

        tabela.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-danger py-4">
                    <i class="fa-solid fa-triangle-exclamation me-2"></i>
                    Não foi possível carregar as ordens.
                    Verifique a conexão com o servidor.
                </td>
            </tr>
        `;
    }
}

function renderizarTabela(ordens) {
    if (!ordens || ordens.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    Nenhuma ordem de manutenção encontrada.
                </td>
            </tr>
        `;

        atualizarKPIs([]);
        return;
    }

    const ordensExibidas = ordens.map(ordem => ({
        ...ordem,
        ...(edicoesLocais.get(obterChaveOrdem(ordem)) || {})
    }));

    tabela.innerHTML = ordensExibidas.map(ordem => `
        <tr>
            <td><strong>${ordem.numero_ordem}</strong></td>
            <td>${ordem.descricao}</td>
            <td>${ordem.operacao || "0010"}</td>
            <td>${ordem.centro_trabalho}</td>
            <td>${Number(ordem.horas_programadas).toFixed(1)} h</td>
            <td>${formatarData(ordem.data_programada)}</td>
            <td>${obterBadgeStatus(ordem.status)}</td>
            <td>
                <button
                    type="button"
                    class="btn btn-outline-primary btn-sm btn-editar-ordem"
                    data-chave="${obterChaveOrdem(ordem)}"
                    title="Editar ordem"
                    aria-label="Editar ordem ${ordem.numero_ordem}">
                    <i class="fa-solid fa-pen"></i>
                </button>
            </td>
        </tr>
    `).join("");

    atualizarKPIs(ordensExibidas);
}

function atualizarKPIs(ordens) {
    const totalOrdens = ordens.length;

    const totalHoras = ordens.reduce(
        (acc, ordem) => acc + (Number(ordem.horas_programadas) || 0),
        0
    );

    if (kpiOrdens) kpiOrdens.textContent = totalOrdens;
    if (kpiHorasProg) kpiHorasProg.textContent = `${totalHoras.toFixed(1)} h`;

    if (kpiHorasApont) kpiHorasApont.textContent = "0.0 h";
    if (kpiAderencia) kpiAderencia.textContent = "0%";
}

function atualizarCentrosDisponiveis(ordens) {
    let mudou = false;

    ordens.forEach(ordem => {
        if (
            ordem.centro_trabalho &&
            !centrosConhecidos.has(ordem.centro_trabalho)
        ) {
            centrosConhecidos.add(ordem.centro_trabalho);
            mudou = true;
        }
    });

    if (mudou && filtroCentro) {
        const valorAtual = filtroCentro.value;

        filtroCentro.innerHTML =
            '<option value="">Todos os Centros</option>' +
            Array.from(centrosConhecidos)
                .sort()
                .map(centro => `
                    <option value="${centro}"
                        ${centro === valorAtual ? "selected" : ""}>
                        ${centro}
                    </option>
                `)
                .join("");
    }
}

/* =========================================
   EDIÇÃO TEMPORÁRIA DE ORDEM
   ========================================= */

tabela?.addEventListener("click", event => {
    const botao = event.target.closest(".btn-editar-ordem");

    if (!botao) return;

    const chave = botao.dataset.chave;

    const ordemOriginal = ordensCarregadas.find(
        ordem => obterChaveOrdem(ordem) === chave
    );

    if (!ordemOriginal) {
        alert("Não foi possível localizar a ordem selecionada.");
        return;
    }

    ordemEmEdicao = {
        ...ordemOriginal,
        ...(edicoesLocais.get(chave) || {})
    };

    chaveOrdemEmEdicao = chave;

    document.getElementById("editarNumeroOrdem").value =
        ordemEmEdicao.numero_ordem ?? "";

    document.getElementById("editarDescricao").value =
        ordemEmEdicao.descricao ?? "";

    document.getElementById("editarOperacao").value =
        ordemEmEdicao.operacao ?? "0010";

    document.getElementById("editarCentroTrabalho").value =
        ordemEmEdicao.centro_trabalho ?? "";

    document.getElementById("editarHorasProgramadas").value =
        ordemEmEdicao.horas_programadas ?? 0;

    document.getElementById("editarDataProgramada").value =
        converterParaDataLocal(ordemEmEdicao.data_programada);

    msgErroEdicao.classList.add("d-none");
    msgErroEdicao.textContent = "";

    modalEditar?.show();
});

formEditarOrdem?.addEventListener("submit", event => {
    event.preventDefault();

    if (!ordemEmEdicao || chaveOrdemEmEdicao === null) return;

    const descricao =
        document.getElementById("editarDescricao").value.trim();

    const operacao =
        document.getElementById("editarOperacao").value.trim();

    const centroTrabalho =
        document.getElementById("editarCentroTrabalho").value.trim();

    const campoHoras =
        document.getElementById("editarHorasProgramadas");

    const horasProgramadas = Number(campoHoras.value);

    const dataProgramada =
        document.getElementById("editarDataProgramada").value;

    if (
        !descricao ||
        !operacao ||
        !centroTrabalho ||
        !dataProgramada ||
        campoHoras.value.trim() === "" ||
        !Number.isFinite(horasProgramadas) ||
        horasProgramadas < 0
    ) {
        msgErroEdicao.textContent =
            "Preencha todos os campos corretamente. As horas não podem ser negativas.";

        msgErroEdicao.classList.remove("d-none");
        return;
    }

    const dataConvertida = new Date(dataProgramada);

    if (Number.isNaN(dataConvertida.getTime())) {
        msgErroEdicao.textContent = "Informe uma data válida.";
        msgErroEdicao.classList.remove("d-none");
        return;
    }

    const alteracoes = {
        descricao,
        operacao,
        centro_trabalho: centroTrabalho,
        horas_programadas: horasProgramadas,
        data_programada: dataConvertida.toISOString()
    };

    edicoesLocais.set(chaveOrdemEmEdicao, alteracoes);

    ordensCarregadas = ordensCarregadas.map(ordem =>
        obterChaveOrdem(ordem) === chaveOrdemEmEdicao
            ? { ...ordem, ...alteracoes }
            : ordem
    );

    renderizarTabela(ordensCarregadas);
    atualizarCentrosDisponiveis(ordensCarregadas);

    modalEditar?.hide();

    ordemEmEdicao = null;
    chaveOrdemEmEdicao = null;
});

/* =========================================
   CADASTRO DE NOVA ORDEM
   ========================================= */

const formNovaOrdem = document.getElementById("formNovaOrdem");
const msgErroModal = document.getElementById("msgErroModal");
const btnSalvarOrdem = document.getElementById("btnSalvarOrdem");

if (formNovaOrdem) {
    const campoData = document.getElementById("campoDataProgramada");

    if (campoData && !campoData.value) {
        const agora = new Date();
        agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
        campoData.value = agora.toISOString().slice(0, 16);
    }

    formNovaOrdem.addEventListener("submit", async event => {
        event.preventDefault();

        msgErroModal.classList.add("d-none");
        msgErroModal.textContent = "";

        const numeroOrdem =
            document.getElementById("campoNumeroOrdem").value.trim();

        const descricao =
            document.getElementById("campoDescricao").value.trim();

        const operacao =
            document.getElementById("campoOperacao").value.trim() || "0010";

        const centroTrabalho =
            document.getElementById("campoCentroTrabalho").value.trim();

        const campoHoras =
            document.getElementById("campoHorasProgramadas");

        const horasProgramadas = parseFloat(campoHoras.value);

        const dataProgramada =
            document.getElementById("campoDataProgramada").value;

        if (
            !numeroOrdem ||
            !descricao ||
            !centroTrabalho ||
            campoHoras.value.trim() === "" ||
            !Number.isFinite(horasProgramadas) ||
            horasProgramadas < 0 ||
            !dataProgramada
        ) {
            msgErroModal.textContent =
                "Por favor, preencha todos os campos obrigatórios corretamente.";

            msgErroModal.classList.remove("d-none");
            return;
        }

        btnSalvarOrdem.disabled = true;
        btnSalvarOrdem.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin me-1"></i> Salvando...';

        try {
            const response = await apiFetch("/ordens/", {
                method: "POST",
                body: JSON.stringify({
                    numero_ordem: numeroOrdem,
                    descricao,
                    operacao,
                    centro_trabalho: centroTrabalho,
                    horas_programadas: horasProgramadas,
                    data_programada: new Date(dataProgramada).toISOString(),
                    status: "NAO_APONTADO"
                })
            });

            const data = await response.json();

            if (response.ok) {
                const modalEl = document.getElementById("modalNovaOrdem");
                const modalInst = bootstrap.Modal.getInstance(modalEl);

                if (modalInst) modalInst.hide();

                formNovaOrdem.reset();
                await carregarOrdens();
            } else {
                let mensagem = "Erro ao cadastrar ordem.";

                if (data?.detail) {
                    mensagem = typeof data.detail === "string"
                        ? data.detail
                        : JSON.stringify(data.detail);
                }

                msgErroModal.textContent = mensagem;
                msgErroModal.classList.remove("d-none");
            }
        } catch (error) {
            console.error("Erro ao cadastrar ordem:", error);

            msgErroModal.textContent = "Erro de conexão com o servidor.";
            msgErroModal.classList.remove("d-none");
        } finally {
            btnSalvarOrdem.disabled = false;
            btnSalvarOrdem.innerHTML =
                '<i class="fa-solid fa-floppy-disk me-1"></i> Salvar Ordem';
        }
    });
}

/* =========================================
   FILTROS E INICIALIZAÇÃO
   ========================================= */

btnAtualizarFiltro?.addEventListener("click", carregarOrdens);
filtroStatus?.addEventListener("change", carregarOrdens);
filtroCentro?.addEventListener("change", carregarOrdens);

filtroPesquisa?.addEventListener("keyup", event => {
    if (event.key === "Enter") carregarOrdens();
});

carregarOrdens();
