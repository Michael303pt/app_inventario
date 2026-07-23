import { sql } from "../lib/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            erro: "Método inválido"
        });
    }

    const { nome, password } = req.body;
    try {
        const utilizador = await sql`SELECT * FROM users WHERE nome=${nome}`;

        if (utilizador.length === 0) {
            return res.status(401).json({
                erro: "Utilizador inexistente"
            });
        }

        const senhaValida = await bcrypt.compare(
            password,
            utilizador[0].password
        );

        if (!senhaValida) {
            return res.status(401).json({
                erro: "Password errada"
            });
        }

        const token = jwt.sign({
                id: utilizador[0].id,
                nome: utilizador[0].nome
            },
            process.env.JWT_SECRET,{
                expiresIn: "8h"
            }
        );
        res.json({
            token,
            nome: utilizador[0].nome
        });
    }catch (erro){
        console.log(erro);

        res.status(500).json({
            erro: "Erro no servidor"
        });
    }
}