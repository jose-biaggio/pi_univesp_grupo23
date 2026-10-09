class AppSidebar extends HTMLElement {
    connectedCallback() {
        const path = window.location.pathname;
        const paginaDetectada = path.includes("programacao")
            ? "programacao"
            : path.includes("apontamentos")
                ? "apontamentos"
                : path.includes("indicadores")
                    ? "indicadores"
                    : path.includes("dashboard")
                        ? "dashboard"
                        : "";

        const ativa = (this.getAttribute("active") || paginaDetectada).toLowerCase();

        this.innerHTML = `
        <aside class="sidebar">
            <div class="logo">
                <i class="fa-solid fa-gears"></i>
                <div class="logo-text">
                    <h4>Manutenção Sync</h4>
                </div>
            </div>

            <nav>
                <a href="dashboard.html" class="${ativa === "dashboard" ? "active" : ""}">
                    <i class="fa-solid fa-house"></i>
                    <span>Dashboard</span>
                </a>

                <a href="programacao.html" class="${ativa === "programacao" ? "active" : ""}">
                    <i class="fa-solid fa-calendar-days"></i>
                    <span>Programação</span>
                </a>

                <a href="apontamentos.html" class="${ativa === "apontamentos" ? "active" : ""}">
                    <i class="fa-solid fa-clipboard-check"></i>
                    <span>Apontamentos</span>
                </a>

                <a href="indicadores.html" class="${ativa === "indicadores" ? "active" : ""}">
                    <i class="fa-solid fa-chart-column"></i>
                    <span>Indicadores</span>
                </a>
            </nav>
        </aside>
        `;
    }
}

if (!customElements.get("app-sidebar")) {
    customElements.define("app-sidebar", AppSidebar);
}

export { AppSidebar };
