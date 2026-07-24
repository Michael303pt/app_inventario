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
         localStorage.setItem("token", dados.token);
+        localStorage.setItem("nome", dados.nome);
         window.location="index.html";
     }else{
         alert(dados.erro);
     }
}