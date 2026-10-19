import { sql } from "../../lib/db.js";
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

// Pede a password do Admin outra vez antes de ações sensíveis (editar/remover).
// Assim, mesmo que alguém apanhe uma sessão aberta, não consegue mexer em contas
// sem saber a password.
// Vai buscar o hash à BD pelo id do token e compara com o que foi escrito.
async function verificarPasswordAdmin(adminId, adminPassword){
    if(!adminPassword) return false;
    const admin = await sql`SELECT password FROM users WHERE id=${adminId}`;
    if(admin.length === 0) return false;
    return bcrypt.compare(adminPassword, admin[0].password);
}

// /api/utilizadores/:id   (só o Admin pode usar)
//   DELETE -> remove um utilizador
//   PUT    -> altera o nome e/ou a password de um utilizador
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

            // o id da URL vem como texto, por isso converte-se para número antes de comparar
            // (evita o Admin apagar a própria conta sem querer)
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
            // proteção extra: a conta Admin nunca pode ser apagada, senão ficávamos
            // sem ninguém com acesso a esta área
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
            // o nome "Admin" é o que dá os poderes de admin, por isso não pode ser mudado
            if(alvo[0].nome === "Admin" && nome !== "Admin"){
                return res.status(400).json({
                    erro:"Não é possível alterar o nome da conta Admin"
                });
            }

            // só verifica duplicados se o nome mudou mesmo
            // (o id<>${id} serve para não dar conflito com o próprio utilizador)
            if(nome !== alvo[0].nome){
                const existente = await sql`SELECT id FROM users WHERE nome=${nome} AND id<>${id}`;
                if(existente.length > 0){
                    return res.status(409).json({
                        erro:"Já existe um utilizador com esse nome"
                    });
                }
            }

            // a password é opcional: se vier vazia, mantém-se a que já estava
            // (nota: aqui o custo do bcrypt é 12 e na criação é 10, convém uniformizar)
            if(password){
                const passwordEncriptada = await bcrypt.hash(password, 12);
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
