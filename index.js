// Verificar se existe login
const token = localStorage.getItem("token");
const nome = localStorage.getItem("nome");
if (!token) {
    window.location = "login.html";
}
/* carregar produtos
lista local com os produtos que vieram da API
as funções abaixo usam o índice desta lista (não o da BD) para saber em que linha se clicou */
let inventario = [];


// Mostrar botão de conta apenas ao Admin, mas a API tb protege mostrando o erro 403
document.addEventListener("DOMContentLoaded", function () {
    if (nome === "Admin") {
        document.getElementById("btnConta").style.display = "inline-block";
    }
});

function irParaConta() {
    window.location = "conta.html";
}



async function carregarProdutos() {
    const resposta = await fetch("/api/produtos", {
        headers: {
            "Authorization": "Bearer " + token
        }
    });
    //token expirado ou inválido: volta ao login
    if (resposta.status === 401) {
        logout();
        return;
    }
    if (!resposta.ok) {
        console.error("Erro ao carregar produtos:", resposta.status);
        alert("Não foi possível carregar os produtos. Tenta novamente mais tarde.");
        inventario = [];
        mostrar();
        return;
    }
    const dados = await resposta.json();
    // se a API devolver outra coisa que não uma lista, não deixa a tabela rebentar
    inventario = Array.isArray(dados) ? dados : [];
    if (!Array.isArray(dados)) {
        console.error("Resposta inesperada da API:", dados);
    }
    mostrar();
}
//adicionar produto
async function adicionar() {
    let produto = document.getElementById("produto").value;

    let quantidade = parseInt(
        document.getElementById("quantidade").value
    );
    let preco = parseFloat(
        document.getElementById("preco").value
    );
    let sku = document.getElementById("sku").value;

    //o SKU não é validado de proposito (pode ficar vazio), o resto é obrigatório
    if (produto === "" || isNaN(quantidade) || isNaN(preco)) {
        alert("Preencha todos os campos.");
        return;
    }
    //não se verifica se o pedido correu bem; se falhar, os campos limpam na mesma
    await fetch("/api/produtos", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
            produto: produto,
            quantidade: quantidade,
            preco: preco,
            sku: sku
        })
    });
    //limpa o formulário e recarrega a lista para aparecer o produto novo
    document.getElementById("produto").value = "";
    document.getElementById("quantidade").value = "";
    document.getElementById("preco").value = "";
    document.getElementById("sku").value = "";
    carregarProdutos();
}
// Remover produto
// recebe a posição na lista e usa-a para ir buscar o id real do produto
async function remover(index) {
    let id = inventario[index].id;
    await fetch("/api/produtos/" + id, {
        method: "DELETE",
        headers: {
            "Authorization": "Bearer " + token
        }
    });
    carregarProdutos();
}

// guarda qual o produto que está a ser editado enquanto o popup está aberto
let indiceEmEdicao = null;

function change(index) {
    indiceEmEdicao = index;
    let item = inventario[index];

    //preenche o popup com o nome do produto e a quantidade atual
    document.getElementById("popupProduto").textContent = item.produto;
    document.getElementById("popupQuantidade").value = item.quantidade;
    document.getElementById("popupOverlay").classList.add("aberto");
}

function fecharPopup() {
    document.getElementById("popupOverlay").classList.remove("aberto");
    indiceEmEdicao = null;
}

// Botões "+" e "-"
function alterarQuantidade(delta) {
    let input = document.getElementById("popupQuantidade");
    let valor = parseInt(input.value);
    //se o campo estiver vazio ou com lixo, começa do zero
    if (isNaN(valor)) valor = 0;
    valor += delta;
    // não deixa ficar negativo
    if (valor < 0) valor = 0;
    input.value = valor;
}

async function guardarQuantidade() {
    //se não houver nenhum produto em edição, não faz nada
    if (indiceEmEdicao === null) return;

    let novaQuantidade = parseInt(document.getElementById("popupQuantidade").value);
    if (isNaN(novaQuantidade) || novaQuantidade < 0) {
        alert("Introduz uma quantidade válida.");
        return;
    }

    let id = inventario[indiceEmEdicao].id;
    await fetch("/api/produtos/" + id, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
            quantidade: novaQuantidade
        })
    });

    fecharPopup();
    carregarProdutos();
}

//mostrar tabela
// refaz a tabela do zero sempre que a lista muda
function mostrar() {
    let tabela = document.getElementById("tabela");
    tabela.innerHTML = "";
    //o total é calculado, mas nunca é mostrado em lado nenhum
    let total = 0;
    inventario.forEach((item, index) => {
        let subtotal = item.quantidade * Number(item.preco);
        total += subtotal;
        // o preço vem da BD como texto (campo numerico), por isso é preciso o Number()
        // o onclick leva o índice da linha, que depois é usado em remover()/change()
        tabela.innerHTML += `
        <tr>
            <td>${item.produto}</td>
            <td>${item.quantidade}</td>
            <td>${Number(item.preco)} € </td>
            <td>${item.sku}</td>
            <td>
                <button class="remover" onclick="remover(${index})">Remover</button>
                <button class="change" onclick="change(${index})">Change</button>
            </td>
        </tr>
        `;
    });
}
// Logout
// apaga a sessão guardada no browser e volta ao ecrã de login
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("nome");
    window.location = "login.html";
}
//fechar popup ao carregar fora ou premir Esc
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("popupOverlay").addEventListener("click", function (e) {
        // só fecha se o clique foi no fundo e não dentro da caixa
        if (e.target === this) {
            fecharPopup();
        }
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            fecharPopup();
        }
    });
});
// vai para a página dos logs
function logs() {
    window.location = "logs.html";
}
// iniciar
carregarProdutos();
