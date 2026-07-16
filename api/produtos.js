import { sql } from "../lib/db.js";
import jwt from "jsonwebtoken";
import { registarLog } from "../lib/logs.js";


function verificarToken(req){
    const auth = req.headers.authorization;

    if(!auth){
        return null;
    }
    const token = auth.split(" ")[1];
    try{
        return jwt.verify(
            token,
            process.env.JWT_SECRET
        );
    }catch{
        return null;
    }
}

export default async function handler(req,res){
    const utilizador = verificarToken(req);
    if(!utilizador){
        return res.status(401).json({
            erro:"Não autorizado"
        });
    }

    try{
        // LISTAR PRODUTOS
        if(req.method==="GET"){
            const produtos = await sql`SELECT * FROM products ORDER BY id DESC`;
            return res.json(produtos);
        }
        // ADICIONAR PRODUTO
        if(req.method==="POST"){
            const {
                produto,
                quantidade,
                preco,
                sku
            }=req.body;
            const resultado = await sql`

            INSERT INTO products (produto, quantidade, preco, sku)
            VALUES (${produto}, ${quantidade}, ${preco}, ${sku}) RETURNING *`;
            await registarLog(utilizador.nome, "Adicionou produto", resultado[0].sku);
            return res.json(resultado[0]);
        }
        return res.status(405).json({
            erro:"Método inválido"
        });

    }catch(erro){
        console.log(erro);
        return res.status(500).json({
            erro:"Erro no servidor"
        });
    }
}