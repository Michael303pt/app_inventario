// Verificar se existe login
const token = localStorage.getItem("token");
if(!token){
    window.location="login.html";
}

// Carregar logs
async function carregarLogs(){
    const resposta = await fetch("/api/logs",{
        headers:{
            "Authorization":"Bearer "+token
        }
    });

    if(resposta.status===401){
        logout();
        return;
    }

    if(!resposta.ok){
        console.error("Erro ao carregar logs:",resposta.status);
        alert("Não foi possível carregar os logs. Tenta novamente mais tarde.");
        mostrar([]);
        return;
    }

    const dados = await resposta.json();
    mostrar(Array.isArray(dados) ? dados : []);
}

// Mostrar tabela
function mostrar(logs){
    let tabela=document.getElementById("tabelaLogs");
    tabela.innerHTML="";

    logs.forEach((log)=>{
        let data=new Date(log.Data).toLocaleDateString("pt-PT");
        tabela.innerHTML += `
        <tr>
            <td>${log.Nome}</td>
            <td>${log.SKU}</td>
            <td>${log["Acao"]}</td>
            <td>${data}</td>
        </tr>
        `;
    });
}

// Voltar ao inventário
function voltar(){
    window.location="index.html";
}

// Logout
function logout(){
    localStorage.removeItem("token");
    window.location="login.html";
}

// iniciar
carregarLogs();