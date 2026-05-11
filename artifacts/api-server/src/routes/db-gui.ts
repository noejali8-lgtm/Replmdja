import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

router.get("/tables", async (_req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query<{ table_name: string; row_estimate: string }>(`
      SELECT
        t.table_name,
        COALESCE(s.n_live_tup, 0)::text AS row_estimate
      FROM information_schema.tables t
      LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name
    `);
    res.json({ tables: result.rows });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  } finally {
    client.release();
  }
});

router.get("/table/:name", async (req, res) => {
  const tableName = req.params.name.replace(/[^a-zA-Z0-9_]/g, "");
  if (!tableName) { res.status(400).json({ error: "invalid table name" }); return; }

  const client = await pool.connect();
  try {
    const [cols, rows, count] = await Promise.all([
      client.query(
        `SELECT column_name, data_type, is_nullable, column_default
         FROM information_schema.columns
         WHERE table_name = $1 AND table_schema = 'public'
         ORDER BY ordinal_position`,
        [tableName]
      ),
      client.query(`SELECT * FROM "${tableName}" LIMIT 200`),
      client.query(`SELECT COUNT(*)::int AS cnt FROM "${tableName}"`),
    ]);
    res.json({
      columns: cols.rows,
      rows:    rows.rows,
      total:   count.rows[0]?.cnt ?? 0,
    });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  } finally {
    client.release();
  }
});

router.post("/query", async (req, res) => {
  const { sql } = req.body as { sql?: string };
  if (!sql?.trim()) { res.status(400).json({ error: "sql required" }); return; }

  const clean = sql.trim().toLowerCase();
  const allowed = ["select", "explain", "show", "with"];
  if (!allowed.some(k => clean.startsWith(k))) {
    res.status(403).json({ error: "Only SELECT / EXPLAIN / SHOW / WITH queries are allowed in the GUI" });
    return;
  }

  const client = await pool.connect();
  try {
    const start  = Date.now();
    const result = await client.query(sql);
    const ms     = Date.now() - start;
    res.json({ rows: result.rows, count: result.rowCount ?? 0, ms });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  } finally {
    client.release();
  }
});

export default router;
