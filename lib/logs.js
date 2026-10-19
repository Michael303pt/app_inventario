import { sql } from "./db.js";

// Regista uma ação no histórico de logs.
export async function registarLog(nome, acao, sku) {
    try {
        await sql`
            INSERT INTO logs ("Nome", "Acao", "SKU", "Data")
            VALUES (${nome}, ${sku}, ${acao}, CURRENT_DATE)
        `;
    } catch (erro) {
        console.log("Erro ao registar log:", erro);
    }
}
