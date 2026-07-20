import { sql } from "../../lib/db.js";
import jwt from "jsonwebtoken";
import { registarLog } from "../../lib/logs.js";


function verificarToken(req) {
    const auth = req.headers.authorization;

    if (!auth) {
        return null;
    }
    const token = auth.split(" ")[1];
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return null;
    }
}

export default async function handler(req, res) {
    const utilizador = verificarToken(req);
    if (!utilizador) {
        return res.status(401).json({
            erro: "Não autorizado"
        });
    }

    const { id } = req.query;

    try {
        //remover produto
        if (req.method === "DELETE") {
            const removido = await sql`DELETE FROM products WHERE id=${id} RETURNING sku`;

            if (removido.length === 0) {
                return res.status(404).json({
                    erro: "Produto não encontrado"
                });
            }

            await registarLog(utilizador.nome, "Removeu produto", removido[0].sku);
            return res.json({
                ok: true
            });
        }

        // atualizar quantidade
        if (req.method === "PUT") {
            const { quantidade } = req.body;

            if (quantidade === undefined || isNaN(quantidade)) {
                return res.status(400).json({
                    erro: "Quantidade inválida"
                });
            }

            const anterior = await sql`SELECT quantidade FROM products WHERE id=${id}`;

            if (anterior.length === 0) {
                return res.status(404).json({
                    erro: "Produto não encontrado"
                });
            }

            const resultado = await sql`
                UPDATE products
                SET quantidade=${quantidade}
                WHERE id=${id}
                RETURNING *`;

            const diferenca = quantidade - anterior[0].quantidade;
            const acao = `Quantidade ${diferenca >= 0 ? "+" : ""}${diferenca}`;

            await registarLog(utilizador.nome, acao, resultado[0].sku);
            return res.json(resultado[0]);
        }

        return res.status(405).json({
            erro: "Método inválido"
        });
    } catch (erro) {
        console.log(erro);
        return res.status(500).json({
            erro: "Erro no servidor"
        });
    }
}