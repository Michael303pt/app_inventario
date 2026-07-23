// Verificar login e permissão de admin
const token = localStorage.getItem("token");
const nome = localStorage.getItem("nome");

if(!token){
    window.location="login.html";
}
if(nome !== "Admin"){
    window.location="index.html";
}

let utilizadores=[];

// Carregar utilizadores
async function carregarUtilizadores(){
    const resposta = await fetch("/api/utilizadores",{
        headers:{
            "Authorization":"Bearer "+token
        }
    });
    if(resposta.status===401){
        logout();
        return;
    }
    if(resposta.status===403){
        window.location="index.html";
        return;
    }
    if(!resposta.ok){
        console.error("Erro ao carregar utilizadores:",resposta.status);
        alert("Não foi possível carregar os utilizadores. Tenta novamente mais tarde.");
        utilizadores=[];
        mostrarUtilizadores();
        return;
    }
    const dados = await resposta.json();
    utilizadores = Array.isArray(dados) ? dados : [];
    if(!Array.isArray(dados)){
        console.error("Resposta inesperada da API:",dados);
    }
    mostrarUtilizadores();
}

// Criar utilizador
async function criarUtilizador(){
    let nomeNovo=document.getElementById("nome").value;
    let passwordNovo=document.getElementById("password").value;

    if(nomeNovo==="" || passwordNovo===""){
        alert("Preencha todos os campos.");
        return;
    }

    const resposta = await fetch("/api/utilizadores",{
        method:"POST",
        headers:{
            "Content-Type":"application/json",
            "Authorization":"Bearer "+token
        },
        body:JSON.stringify({
            nome:nomeNovo,
            password:passwordNovo
        })
    });

    if(!resposta.ok){
        const dados = await resposta.json().catch(()=>({}));
        alert(dados.erro || "Não foi possível criar o utilizador.");
        return;
    }

    document.getElementById("nome").value="";
    document.getElementById("password").value="";
    carregarUtilizadores();
}

// Remover utilizador
let indiceARemover=null;

function abrirPopupRemover(index){
    indiceARemover=index;
    document.getElementById("popupRemoverNome").textContent=utilizadores[index].nome;
    document.getElementById("removerAdminPassword").value="";
    document.getElementById("popupRemoverOverlay").classList.add("aberto");
}

function fecharPopupRemover(){
    document.getElementById("popupRemoverOverlay").classList.remove("aberto");
    indiceARemover=null;
}

async function confirmarRemocao(){
    if(indiceARemover===null) return;

    let adminPassword=document.getElementById("removerAdminPassword").value;
    if(adminPassword===""){
        alert("Confirma a tua password de Admin.");
        return;
    }

    let id=utilizadores[indiceARemover].id;
    const resposta = await fetch("/api/utilizadores/"+id,{
        method:"DELETE",
        headers:{
            "Content-Type":"application/json",
            "Authorization":"Bearer "+token
        },
        body:JSON.stringify({
            adminPassword:adminPassword
        })
    });

    if(!resposta.ok){
        const dados = await resposta.json().catch(()=>({}));
        alert(dados.erro || "Não foi possível remover o utilizador.");
        return;
    }

    fecharPopupRemover();
    carregarUtilizadores();
}

// Editar utilizador
let indiceEmEdicao=null;

function abrirPopupEditar(index){
    indiceEmEdicao=index;
    document.getElementById("editNome").value=utilizadores[index].nome;
    document.getElementById("editPassword").value="";
    document.getElementById("editAdminPassword").value="";
    document.getElementById("popupEditarOverlay").classList.add("aberto");
}

function fecharPopupEditar(){
    document.getElementById("popupEditarOverlay").classList.remove("aberto");
    indiceEmEdicao=null;
}

async function guardarEdicao(){
    if(indiceEmEdicao===null) return;

    let novoNome=document.getElementById("editNome").value;
    let novaPassword=document.getElementById("editPassword").value;
    let adminPassword=document.getElementById("editAdminPassword").value;

    if(novoNome===""){
        alert("O nome não pode ficar vazio.");
        return;
    }
    if(adminPassword===""){
        alert("Confirma a tua password de Admin.");
        return;
    }

    let id=utilizadores[indiceEmEdicao].id;
    const resposta = await fetch("/api/utilizadores/"+id,{
        method:"PUT",
        headers:{
            "Content-Type":"application/json",
            "Authorization":"Bearer "+token
        },
        body:JSON.stringify({
            nome:novoNome,
            password:novaPassword,
            adminPassword:adminPassword
        })
    });

    if(!resposta.ok){
        const dados = await resposta.json().catch(()=>({}));
        alert(dados.erro || "Não foi possível guardar as alterações.");
        return;
    }

    fecharPopupEditar();
    carregarUtilizadores();
}

// Mostrar tabela
function mostrarUtilizadores(){
    let tabela=document.getElementById("tabelaUtilizadores");
    tabela.innerHTML="";
    utilizadores.forEach((item,index)=>{
        tabela.innerHTML += `
        <tr>
            <td>${item.nome}</td>
            <td>
            <button class="change" onclick="abrirPopupEditar(${index})">Editar</button>
            <button class="remover" onclick="abrirPopupRemover(${index})">Remover</button>
            </td>
        </tr>
        `;
    });
}

// Fechar popups ao clicar fora ou premir Esc
document.addEventListener("DOMContentLoaded",function(){
    document.getElementById("popupEditarOverlay").addEventListener("click",function(e){
        if(e.target===this){
            fecharPopupEditar();
        }
    });
    document.getElementById("popupRemoverOverlay").addEventListener("click",function(e){
        if(e.target===this){
            fecharPopupRemover();
        }
    });
 
    document.addEventListener("keydown",function(e){
        if(e.key==="Escape"){
            fecharPopupEditar();
            fecharPopupRemover();
        }
    });
});

function voltar(){
    window.location="index.html";
}

function logout(){
    localStorage.removeItem("token");
    localStorage.removeItem("nome");
    window.location="login.html";
}

// iniciar
carregarUtilizadores();
