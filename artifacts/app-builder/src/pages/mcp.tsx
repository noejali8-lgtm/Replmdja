import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plug, Plus, Trash2, Wifi, WifiOff, Play,
  Loader2, RefreshCw, ChevronDown, ChevronRight, Code2,
  Server, Globe, Zap, CheckCircle2, Terminal
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface McpServer {
  id: number; name: string; description: string; endpoint: string;
  protocol: string; status: string; tools: Array<{ name: string; description: string; schema: Record<string, unknown> }>;
  isEnabled: boolean; lastPingAt: string | null; createdAt: string;
}
interface BuiltinTool { name: string; description: string; schema: Record<string, unknown> }

const STATUS_CONFIG = {
  connected: { color: "text-green-400", bg: "bg-green-500/10", label: "Connected", icon: Wifi },
  disconnected: { color: "text-white/30", bg: "bg-white/5", label: "Disconnected", icon: WifiOff },
  degraded: { color: "text-yellow-400", bg: "bg-yellow-500/10", label: "Degraded", icon: Wifi },
};

export default function McpPage() {
  const [, navigate] = useLocation();
  const [servers, setServers] = useState<McpServer[]>([]);
  const [builtinTools, setBuiltinTools] = useState<BuiltinTool[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState<number | null>(null);
  const [calling, setCalling] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [callResult, setCallResult] = useState<Record<string, unknown> | null>(null);
  const [selectedTool, setSelectedTool] = useState<string>("");
  const [toolArgs, setToolArgs] = useState("{}");
  const [showAdd, setShowAdd] = useState(false);
  const [newServer, setNewServer] = useState({ name: "", endpoint: "", description: "", protocol: "http" });
  const [adding, setAdding] = useState(false);
  const [tab, setTab] = useState<"servers" | "tools">("tools");

  useEffect(() => {
    fetchServers();
    fetchBuiltinTools();
  }, []);

  async function fetchServers() {
    setLoading(true);
    try {
      const r = await fetch(`${BASE_URL}/api/mcp/servers`);
      const d = await r.json() as { servers: McpServer[] };
      setServers(d.servers ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function fetchBuiltinTools() {
    try {
      const r = await fetch(`${BASE_URL}/api/mcp/tools`);
      const d = await r.json() as { tools: BuiltinTool[] };
      setBuiltinTools(d.tools ?? []);
    } catch { /* ignore */ }
  }

  async function connectServer(id: number) {
    setConnecting(id);
    try {
      await fetch(`${BASE_URL}/api/mcp/servers/${id}/connect`, { method: "POST" });
      await fetchServers();
    } catch { /* ignore */ }
    setConnecting(null);
  }

  async function disconnectServer(id: number) {
    await fetch(`${BASE_URL}/api/mcp/servers/${id}/disconnect`, { method: "POST" });
    await fetchServers();
  }

  async function deleteServer(id: number) {
    await fetch(`${BASE_URL}/api/mcp/servers/${id}`, { method: "DELETE" });
    await fetchServers();
  }

  async function addServer() {
    if (!newServer.name || !newServer.endpoint) return;
    setAdding(true);
    try {
      await fetch(`${BASE_URL}/api/mcp/servers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newServer),
      });
      setNewServer({ name: "", endpoint: "", description: "", protocol: "http" });
      setShowAdd(false);
      await fetchServers();
    } catch { /* ignore */ }
    setAdding(false);
  }

  async function callTool(serverId: number) {
    if (!selectedTool) return;
    setCalling(true);
    setCallResult(null);
    try {
      let args: Record<string, unknown> = {};
      try { args = JSON.parse(toolArgs); } catch { /* ignore */ }
      const r = await fetch(`${BASE_URL}/api/mcp/servers/${serverId}/call-tool`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: selectedTool, args }),
      });
      setCallResult(await r.json() as Record<string, unknown>);
    } catch { /* ignore */ }
    setCalling(false);
  }

  const connected = servers.filter(s => s.status === "connected").length;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      <div className="sticky top-0 z-20 bg-[#0d1117]/95 backdrop-blur border-b border-white/[0.08] px-4 pt-safe">
        <div className="flex items-center gap-3 py-3">
          <button onClick={() => navigate("/")} className="p-1.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <Plug size={18} className="text-teal-400" />
          <span className="font-semibold flex-1">MCP Servers</span>
          <span className="text-[10px] font-mono bg-teal-500/20 text-teal-300 border border-teal-400/20 px-2 py-0.5 rounded-full">{builtinTools.length} TOOLS</span>
        </div>
        <div className="flex gap-1 pb-3">
          {(["tools", "servers"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={cn("flex-1 py-1.5 rounded-lg text-[12px] font-medium capitalize transition-colors", tab === t ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70")}>
              {t === "tools" ? `Native Tools (${builtinTools.length})` : `MCP Servers (${servers.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4 space-y-3">
        {tab === "tools" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-4">
              <div className="text-[13px] font-medium mb-1 flex items-center gap-2"><Zap size={13} className="text-teal-400" /> Built-in RuFlo Tools</div>
              <p className="text-[11px] text-white/40">These {builtinTools.length} tools are available natively — no MCP server needed. They run in parallel and power all agent capabilities.</p>
            </div>
            <div className="space-y-1.5">
              {builtinTools.map(tool => (
                <div key={tool.name} className="bg-[#161b22] border border-white/[0.06] rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <Terminal size={12} className="text-teal-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[12px] text-teal-300">{tool.name}</div>
                      <div className="text-[11px] text-white/50 mt-0.5">{tool.description}</div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {Object.entries(tool.schema).slice(0, 3).map(([k, v]) => (
                          <span key={k} className="text-[9px] font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white/40">{k}: {String(v)}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {tab === "servers" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-teal-300">{servers.length}</div>
                <div className="text-[10px] text-white/30">MCP Servers</div>
              </div>
              <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-green-300">{connected}</div>
                <div className="text-[10px] text-white/30">Connected</div>
              </div>
            </div>

            <button onClick={() => setShowAdd(!showAdd)}
              className="w-full py-2.5 bg-teal-600/20 border border-teal-400/30 rounded-xl text-teal-300 text-[12px] font-medium flex items-center justify-center gap-2 hover:bg-teal-600/30 transition-colors">
              <Plus size={13} /> Add MCP Server
            </button>

            <AnimatePresence>
              {showAdd && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-[#161b22] border border-teal-400/20 rounded-xl p-3 space-y-2">
                  <div className="text-[12px] text-teal-300 font-medium">New MCP Server</div>
                  <input value={newServer.name} onChange={e => setNewServer(s => ({ ...s, name: e.target.value }))} placeholder="Server name" className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-[12px] placeholder:text-white/30 focus:outline-none focus:border-teal-500/50" />
                  <input value={newServer.endpoint} onChange={e => setNewServer(s => ({ ...s, endpoint: e.target.value }))} placeholder="Endpoint URL (e.g. http://localhost:3000)" className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-[12px] placeholder:text-white/30 focus:outline-none focus:border-teal-500/50" />
                  <input value={newServer.description} onChange={e => setNewServer(s => ({ ...s, description: e.target.value }))} placeholder="Description (optional)" className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-[12px] placeholder:text-white/30 focus:outline-none" />
                  <div className="flex gap-2">
                    <select value={newServer.protocol} onChange={e => setNewServer(s => ({ ...s, protocol: e.target.value }))} className="flex-1 bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-[12px] focus:outline-none text-white">
                      <option value="http">HTTP</option>
                      <option value="sse">SSE</option>
                      <option value="stdio">stdio</option>
                    </select>
                    <button onClick={addServer} disabled={adding} className="px-4 py-2 bg-teal-600/30 border border-teal-400/40 rounded-lg text-teal-300 text-[11px] flex items-center gap-1 disabled:opacity-50">
                      {adding ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />} Add
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/30">{servers.length} servers registered</span>
              <button onClick={fetchServers} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40">
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            {servers.length === 0 ? (
              <div className="text-center py-12">
                <Server size={36} className="mx-auto text-white/10 mb-3" />
                <p className="text-white/30 text-[12px]">No MCP servers yet</p>
                <p className="text-white/20 text-[11px] mt-1">Add a local or remote MCP endpoint</p>
              </div>
            ) : (
              <div className="space-y-2">
                {servers.map(server => {
                  const statusCfg = STATUS_CONFIG[server.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.disconnected;
                  const StatusIcon = statusCfg.icon;
                  const isConn = connecting === server.id;
                  const isExpanded = expanded === server.id;
                  return (
                    <div key={server.id} className={cn("bg-[#161b22] border rounded-xl transition-all", isExpanded ? "border-teal-400/30" : "border-white/[0.06]")}>
                      <div className="p-3">
                        <div className="flex items-start gap-2">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", statusCfg.bg)}>
                            <StatusIcon size={14} className={statusCfg.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-medium truncate">{server.name}</span>
                              <span className={cn("text-[9px] font-medium shrink-0", statusCfg.color)}>{statusCfg.label}</span>
                            </div>
                            <div className="text-[10px] font-mono text-white/30 truncate">{server.endpoint}</div>
                            {server.tools.length > 0 && <div className="text-[10px] text-teal-300 mt-0.5">{server.tools.length} tools discovered</div>}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {server.status === "connected" ? (
                              <>
                                <button onClick={() => disconnectServer(server.id)} className="p-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors">
                                  <WifiOff size={11} className="text-yellow-400" />
                                </button>
                                <button onClick={() => { setExpanded(isExpanded ? null : server.id); setSelectedTool(""); setCallResult(null); }}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                  {isExpanded ? <ChevronDown size={11} className="text-white/40" /> : <ChevronRight size={11} className="text-white/40" />}
                                </button>
                              </>
                            ) : (
                              <button onClick={() => connectServer(server.id)} disabled={isConn}
                                className="p-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 transition-colors disabled:opacity-50">
                                {isConn ? <Loader2 size={11} className="animate-spin text-teal-400" /> : <Wifi size={11} className="text-teal-400" />}
                              </button>
                            )}
                            <button onClick={() => deleteServer(server.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors">
                              <Trash2 size={11} className="text-red-400" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && server.tools.length > 0 && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="border-t border-white/[0.06] p-3 space-y-2">
                            <div className="text-[11px] text-white/40">Call Tool</div>
                            <select value={selectedTool} onChange={e => setSelectedTool(e.target.value)} className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-[12px] focus:outline-none text-white">
                              <option value="">Select tool...</option>
                              {server.tools.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                            </select>
                            <textarea value={toolArgs} onChange={e => setToolArgs(e.target.value)} placeholder="{}" rows={2} className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-[11px] font-mono placeholder:text-white/30 focus:outline-none resize-none" />
                            <button onClick={() => callTool(server.id)} disabled={calling || !selectedTool}
                              className="w-full py-2 bg-teal-600/20 border border-teal-400/30 rounded-lg text-teal-300 text-[11px] flex items-center justify-center gap-1 disabled:opacity-50">
                              {calling ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />} Call Tool
                            </button>
                            {callResult && (
                              <div className="bg-[#0d1117] rounded-lg p-2 text-[10px] font-mono text-white/60 overflow-x-auto max-h-32">
                                {JSON.stringify(callResult, null, 2)}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
