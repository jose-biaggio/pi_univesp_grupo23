import { Auth } from "./auth.js";
import { apiFetch } from "./api.js";
import { bootstrap, inicializarLayout, formatarData, obterBadgeStatus } from "./app.js";

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

async function carregarOrdens() {
    if (!tabela) return;

    tabela.innerHTML = `
        <tr>
            <td colspan="8" class="text-center py-4">
                <i class="fa-solid fa-spinner fa-spin me-2"></i> Carregando ordens de manutenção...
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
        renderizarTabela(ordens);
        atualizarKPIs(ordens);
        atualizarCentrosDisponiveis(ordens);
    } catch (error) {
        console.error("Erro ao carregar ordens:", error);
        tabela.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-danger py-4">
                    <i class="fa-solid fa-triangle-exclamation me-2"></i>
                    Não foi possível carregar as ordens. Verifique a conexão com o servidor.
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
        return;
    }

    tabela.innerHTML = ordens.map(ordem => `
        <tr>
            <td><strong>${ordem.numero_ordem}</strong></td>
            <td>${ordem.descricao}</td>
            <td>${ordem.operacao || "0010"}</td>
            <td>${ordem.centro_trabalho}</td>
            <td>${Number(ordem.horas_programadas).toFixed(1)} h</td>
            <td>${formatarData(ordem.data_programada)}</td>
            <td>${obterBadgeStatus(ordem.status)}</td>
            <td>
                <button class="btn btn-outline-primary btn-sm" title="Editar ordem" onclick="alert('Edição da ordem ' + '${ordem.numero_ordem}')">
                    <i class="fa-solid fa-pen"></i>
                </button>
            </td>
        </tr>
    `).join("");
}

function atualizarKPIs(ordens) {
    const totalOrdens = ordens.length;
    const totalHoras = ordens.reduce((acc, o) => acc + (Number(o.horas_programadas) || 0), 0);

    if (kpiOrdens) kpiOrdens.textContent = totalOrdens;
    if (kpiHorasProg) kpiHorasProg.textContent = `${totalHoras.toFixed(1)} h`;
    if (kpiHorasApont) kpiHorasApont.textContent = "0.0 h";
    if (kpiAderencia) kpiAderencia.textContent = "0%";
}

function atualizarCentrosDisponiveis(ordens) {
    let mudou = false;
    ordens.forEach(o => {
        if (o.centro_trabalho && !centrosConhecidos.has(o.centro_trabalho)) {
            centrosConhecidos.add(o.centro_trabalho);
            mudou = true;
        }
    });

    if (mudou && filtroCentro) {
        const valorAtual = filtroCentro.value;
        filtroCentro.innerHTML = '<option value="">Todos os Centros</option>' +
            Array.from(centrosConhecidos)
                .sort()
                .map(c => `<option value="${c}" ${c === valorAtual ? "selected" : ""}>${c}</option>`)
                .join("");
    }
}

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

    formNovaOrdem.addEventListener("submit", async (e) => {
        e.preventDefault();
        msgErroModal.classList.add("d-none");
        msgErroModal.textContent = "";

        const numeroOrdem = document.getElementById("campoNumeroOrdem").value.trim();
        const descricao = document.getElementById("campoDescricao").value.trim();
        const operacao = document.getElementById("campoOperacao").value.trim() || "0010";
        const centroTrabalho = document.getElementById("campoCentroTrabalho").value.trim();
        const horasProgramadas = parseFloat(document.getElementById("campoHorasProgramadas").value);
        const dataProgramada = document.getElementById("campoDataProgramada").value;

        if (!numeroOrdem || !descricao || !centroTrabalho || isNaN(horasProgramadas) || !dataProgramada) {
            msgErroModal.textContent = "Por favor, preencha todos os campos obrigatórios.";
            msgErroModal.classList.remove("d-none");
            return;
        }

        btnSalvarOrdem.disabled = true;
        btnSalvarOrdem.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Salvando...';

        try {
            const response = await apiFetch("/ordens/", {
                method: "POST",
                body: JSON.stringify({
                    numero_ordem: numeroOrdem,
                    descricao: descricao,
                    operacao: operacao,
                    centro_trabalho: centroTrabalho,
                    horas_programadas: horasProgramadas,
                    data_programada: new Date(dataProgramada).toISOString(),
                    status: "NAO_APONTADO",
                }),
            });

            const data = await response.json();

            if (response.ok) {
                const modalEl = document.getElementById("modalNovaOrdem");
                const modalInst = bootstrap.Modal.getInstance(modalEl);
                if (modalInst) modalInst.hide();

                formNovaOrdem.reset();
                await carregarOrdens();
            } else {
                let msg = "Erro ao cadastrar ordem.";
                if (data && data.detail) {
                    msg = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
                }
                msgErroModal.textContent = msg;
                msgErroModal.classList.remove("d-none");
            }
        } catch (error) {
            msgErroModal.textContent = "Erro de conexão com o servidor.";
            msgErroModal.classList.remove("d-none");
        } finally {
            btnSalvarOrdem.disabled = false;
            btnSalvarOrdem.innerHTML = '<i class="fa-solid fa-floppy-disk me-1"></i> Salvar Ordem';
        }
    });
}

btnAtualizarFiltro?.addEventListener("click", carregarOrdens);
filtroStatus?.addEventListener("change", carregarOrdens);
filtroCentro?.addEventListener("change", carregarOrdens);
filtroPesquisa?.addEventListener("keyup", (e) => {
    if (e.key === "Enter") carregarOrdens();
});

carregarOrdens();