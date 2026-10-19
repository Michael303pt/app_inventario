import { neon } from "@neondatabase/serverless";

// Ligação à base de dados Neon (Postgres).
// O URL vem da variável de ambiente DATABASE_URL (.env em local, painel da Vercel em produção).
// Usar sempre `sql` com template string (sql`...`): os ${valores} vão como parâmetros,
// por isso não há risco de SQL injection.
export const sql = neon(process.env.DATABASE_URL);
