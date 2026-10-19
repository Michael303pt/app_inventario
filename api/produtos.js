import { sql } from "../lib/db.js";
import jwt from "jsonwebtoken";
import { registarLog } from "../lib/logs.js";


// Valida o token JWT do cabeçalho Authorization.
// Devolve { id, nome } do utilizador ou null se não for válido.
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

// /api/produtos
//   GET  -> lista todos os produtos
//   POST -> adiciona um produto novo
// Qualquer utilizador com login pode usar (não é preciso ser Admin).
export default async function handler(req,res){
    const utilizador = verificarToken(req);
    if(!utilizador){
        return res.status(401).json({
            erro:"Não autorizado"
        });
    }

    try{
        // LISTAR PRODUTOS
        // os mais recentes aparecem primeiro
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
            // nota: aqui não se valida nada, confia-se no que o frontend envia
            // RETURNING * devolve a linha criada (já com o id gerado pela BD)
            const resultado = await sql`

            INSERT INTO products (produto, quantidade, preco, sku)
            VALUES (${produto}, ${quantidade}, ${preco}, ${sku}) RETURNING *`;
            await registarLog(utilizador.nome, "Adicionou produto", resultado[0].sku);
            return res.json(resultado[0]);
        }
        // qualquer outro método (PUT, DELETE...) não é suportado nesta rota
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
