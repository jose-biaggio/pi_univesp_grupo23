import { Auth } from "./auth.js";
import { bootstrap, inicializarLayout } from "./app.js";

Auth.exigirAutenticacao();
inicializarLayout();

const apontamentos = [

{
    data: "26/05/2025 08:15",
    ordem: "10001",
    descricao: "Troca de Rolamento",
    operacao: "0010",
    centro: "Oficina Mecânica",
    horas: 4,
    operador: "Carlos Souza",
    status: "Parcial"
},

{
    data: "26/05/2025 10:30",
    ordem: "10002",
    descricao: "Revisão do Redutor",
    operacao: "0020",
    centro: "Mecânica Geral",
    horas: 6,
    operador: "Ana Pereira",
    status: "Concluído"
}

];

const tabela =
document.getElementById("tabelaApontamentos");

apontamentos.forEach(item => {

    let classeStatus = "";

    if(item.status === "Concluído")
        classeStatus = "status-concluido";

    if(item.status === "Parcial")
        classeStatus = "status-parcial";

    if(item.status === "Em Andamento")
        classeStatus = "status-andamento";

    tabela.innerHTML += `

    <tr>

        <td>${item.data}</td>

        <td>${item.ordem}</td>

        <td>${item.descricao}</td>

        <td>${item.operacao}</td>

        <td>${item.centro}</td>

        <td>${item.horas} h</td>

        <td>${item.operador}</td>

        <td>

            <span class="badge ${classeStatus}">
                ${item.status}
            </span>

        </td>

        <td>

            <button
                class="btn btn-primary btn-sm">

                <i class="fa-solid fa-pen"></i>

            </button>

            <button
                class="btn btn-danger btn-sm">

                <i class="fa-solid fa-trash"></i>

            </button>

        </td>

    </tr>

    `;
});