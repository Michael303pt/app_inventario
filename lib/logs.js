import { sql } from "./db.js";

// Regista uma ação no histórico de logs.
// Falhas ao registar o log não devem impedir a operação principal
// (adicionar/remover/alterar produto), por isso os erros são só
// registados na consola e não propagados.
export async function registarLog(nome, acao, sku) {
    try {
        // FIXME: a ordem dos valores não bate com a das colunas!
        // As colunas são (Nome, Acao, SKU) mas os valores vão (nome, sku, acao),
        // ou seja, a ação fica gravada na coluna SKU e vice-versa.
        // Confirmar na tabela e trocar para (${nome}, ${acao}, ${sku}).
        await sql`
            INSERT INTO logs ("Nome", "Acao", "SKU", "Data")
            VALUES (${nome}, ${sku}, ${acao}, CURRENT_DATE)
        `;
    } catch (erro) {
        console.log("Erro ao registar log:", erro);
    }
}
