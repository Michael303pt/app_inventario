import { sql } from "../lib/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

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

// /api/utilizadores   (só o Admin pode usar)
//   GET  -> lista os utilizadores
//   POST -> cria um utilizador novo
export default async function handler(req,res){
    const utilizador = verificarToken(req);
    if(!utilizador){
        return res.status(401).json({
            erro:"Não autorizado"
        });
    }
    // 401 = não estás autenticado, 403 = estás autenticado mas não tens permissão
    // o "Admin" é identificado pelo nome que vem dentro do token
    if(utilizador.nome !== "Admin"){
        return res.status(403).json({
            erro:"Acesso restrito ao Admin"
        });
    }

    try{
        // LISTAR UTILIZADORES
        // só pedimos id e nome, para a password (mesmo com hash) nunca sair da BD
        if(req.method==="GET"){
            const utilizadores = await sql`SELECT id, nome FROM users ORDER BY id DESC`;
            return res.json(utilizadores);
        }
        // CRIAR UTILIZADOR
        if(req.method==="POST"){
            const {
                nome,
                password
            }=req.body;

            if(!nome || !password){
                return res.status(400).json({
                    erro:"Preenche todos os campos"
                });
            }

            // os nomes são usados para fazer login, por isso não podem repetir
            const existente = await sql`SELECT id FROM users WHERE nome=${nome}`;
            if(existente.length > 0){
                return res.status(409).json({
                    erro:"Já existe um utilizador com esse nome"
                });
            }

            // nunca se guarda a password em texto, só o hash (10 = custo do bcrypt)
            const passwordEncriptada = await bcrypt.hash(password, 10);

            const resultado = await sql`
            INSERT INTO users (nome, password)
            VALUES (${nome}, ${passwordEncriptada})
            RETURNING id, nome`;
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
