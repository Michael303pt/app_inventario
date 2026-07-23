import { sql } from "../../lib/db.js";
import jwt from "jsonwebtoken";

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

async function verificarPasswordAdmin(adminId, adminPassword){
    if(!adminPassword) return false;
    const admin = await sql`SELECT password FROM users WHERE id=${adminId}`;
    if(admin.length === 0) return false;
    return bcrypt.compare(adminPassword, admin[0].password);
}

export default async function handler(req,res){
    const utilizador = verificarToken(req);
    if(!utilizador){
        return res.status(401).json({
            erro:"Não autorizado"
        });
    }
    if(utilizador.nome !== "Admin"){
        return res.status(403).json({
            erro:"Acesso restrito ao Admin"
        });
    }

    const { id } = req.query;

    try{
        // REMOVER UTILIZADOR
        if(req.method==="DELETE"){
            if(Number(id) === utilizador.id){
                return res.status(400).json({
                    erro:"Não podes remover a tua própria conta"
                });
            }

            const alvo = await sql`SELECT nome FROM users WHERE id=${id}`;
            if(alvo.length === 0){
                return res.status(404).json({
                    erro:"Utilizador não encontrado"
                });
            }
            if(alvo[0].nome === "Admin"){
                return res.status(400).json({
                    erro:"Não é possível remover a conta Admin"
                });
            }

            await sql`DELETE FROM users WHERE id=${id}`;
            return res.json({
                sucesso:true
            });
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
