// Verificar se existe login
const token = localStorage.getItem("token");
if(!token){
    window.location="login.html";
}
// Carregar produtos
let inventario=[];


async function carregarProdutos(){
    const resposta = await fetch("/api/produtos",{
        headers:{
            "Authorization":"Bearer "+token
        }
    });
    if(resposta.status===401){
        logout();
        return;
    }
    if(!resposta.ok){
        console.error("Erro ao carregar produtos:",resposta.status);
        alert("Não foi possível carregar os produtos. Tenta novamente mais tarde.");
        inventario=[];
        mostrar();
        return;
    }
    const dados = await resposta.json();
    inventario = Array.isArray(dados) ? dados : [];
    if(!Array.isArray(dados)){
        console.error("Resposta inesperada da API:",dados);
    }
    mostrar();
}
// Adicionar produto
async function adicionar(){
    let produto=document.getElementById("produto").value;

    let quantidade=parseInt(
        document.getElementById("quantidade").value
    );
    let preco=parseFloat(
        document.getElementById("preco").value
    );
    let sku=document.getElementById("sku").value
    ;

    if(produto==="" || isNaN(quantidade) || isNaN(preco)){
        alert("Preencha todos os campos.");
        return;
    }
    await fetch("/api/produtos",{
        method:"POST",
        headers:{
            "Content-Type":"application/json",
            "Authorization":"Bearer "+ token
        },
        body:JSON.stringify({
            produto:produto,
            quantidade:quantidade,
            preco:preco,
            sku:sku
        })
    });
    document.getElementById("produto").value="";
    document.getElementById("quantidade").value="";
    document.getElementById("preco").value="";
    document.getElementById("sku").value="";
    carregarProdutos();
}
// Remover produto
async function remover(index){
    let id=inventario[index].id;
    await fetch("/api/produtos/"+id,{
        method:"DELETE",
        headers:{
            "Authorization":"Bearer "+token
        }
    });
    carregarProdutos();
}

// Popup para alterar quantidade
let indiceEmEdicao=null;

function change(index){
    indiceEmEdicao=index;
    let item=inventario[index];

    document.getElementById("popupProduto").textContent=item.produto;
    document.getElementById("popupQuantidade").value=item.quantidade;
    document.getElementById("popupOverlay").classList.add("aberto");
}

function fecharPopup(){
    document.getElementById("popupOverlay").classList.remove("aberto");
    indiceEmEdicao=null;
}

function alterarQuantidade(delta){
    let input=document.getElementById("popupQuantidade");
    let valor=parseInt(input.value);
    if(isNaN(valor)) valor=0;
    valor+=delta;
    if(valor<0) valor=0;
    input.value=valor;
}

async function guardarQuantidade(){
    if(indiceEmEdicao===null) return;

    let novaQuantidade=parseInt(document.getElementById("popupQuantidade").value);
    if(isNaN(novaQuantidade) || novaQuantidade<0){
        alert("Introduz uma quantidade válida.");
        return;
    }

    let id=inventario[indiceEmEdicao].id;
    await fetch("/api/produtos/"+id,{
        method:"PUT",
        headers:{
            "Content-Type":"application/json",
            "Authorization":"Bearer "+token
        },
        body:JSON.stringify({
            quantidade:novaQuantidade
        })
    });

    fecharPopup();
    carregarProdutos();
}

// Mostrar tabela
function mostrar(){
    let tabela=document.getElementById("tabela");
    tabela.innerHTML="";
    let total=0;
    inventario.forEach((item,index)=>{
        let subtotal=item.quantidade * Number(item.preco);
        total += subtotal;
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
function logout(){
    localStorage.removeItem("token");
    window.location="login.html";
}
// Fechar popup ao clicar fora ou premir Esc
document.addEventListener("DOMContentLoaded",function(){
    document.getElementById("popupOverlay").addEventListener("click",function(e){
        if(e.target===this){
            fecharPopup();
        }
    });

    document.addEventListener("keydown",function(e){
        if(e.key==="Escape"){
            fecharPopup();
        }
    });
});

// iniciar
carregarProdutos();