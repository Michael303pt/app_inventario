require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");

const app = express();


// permite receber JSON
app.use(express.json());


// permite abrir o index.html
app.use(express.static(__dirname));

console.log("DATABASE_URL =", process.env.DATABASE_URL);
// ligação ao Neon
const pool = new Pool({

    connectionString: process.env.DATABASE_URL,

    ssl:{
        rejectUnauthorized:false
    }

});



// teste da página inicial
app.get("/", (req,res)=>{

    res.sendFile(__dirname + "/index.html");

});




// listar produtos
app.get("/api/produtos", async(req,res)=>{

    try{

        const resultado = await pool.query(
            "SELECT * FROM produtos ORDER BY id"
        );

        res.json(resultado.rows);

    }catch(erro){

        console.log(erro);

        res.status(500).json({
            erro:"Erro ao buscar produtos"
        });

    }

});




// adicionar produto
app.post("/api/produtos", async(req,res)=>{


    try{


        const {
            produto,
            quantidade,
            preco

        } = req.body;



        const resultado = await pool.query(

            `
            INSERT INTO produtos
            (produto, quantidade, preco)

            VALUES
            ($1,$2,$3)

            RETURNING *
            `,

            [
                produto,
                quantidade,
                preco
            ]

        );


        res.json(resultado.rows[0]);


    }catch(erro){

        console.log(erro);

        res.status(500).json({
            erro:"Erro ao inserir produto"
        });

    }


});





// remover produto
app.delete("/api/produtos/:id", async(req,res)=>{


    try{


        await pool.query(

            "DELETE FROM produtos WHERE id=$1",

            [
                req.params.id
            ]

        );


        res.json({
            sucesso:true
        });


    }catch(erro){

        console.log(erro);

        res.status(500).json({
            erro:"Erro ao remover"
        });

    }


});





app.listen(3000,()=>{

    console.log(
        "Servidor ativo em http://localhost:3000"
    );

});