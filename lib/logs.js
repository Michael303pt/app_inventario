import { sql } from "./db.js";

// Regista uma ação no histórico de logs.
// Falhas ao registar o log não devem impedir a operação principal
// (adicionar/remover/alterar produto), por isso os erros são só
// registados na consola e não propagados.
export async function registarLog(nome, acao, sku) {
    try {
        await sql`
            INSERT INTO logs ("Nome", "Acao", "SKU", "Data")
            VALUES (${nome}, ${acao}, ${sku}, CURRENT_DATE)
        `;
    } catch (erro) {
        console.log("Erro ao registar log:", erro);
    }
}
