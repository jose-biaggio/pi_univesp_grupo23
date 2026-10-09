// ========================
// MENU LATERAL
// ========================

const toggleSidebar =
document.getElementById("toggleSidebar");

const sidebar =
document.querySelector(".sidebar");

toggleSidebar.addEventListener("click", () => {

    sidebar.classList.toggle("collapsed");

});


// ========================
// DADOS DE EXEMPLO
// ========================

const dados = [

{
    ordem: "10001",
    descricao: "Troca de Rolamento",
    operacao: "0010",
    centro: "Oficina Mecânica",
    programado: 8,
    apontado: 4,
    status: "andamento"
},

{
    ordem: "10002",
    descricao: "Revisão Redutor",
    operacao: "0020",
    centro: "Mecânica Geral",
    programado: 6,
    apontado: 6,
    status: "apontado"
},

{
    ordem: "10003",
    descricao: "Manutenção Preventiva",
    operacao: "0010",
    centro: "Utilidades",
    programado: 4,
    apontado: 0,
    status: "nao-apontado"
}

];


// ========================
// TABELA
// ========================

const tabela =
document.getElementById("tabelaProgramacao");

function obterStatus(status) {

    switch(status) {

        case "apontado":
            return "Apontado";

        case "nao-apontado":
            return "Não Apontado";

        case "andamento":
            return "Em Andamento";

        default:
            return status;
    }
}

dados.forEach(item => {

    tabela.innerHTML += `

        <tr>

            <td>${item.ordem}</td>

            <td>${item.descricao}</td>

            <td>${item.operacao}</td>

            <td>${item.centro}</td>

            <td>${item.programado} h</td>

            <td>${item.apontado} h</td>

            <td>

                <span class="badge-status ${item.status}">
                    ${obterStatus(item.status)}
                </span>

            </td>

            <td>

                <button
                    class="btn btn-primary btn-sm">

                    <i class="fa-solid fa-pen"></i>
                    Editar

                </button>

            </td>

        </tr>

    `;
});


// ========================
// KPIs AUTOMÁTICOS
// ========================

const totalOrdens =
dados.length;

const totalProgramado =
dados.reduce(
    (total, item) => total + item.programado,
    0
);

const totalApontado =
dados.reduce(
    (total, item) => total + item.apontado,
    0
);

const aderencia =
Math.round(
    (totalApontado / totalProgramado) * 100
);

console.log("Ordens:", totalOrdens);
console.log("Programado:", totalProgramado);
console.log("Apontado:", totalApontado);
console.log("Aderência:", aderencia + "%");