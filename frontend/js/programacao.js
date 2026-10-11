
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

// Guarda as ordens ocultadas pelo usuário nesta sessão.
const ordensExcluidasLocais = new Set();

let ordemEmEdicao = null;
let chaveOrdemEmEdicao = null;
let chaveOrdemPendenteExclusao = null;

// --------------------------------------------------
// MODAL DE EDIÇÃO
// --------------------------------------------------

const modalEditarEl = document.getElementById("modalEditarOrdem");
const formEditarOrdem = document.getElementById("formEditarOrdem");
const msgErroEdicao = document.getElementById("msgErroEdicao");

const modalEditar = modalEditarEl && bootstrap
    ? bootstrap.Modal.getOrCreateInstance(modalEditarEl)
    : null;

// --------------------------------------------------
// MODAL DE EXCLUSÃO
// --------------------------------------------------

const modalExcluirEl = document.getElementById("modalExcluirOrdem");
const numeroOrdemExcluir = document.getElementById("numeroOrdemExcluir");
const btnConfirmarExclusao = document.getElementById("confirmarExclusaoOrdem");

const modalExcluir = modalExcluirEl && bootstrap
    ? bootstrap.Modal.getOrCreateInstance(modalExcluirEl)
    : null;

// Retorna um identificador consistente para cada ordem.
function obterChaveOrdem(ordem) {
    return String(ordem.id ?? ordem.numero_ordem);
}

// Converte uma data para o formato aceito pelo input datetime-local.
function converterParaDataLocal(valor) {
    if (!valor) return "";

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) return "";

    data.setMinutes(data.getMinutes() - data.getTimezoneOffset());

    return data.toISOString().slice(0, 16);
}

// --------------------------------------------------
// CARREGAR ORDENS
// --------------------------------------------------

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
            throw new Error(
                `Erro ${response.status}: falha ao buscar ordens`
            );
        }

        const ordens = await response.json();

        // Mantém ocultas as ordens excluídas apenas visualmente.
        ordensCarregadas = ordens.filter(ordem =>
            !ordensExcluidasLocais.has(obterChaveOrdem(ordem))
        );

        renderizarTabela(ordensCarregadas);
        atualizarCentrosDisponiveis(ordensCarregadas);

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

// --------------------------------------------------
// RENDERIZAR TABELA
// --------------------------------------------------

