import { sql } from "../lib/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// POST /api/login
// Recebe { nome, password } e devolve um token JWT válido por 8 horas.
export default async function handler(req, res) {

    // só aceitamos POST, o login nunca deve ser feito por GET
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

        // na BD a password está guardada com hash (bcrypt), por isso
        // não dá para comparar texto com texto, temos de usar o compare
        const senhaValida = await bcrypt.compare(
            password,
            utilizador[0].password
        );

        if (!senhaValida) {
            return res.status(401).json({
                erro: "Password errada"
            });
        }

        // o token leva o id e o nome para os outros endpoints saberem quem é
        // (é daqui que sai o "Admin" que se verifica noutros sítios)
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
        // o detalhe do erro fica só na consola, ao cliente não mostramos nada interno
        console.log(erro);

        res.status(500).json({
            erro: "Erro no servidor"
        });
    }
}
