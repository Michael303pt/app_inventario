import { sql } from "../lib/db.js";
import jwt from "jsonwebtoken";


// Lê o token do cabeçalho "Authorization: Bearer <token>" e valida-o.
// Devolve os dados do utilizador (id, nome) ou null se não houver token / for inválido / expirou.
// (esta função está copiada em todos os ficheiros da api; dava para a mover para a pasta lib/)
function verificarToken(req) {
    const auth = req.headers.authorization;

    if (!auth) {
        return null;
    }
    // o cabeçalho vem como "Bearer abc123", só queremos a parte do token
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

// GET /api/logs
// Devolve o histórico de ações, das mais recentes para as mais antigas.
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
        // ordena por data e, dentro do mesmo dia, pelo id (o mais novo primeiro),
        // porque a coluna Data não tem hora
        const logs = await sql`SELECT * FROM logs ORDER BY "Data" DESC, id DESC`;
        return res.json(logs);
    } catch (erro) {
        console.log(erro);
        return res.status(500).json({
            erro: "Erro no servidor"
        });
    }
}
