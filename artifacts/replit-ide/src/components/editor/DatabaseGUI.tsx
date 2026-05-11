import { useState, useEffect } from "react";
import { Database, Table2, RefreshCw, Play, ChevronRight, Circle, AlertTriangle, Loader2 } from "lucide-react";

interface TableInfo  { table_name: string; row_estimate: string }
interface ColInfo    { column_name: string; data_type: string; is_nullable: string; column_default: string | null }
interface TableData  { columns: ColInfo[]; rows: Record<string, unknown>[]; total: number }
interface QueryResult{ rows: Record<string, unknown>[]; count: number; ms: number }

function CellValue({ val }: { val: unknown }) {
  if (val === null || val === undefined) return <span className="text-[#484f58] italic">null</span>;
  if (typeof val === "boolean") return <span className="text-[#79c0ff]">{String(val)}</span>;
  if (typeof val === "number") return <span className="text-[#79c0ff]">{val}</span>;
  const s = String(val);
  if (s.length > 60) return <span className="text-[#ffa657]" title={s}>{s.slice(0, 60)}…</span>;
  return <span className="text-[#ffa657]">{s}</span>;
}

export function DatabaseGUI() {
  const [tables, setTables]         = useState<TableInfo[]>([]);
  const [loading, setLoading]       = useState(true);
  const [err, setErr]               = useState("");
  const [selected, setSelected]     = useState<string | null>(null);
  const [tableData, setTableData]   = useState<TableData | null>(null);
  const [tableLoad, setTableLoad]   = useState(false);
  const [sql, setSql]               = useState("SELECT * FROM projects LIMIT 20;");
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryErr, setQueryErr]     = useState("");
  const [queryLoad, setQueryLoad]   = useState(false);
  const [view, setView]             = useState<"table"|"query">("table");

  const loadTables = async () => {
    setLoading(true); setErr("");
    try {
      const r = await fetch("/api/db-gui/tables");
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      setTables(d.tables ?? []);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  };

  const loadTable = async (name: string) => {
    setSelected(name); setTableLoad(true); setTableData(null);
    try {
      const r = await fetch(`/api/db-gui/table/${name}`);
      if (!r.ok) throw new Error(await r.text());
      setTableData(await r.json());
    } catch { /**/ } finally { setTableLoad(false); }
  };

  const runQuery = async () => {
    setQueryLoad(true); setQueryErr(""); setQueryResult(null);
    try {
      const r = await fetch("/api/db-gui/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql }),
      });
      const d = await r.json();
      if (!r.ok) { setQueryErr(d.error ?? "Query failed"); return; }
      setQueryResult(d);
    } catch (e) { setQueryErr(String(e)); }
    finally { setQueryLoad(false); }
  };

  useEffect(() => { loadTables(); }, []);

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3]">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <Database className="h-4 w-4 text-[#58a6ff]" />
        <span className="text-xs font-semibold flex-1">Database</span>
        <div className="flex items-center gap-1">
          <Circle className="h-2 w-2 fill-green-400 text-green-400" />
          <span className="text-[10px] text-green-400">PostgreSQL</span>
        </div>
        <button onClick={loadTables} className="h-6 w-6 flex items-center justify-center rounded text-[#484f58] hover:text-[#8b949e] hover:bg-[#21262d] transition-colors">
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      {/* View tabs */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-[#21262d] shrink-0">
        <button onClick={() => setView("table")}
          className={`text-[11px] px-3 py-1 rounded transition-colors ${view === "table" ? "bg-[#21262d] text-[#e6edf3]" : "text-[#8b949e] hover:text-[#e6edf3]"}`}>
          Tables
        </button>
        <button onClick={() => setView("query")}
          className={`text-[11px] px-3 py-1 rounded transition-colors ${view === "query" ? "bg-[#21262d] text-[#e6edf3]" : "text-[#8b949e] hover:text-[#e6edf3]"}`}>
          SQL Query
        </button>
      </div>

      {view === "table" ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Table list */}
          <div className="w-44 border-r border-[#21262d] overflow-y-auto shrink-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-4 w-4 text-[#484f58] animate-spin" />
              </div>
            ) : err ? (
              <div className="p-3 text-[10px] text-[#f85149] flex items-start gap-1">
                <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" /> {err}
              </div>
            ) : tables.length === 0 ? (
              <div className="p-3 text-[10px] text-[#484f58] text-center">No tables found</div>
            ) : (
              <div className="py-1">
                {tables.map(t => (
                  <button key={t.table_name} onClick={() => loadTable(t.table_name)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-left transition-colors ${selected === t.table_name ? "bg-[#1f6feb]/20 text-[#58a6ff]" : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]"}`}>
                    <Table2 className="h-3 w-3 shrink-0" />
                    <span className="truncate flex-1">{t.table_name}</span>
                    <span className="text-[9px] text-[#484f58] shrink-0">{t.row_estimate}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Table data */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {!selected ? (
              <div className="flex flex-col items-center justify-center flex-1 text-[#484f58] gap-3">
                <Database className="h-10 w-10 opacity-20" />
                <p className="text-xs">Select a table to view its data</p>
              </div>
            ) : tableLoad ? (
              <div className="flex items-center justify-center flex-1">
                <Loader2 className="h-5 w-5 text-[#484f58] animate-spin" />
              </div>
            ) : tableData ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#21262d] bg-[#161b22] shrink-0">
                  <span className="text-[11px] font-semibold text-[#e6edf3]">{selected}</span>
                  <span className="text-[10px] text-[#484f58]">{tableData.total} rows</span>
                </div>
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-[10px] border-collapse">
                    <thead className="sticky top-0 bg-[#161b22] z-10">
                      <tr>
                        {tableData.columns.map(c => (
                          <th key={c.column_name} className="text-left px-3 py-2 text-[#8b949e] font-semibold border-b border-[#21262d] whitespace-nowrap">
                            <div>{c.column_name}</div>
                            <div className="text-[9px] text-[#484f58] font-normal">{c.data_type}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.rows.map((row, i) => (
                        <tr key={i} className="border-b border-[#161b22] hover:bg-[#161b22]/50">
                          {tableData.columns.map(c => (
                            <td key={c.column_name} className="px-3 py-1.5 whitespace-nowrap font-mono">
                              <CellValue val={row[c.column_name]} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : (
        /* SQL Query view */
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="p-2 border-b border-[#21262d] shrink-0">
            <textarea
              value={sql}
              onChange={e => setSql(e.target.value)}
              onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runQuery(); } }}
              className="w-full h-24 bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-[11px] font-mono text-[#e6edf3] placeholder-[#484f58] outline-none resize-none focus:border-[#58a6ff] transition-colors"
              placeholder="SELECT * FROM table LIMIT 20;" />
            <div className="flex items-center gap-2 mt-2">
              <button onClick={runQuery} disabled={queryLoad}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-[11px] font-medium transition-colors disabled:opacity-50">
                {queryLoad ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                Run Query
              </button>
              <span className="text-[9px] text-[#484f58]">⌘↵ to run · SELECT only</span>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {queryErr && (
              <div className="m-2 p-3 rounded-lg bg-[#f85149]/10 border border-[#f85149]/20 text-[11px] text-[#f85149] flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {queryErr}
              </div>
            )}
            {queryResult && (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#21262d] bg-[#161b22] text-[10px]">
                  <span className="text-[#3fb950]">{queryResult.count} rows</span>
                  <span className="text-[#484f58]">· {queryResult.ms}ms</span>
                </div>
                {queryResult.rows.length > 0 && (
                  <table className="w-full text-[10px] border-collapse">
                    <thead className="sticky top-0 bg-[#161b22]">
                      <tr>{Object.keys(queryResult.rows[0]).map(k => (
                        <th key={k} className="text-left px-3 py-2 text-[#8b949e] font-semibold border-b border-[#21262d] whitespace-nowrap">{k}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {queryResult.rows.map((row, i) => (
                        <tr key={i} className="border-b border-[#161b22] hover:bg-[#161b22]/50">
                          {Object.values(row).map((v, j) => (
                            <td key={j} className="px-3 py-1.5 font-mono whitespace-nowrap"><CellValue val={v} /></td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
            {!queryResult && !queryErr && !queryLoad && (
              <div className="flex flex-col items-center justify-center h-32 text-[#484f58] gap-2 text-xs">
                <ChevronRight className="h-6 w-6 opacity-30" />
                <span>Run a query to see results</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
