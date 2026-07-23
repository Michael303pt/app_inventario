import { sql } from "../../lib/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

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

            const { adminPassword } = req.body;
 
            const passwordAdminValida = await verificarPasswordAdmin(utilizador.id, adminPassword);
            if(!passwordAdminValida){
                return res.status(401).json({
                    erro:"Password de Admin incorreta"
                });
            }

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

        // EDITAR UTILIZADOR (nome e/ou password)
        if(req.method==="PUT"){
            const { nome, password, adminPassword } = req.body;
 
            const passwordAdminValida = await verificarPasswordAdmin(utilizador.id, adminPassword);
            if(!passwordAdminValida){
                return res.status(401).json({
                    erro:"Password de Admin incorreta"
                });
            }
 
            if(!nome){
                return res.status(400).json({
                    erro:"O nome é obrigatório"
                });
            }
 
            const alvo = await sql`SELECT nome FROM users WHERE id=${id}`;
            if(alvo.length === 0){
                return res.status(404).json({
                    erro:"Utilizador não encontrado"
                });
            }
            if(alvo[0].nome === "Admin" && nome !== "Admin"){
                return res.status(400).json({
                    erro:"Não é possível alterar o nome da conta Admin"
                });
            }
 
            if(nome !== alvo[0].nome){
                const existente = await sql`SELECT id FROM users WHERE nome=${nome} AND id<>${id}`;
                if(existente.length > 0){
                    return res.status(409).json({
                        erro:"Já existe um utilizador com esse nome"
                    });
                }
            }
 
            if(password){
                const passwordEncriptada = await bcrypt.hash(password, 10);
                await sql`UPDATE users SET nome=${nome}, password=${passwordEncriptada} WHERE id=${id}`;
            }else{
                await sql`UPDATE users SET nome=${nome} WHERE id=${id}`;
            }
 
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
