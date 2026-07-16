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
    let emailNovo=document.getElementById("email").value;
    let passwordNovo=document.getElementById("password").value;

    if(nomeNovo==="" || emailNovo==="" || passwordNovo===""){
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
            email:emailNovo,
            password:passwordNovo
        })
    });

    if(!resposta.ok){
        const dados = await resposta.json().catch(()=>({}));
        alert(dados.erro || "Não foi possível criar o utilizador.");
        return;
    }

    document.getElementById("nome").value="";
    document.getElementById("email").value="";
    document.getElementById("password").value="";
    carregarUtilizadores();
}

// Remover utilizador
async function removerUtilizador(index){
    let id=utilizadores[index].id;
    await fetch("/api/utilizadores/"+id,{
        method:"DELETE",
        headers:{
            "Authorization":"Bearer "+token
        }
    });
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
            <td>${item.email}</td>
            <td>
                <button class="remover" onclick="removerUtilizador(${index})">Remover</button>
            </td>
        </tr>
        `;
    });
}

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
