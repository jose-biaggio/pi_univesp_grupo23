import { Auth } from "./auth.js";
import "./components/sidebar.js";

import * as bootstrap from "https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/+esm";
window.bootstrap = bootstrap;
export { bootstrap };

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
});

export function inicializarLayout() {
    const usuario = Auth.getUser();
    const elNome = document.getElementById("usuarioLogadoNome");
    if (elNome && usuario?.nome) {
        elNome.textContent = usuario.nome;
    }
    document.getElementById("btnSair")?.addEventListener("click", Auth.logout);
    document.getElementById("toggleSidebar")?.addEventListener("click", () => {
        document.querySelector(".sidebar")?.classList.toggle("collapsed");
    });
}

export function formatarData(dataIso) {
    if (!dataIso) return "-";
    try {
        return formatadorData.format(new Date(dataIso));
    } catch {
        return dataIso;
    }
}

export function obterBadgeStatus(status) {
    const mapas = {
        NAO_APONTADO: '<span class="badge bg-secondary">Não Apontado</span>',
        EM_ANDAMENTO: '<span class="badge bg-warning text-dark">Em Andamento</span>',
        CONCLUIDO: '<span class="badge bg-success">Concluído</span>',
        CANCELADO: '<span class="badge bg-danger">Cancelado</span>',
    };
    return mapas[status] ?? `<span class="badge bg-light text-dark">${status}</span>`;
}