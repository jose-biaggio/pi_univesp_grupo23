import { Auth } from "./auth.js";
import { apiFetch } from "./api.js";
import { inicializarLayout } from "./app.js";

Auth.exigirAutenticacao();
inicializarLayout();

const elTotalOrdens = document.getElementById("kpiTotalOrdens");
const elHorasProg = document.getElementById("kpiHorasProgramadas");
const elBacklog = document.getElementById("kpiBacklog");
const elTaxaConclusao = document.getElementById("kpiTaxaConclusao");

const elQtdNaoApontadas = document.getElementById("qtdNaoApontadas");
const elBarraNaoApontadas = document.getElementById("barraNaoApontadas");

const elQtdEmAndamento = document.getElementById("qtdEmAndamento");
const elBarraEmAndamento = document.getElementById("barraEmAndamento");

const elQtdConcluidas = document.getElementById("qtdConcluidas");
const elBarraConcluidas = document.getElementById("barraConcluidas");

const elListaCentros = document.getElementById("listaCentros");

async function carregarIndicadores() {
    try {
        const response = await apiFetch("/ordens/");
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: Falha ao buscar ordens para indicadores`);
        }

        const ordens = await response.json();
        processarDados(ordens);
    } catch (error) {
        console.error("Erro ao carregar indicadores:", error);
        if (elListaCentros) {
            elListaCentros.innerHTML = `
                <li class="list-group-item text-danger py-3">
                    <i class="fa-solid fa-triangle-exclamation me-2"></i>Erro ao carregar indicadores.
                </li>
            `;
        }
    }
}

function processarDados(ordens) {
    const total = ordens.length;
    const totalHoras = ordens.reduce((acc, o) => acc + (Number(o.horas_programadas) || 0), 0);

    const naoApontadas = ordens.filter(o => o.status === "NAO_APONTADO").length;
    const emAndamento = ordens.filter(o => o.status === "EM_ANDAMENTO").length;
    const concluidas = ordens.filter(o => o.status === "CONCLUIDO").length;

    const taxa = total > 0 ? Math.round((concluidas / total) * 100) : 0;

    if (elTotalOrdens) elTotalOrdens.textContent = total;
    if (elHorasProg) elHorasProg.textContent = `${totalHoras.toFixed(1)} h`;
    if (elBacklog) elBacklog.textContent = naoApontadas;
    if (elTaxaConclusao) elTaxaConclusao.textContent = `${taxa}%`;

    if (elQtdNaoApontadas) elQtdNaoApontadas.textContent = naoApontadas;
    if (elBarraNaoApontadas) {
        const pct = total > 0 ? (naoApontadas / total) * 100 : 0;
        elBarraNaoApontadas.style.width = `${pct}%`;
    }

    if (elQtdEmAndamento) elQtdEmAndamento.textContent = emAndamento;
    if (elBarraEmAndamento) {
        const pct = total > 0 ? (emAndamento / total) * 100 : 0;
        elBarraEmAndamento.style.width = `${pct}%`;
    }

    if (elQtdConcluidas) elQtdConcluidas.textContent = concluidas;
    if (elBarraConcluidas) {
        const pct = total > 0 ? (concluidas / total) * 100 : 0;
        elBarraConcluidas.style.width = `${pct}%`;
    }

    renderizarCentros(ordens);
}

function renderizarCentros(ordens) {
    if (!elListaCentros) return;

    if (ordens.length === 0) {
        elListaCentros.innerHTML = '<li class="list-group-item text-muted">Nenhum centro de trabalho registrado.</li>';
        return;
    }

    const mapaCentros = {};
    ordens.forEach(o => {
        const centro = o.centro_trabalho || "Geral";
        mapaCentros[centro] = (mapaCentros[centro] || 0) + 1;
    });

    elListaCentros.innerHTML = Object.entries(mapaCentros)
        .sort((a, b) => b[1] - a[1])
        .map(([centro, qtd]) => `
            <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                <span><i class="fa-solid fa-wrench me-2 text-secondary"></i>${centro}</span>
                <span class="badge bg-primary rounded-pill">${qtd} ordens</span>
            </li>
        `)
        .join("");
}

carregarIndicadores();
