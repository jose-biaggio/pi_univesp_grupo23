import { Auth } from "./auth.js";
import { bootstrap, inicializarLayout } from "./app.js";

Auth.exigirAutenticacao();
inicializarLayout();

const KEY_STORAGE_DASH = "url_dashboard";

const URL_DASHBOARD = "https://datastudio.google.com/embed/reporting/96ac3ed0-e513-4e3e-b003-310a64822990/page/p9xAG";

const iframe = document.getElementById("lookerIframe");
const inputUrl = document.getElementById("inputUrlLooker");
const formConfig = document.getElementById("formConfigLink");
const btnRestaurarPadrao = document.getElementById("btnRestaurarPadrao");
const btnRecarregar = document.getElementById("btnRecarregarIframe");

function obterUrlLooker() {
    return localStorage.getItem(KEY_STORAGE_DASH) || URL_DASHBOARD;
}


const urlAtual = obterUrlLooker();
aplicarUrlLooker(urlAtual);

btnRecarregar?.addEventListener("click", () => {
    if (iframe) {
        const srcAtual = iframe.src;
        iframe.src = "";
        setTimeout(() => {
            iframe.src = srcAtual;
        }, 150);
    }
});

formConfig?.addEventListener("submit", (e) => {
    e.preventDefault();
    const novaUrl = inputUrl.value.trim();

    if (novaUrl) {
        localStorage.setItem(KEY_STORAGE_DASH, novaUrl);
        aplicarUrlLooker(novaUrl);

        const modalEl = document.getElementById("modalConfigLink");
        const modalInst = bootstrap.Modal.getInstance(modalEl);
        modalInst?.hide();
    }
});

btnRestaurarPadrao?.addEventListener("click", () => {
    localStorage.removeItem(KEY_STORAGE_DASH);
    aplicarUrlLooker(URL_DASHBOARD);

    const modalEl = document.getElementById("modalConfigLink");
    const modalInst = bootstrap.Modal.getInstance(modalEl);
    modalInst?.hide();
});
