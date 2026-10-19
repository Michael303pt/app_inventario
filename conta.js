/* Verificar login e permissão de admin
(esta página é só para o Admins, quem não for é mandado de volta ao inventário
ia API também bloqueia com 403)*/
const token = localStorage.getItem("token");
const nome = localStorage.getItem("nome");

if(!token){
    window.location="login.html";
}
if(nome !== "Admin"){
    window.location="index.html";
}

//lista local de utilizadores. Os popups usam o índice desta lista para saber quem é quem
let utilizadores=[];

//carregar utilizadores
async function carregarUtilizadores(){
    const resposta = await fetch("/api/utilizadores",{
        headers:{
            "Authorization":"Bearer "+token
        }
    });
    //401 = sessão expirada; 403 = já não é Admin
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

//criar utilizador
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

    // se falhou, mostra a mensagem que veio da API (ex.: nome repetido)
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
// índice do utilizador que está no popup de remoção
let indiceARemover=null;

function abrirPopupRemover(index){
    indiceARemover=index;
    document.getElementById("popupRemoverNome").textContent=utilizadores[index].nome;
    //limpa a password de uma vez anterior, para não ficar lá guardada
    document.getElementById("removerAdminPassword").value="";
    document.getElementById("popupRemoverOverlay").classList.add("aberto");
}

function fecharPopupRemover(){
    document.getElementById("popupRemoverOverlay").classList.remove("aberto");
    indiceARemover=null;
}

async function confirmarRemocao(){
    if(indiceARemover===null) return;

    //por segurança, apagar uma conta exige a password do Admin outra vez
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

//editar utilizador
//indice do utilizador que está no popup de edição
let indiceEmEdicao=null;

function abrirPopupEditar(index){
    indiceEmEdicao=index;
    document.getElementById("editNome").value=utilizadores[index].nome;
    //a password nova fica vazia: se não for preenchida, mantém-se a atual
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
    //tal como na remoção, é preciso confirmar com a password do Admin
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

//mostrar tabela
// redesenha a lista de utilizadores; os botões levam o índice da linha
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

//fechar popups ao clicar fora ou premir Esc
document.addEventListener("DOMContentLoaded",function(){
    //carregar no fundo (e não na caixa) fecha o popup
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

    //o esc fecha os dois
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
