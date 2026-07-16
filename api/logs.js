import { sql } from "../lib/db.js";
import jwt from "jsonwebtoken";


function verificarToken(req) {
    const auth = req.headers.authorization;

    if (!auth) {
        return null;
    }
    const token = auth.split(" ")[1];
    try {
        return jwt.verify(
            token,
            process.env.JWT_SECRET
        );
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

    if (req.method !== "GET") {
        return res.status(405).json({
            erro: "Método inválido"
        });
    }

    try {
        const logs = await sql`SELECT * FROM logs ORDER BY "Data" DESC, id DESC`;
        return res.json(logs);
    } catch (erro) {
        console.log(erro);
        return res.status(500).json({
            erro: "Erro no servidor"
        });
    }
}