function renderizarTabela(ordens) {
    if (!tabela) return;

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

    tabela.innerHTML = ordensExibidas.map(ordem => {
        const chave = obterChaveOrdem(ordem);

        return `
            <tr>
                <td>
                    <strong>${ordem.numero_ordem ?? ""}</strong>
                </td>

                <td>${ordem.descricao ?? ""}</td>

                <td>${ordem.operacao || "0010"}</td>

                <td>${ordem.centro_trabalho ?? ""}</td>

                <td>
                    ${(Number(ordem.horas_programadas) || 0).toFixed(1)} h
                </td>

                <td>${formatarData(ordem.data_programada)}</td>

                <td>${obterBadgeStatus(ordem.status)}</td>

                <td>
                    <div class="d-flex gap-1">
                        <button
                            type="button"
                            class="btn btn-outline-primary btn-sm btn-editar-ordem"
                            data-chave="${chave}"
                            title="Editar ordem"
                            aria-label="Editar ordem ${ordem.numero_ordem ?? ""}">
                            <i class="fa-solid fa-pen"></i>
                        </button>

                        <button
                            type="button"
                            class="btn btn-outline-danger btn-sm btn-excluir-ordem"
                            data-chave="${chave}"
                            data-numero="${ordem.numero_ordem ?? ""}"
                            title="Excluir ordem"
                            aria-label="Excluir ordem ${ordem.numero_ordem ?? ""}">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    atualizarKPIs(ordensExibidas);
}

// --------------------------------------------------
// CLIQUES NA TABELA: EDITAR E EXCLUIR
// --------------------------------------------------

tabela?.addEventListener("click", (event) => {
    const botaoEditar = event.target.closest(".btn-editar-ordem");
    const botaoExcluir = event.target.closest(".btn-excluir-ordem");

    // Abrir modal de edição.
    if (botaoEditar) {
        abrirModalEdicao(botaoEditar.dataset.chave);
        return;
    }

    // Abrir modal de confirmação de exclusão.
    if (botaoExcluir) {
        abrirModalExclusao(
            botaoExcluir.dataset.chave,
            botaoExcluir.dataset.numero
        );
    }
});

// --------------------------------------------------
// ABRIR MODAL DE EDIÇÃO
// --------------------------------------------------

function abrirModalEdicao(chave) {
    const ordemOriginal = ordensCarregadas.find(
        ordem => obterChaveOrdem(ordem) === String(chave)
    );

    if (!ordemOriginal) {
        alert("Não foi possível localizar a ordem selecionada.");
        return;
    }

    ordemEmEdicao = {
        ...ordemOriginal,
        ...(edicoesLocais.get(String(chave)) || {})
    };

    chaveOrdemEmEdicao = String(chave);

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

    if (msgErroEdicao) {
        msgErroEdicao.classList.add("d-none");
        msgErroEdicao.textContent = "";
    }

    if (modalEditar) {
        modalEditar.show();
    } else {
        console.error("Bootstrap Modal não está disponível.");
        alert("Não foi possível abrir o formulário de edição.");
    }
}

// --------------------------------------------------
// SALVAR EDIÇÃO SOMENTE NO FRONTEND
// --------------------------------------------------

formEditarOrdem?.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!ordemEmEdicao || chaveOrdemEmEdicao === null) return;

    const descricao =
        document.getElementById("editarDescricao").value.trim();

    const operacao =
        document.getElementById("editarOperacao").value.trim();

    const centroTrabalho =
        document.getElementById("editarCentroTrabalho").value.trim();

    const horasProgramadas =
        Number(document.getElementById("editarHorasProgramadas").value);

    const dataProgramada =
        document.getElementById("editarDataProgramada").value;

    if (
        !descricao ||
        !operacao ||
        !centroTrabalho ||
        !dataProgramada ||
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
        msgErroEdicao.textContent =
            "Informe uma data programada válida.";

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

// --------------------------------------------------
// ABRIR MODAL DE EXCLUSÃO
// --------------------------------------------------

function abrirModalExclusao(chave, numeroOrdem) {
    if (!modalExcluir) {
        console.error("Modal de exclusão não encontrado no HTML.");
        alert("Não foi possível abrir a confirmação de exclusão.");
        return;
    }

    chaveOrdemPendenteExclusao = String(chave);

    if (numeroOrdemExcluir) {
        numeroOrdemExcluir.textContent =
            numeroOrdem || chaveOrdemPendenteExclusao;
    }

    modalExcluir.show();
}

// --------------------------------------------------
// CONFIRMAR EXCLUSÃO SOMENTE NO FRONTEND
// --------------------------------------------------

btnConfirmarExclusao?.addEventListener("click", () => {
    if (chaveOrdemPendenteExclusao === null) return;

    const chave = chaveOrdemPendenteExclusao;

    // Registra a ordem para que não reapareça ao filtrar
    // ou atualizar os dados durante esta sessão.
    ordensExcluidasLocais.add(chave);

    // Descarta uma eventual edição local da mesma ordem.
    edicoesLocais.delete(chave);

    // Remove a ordem da lista exibida.
    ordensCarregadas = ordensCarregadas.filter(
        ordem => obterChaveOrdem(ordem) !== chave
    );

    // Atualiza tabela e indicadores.
    renderizarTabela(ordensCarregadas);
    atualizarCentrosDisponiveis(ordensCarregadas);

    // Fecha o modal e limpa a seleção.
    modalExcluir?.hide();
    chaveOrdemPendenteExclusao = null;
});

// Se o usuário cancelar ou fechar o modal,
// nenhuma ordem será removida.
modalExcluirEl?.addEventListener("hidden.bs.modal", () => {
    chaveOrdemPendenteExclusao = null;
});

// --------------------------------------------------
// ATUALIZAR INDICADORES
// --------------------------------------------------

function atualizarKPIs(ordens) {
    const totalOrdens = ordens.length;

    const totalHoras = ordens.reduce(
        (acumulado, ordem) =>
            acumulado + (Number(ordem.horas_programadas) || 0),
        0
    );

    if (kpiOrdens) {
        kpiOrdens.textContent = totalOrdens;
    }

    if (kpiHorasProg) {
        kpiHorasProg.textContent = `${totalHoras.toFixed(1)} h`;
    }

    if (kpiHorasApont) {
        kpiHorasApont.textContent = "0.0 h";
    }

    if (kpiAderencia) {
        kpiAderencia.textContent = "0%";
    }
}

// --------------------------------------------------
// ATUALIZAR FILTRO DE CENTROS
// --------------------------------------------------

function atualizarCentrosDisponiveis(ordens) {
    if (!filtroCentro) return;

    const centrosAtuais = new Set(
        ordens
            .map(ordem => ordem.centro_trabalho)
            .filter(Boolean)
    );

    centrosAtuais.forEach(centro => centrosConhecidos.add(centro));

    const valorAtual = filtroCentro.value;

    filtroCentro.innerHTML =
        '<option value="">Todos os Centros</option>' +
        Array.from(centrosConhecidos)
            .sort()
            .map(centro => `
                <option
                    value="${centro}"
                    ${centro === valorAtual ? "selected" : ""}>
                    ${centro}
                </option>
            `)
            .join("");
}

// --------------------------------------------------
// CADASTRAR NOVA ORDEM
// Esta operação continua usando a API existente.
// --------------------------------------------------

const formNovaOrdem = document.getElementById("formNovaOrdem");
const msgErroModal = document.getElementById("msgErroModal");
const btnSalvarOrdem = document.getElementById("btnSalvarOrdem");

if (formNovaOrdem) {
    const campoData = document.getElementById("campoDataProgramada");

    if (campoData && !campoData.value) {
        const agora = new Date();

        agora.setMinutes(
            agora.getMinutes() - agora.getTimezoneOffset()
        );

        campoData.value = agora.toISOString().slice(0, 16);
    }

    formNovaOrdem.addEventListener("submit", async (event) => {
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

        const horasProgramadas =
            parseFloat(
                document.getElementById("campoHorasProgramadas").value
            );

        const dataProgramada =
            document.getElementById("campoDataProgramada").value;

        if (
            !numeroOrdem ||
            !descricao ||
            !centroTrabalho ||
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
                const modalEl =
                    document.getElementById("modalNovaOrdem");

                const modalInst =
                    bootstrap.Modal.getInstance(modalEl);

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

            msgErroModal.textContent =
                "Erro de conexão com o servidor.";

            msgErroModal.classList.remove("d-none");

        } finally {
            btnSalvarOrdem.disabled = false;

            btnSalvarOrdem.innerHTML =
                '<i class="fa-solid fa-floppy-disk me-1"></i> Salvar Ordem';
        }
    });
}

// --------------------------------------------------
// EVENTOS DOS FILTROS
// --------------------------------------------------

btnAtualizarFiltro?.addEventListener("click", carregarOrdens);

filtroStatus?.addEventListener("change", carregarOrdens);

filtroCentro?.addEventListener("change", carregarOrdens);

filtroPesquisa?.addEventListener("keyup", event => {
    if (event.key === "Enter") {
        carregarOrdens();
    }
});

// Carrega os dados ao abrir a página.
carregarOrdens();
