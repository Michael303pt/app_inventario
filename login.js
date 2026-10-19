// Chamada quando se carrega no botão de entrar (ver login.html)
async function login(){

    const nome=document.getElementById("nome").value
    const password=document.getElementById("password").value;
    const resposta=await fetch("/api/login",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({nome, password})
    });

    const dados=await resposta.json();
     if(resposta.ok){
         //guardamos o token no localStorage para as outras páginas o usarem nos pedidos
         //e o nome para saber, sem ir ao servidor, se é o Admin
         localStorage.setItem("token", dados.token);
         localStorage.setItem("nome", dados.nome);
         window.location="index.html";
     }else{
         // a API devolve a mensagem de erro já pronta (ex.: "Password errada")
         alert(dados.erro);
     }
}
