import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Globe, Wifi, WifiOff, Send, Loader2,
  Shield, Activity, Users, RefreshCw, MessageSquare,
  Lock, CheckCircle2, AlertTriangle, Network, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface FedNode { id: string; name: string; endpoint: string; status: "online" | "offline" | "degraded"; region: string; agentCount: number; lastSeen: string; trustScore: number }
interface FedMessage { id: string; fromNode: string; toNode: string; type: string; payload: unknown; timestamp: string; encrypted: boolean }
interface FedStatus { federation: string; nodeId: string; version: string; security: Record<string, unknown>; topology: Record<string, unknown>; uptime: number }

const STATUS_COLOR = { online: "text-green-400", degraded: "text-yellow-400", offline: "text-red-400" };
const STATUS_DOT = { online: "bg-green-400", degraded: "bg-yellow-400", offline: "bg-red-400" };

export default function FederationPage() {
  const [, navigate] = useLocation();
  const [nodes, setNodes] = useState<FedNode[]>([]);
  const [messages, setMessages] = useState<FedMessage[]>([]);
  const [status, setStatus] = useState<FedStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [delegating, setDelegating] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [task, setTask] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [delegateOutput, setDelegateOutput] = useState("");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [tab, setTab] = useState<"nodes" | "delegate" | "broadcast">("nodes");

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [nRes, mRes, sRes] = await Promise.all([
        fetch(`${BASE_URL}/api/federation/nodes`),
        fetch(`${BASE_URL}/api/federation/messages`),
        fetch(`${BASE_URL}/api/federation/status`),
      ]);
      const [nData, mData, sData] = await Promise.all([nRes.json(), mRes.json(), sRes.json()]) as [{ nodes: FedNode[]; summary: Record<string, unknown> }, { messages: FedMessage[] }, FedStatus];
      setNodes(nData.nodes ?? []);
      setMessages(mData.messages ?? []);
      setStatus(sData);
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function delegateTask() {
    if (!task.trim()) return;
    setDelegating(true);
    setDelegateOutput("");
    try {
      const r = await fetch(`${BASE_URL}/api/federation/delegate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, targetNodeId: selectedNode }),
      });
      const reader = r.body?.getReader();
      if (!reader) return;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = new TextDecoder().decode(value);
        for (const line of text.split("\n")) {
          if (!line.startsWith("data:")) continue;
          try {
            const ev = JSON.parse(line.slice(5)) as { type: string; content?: string; message?: string; targetNode?: string };
            if (ev.type === "federation_start") setDelegateOutput(`→ Delegating to ${ev.targetNode}...\n`);
            else if (ev.type === "handshake") setDelegateOutput(p => p + `🔐 ${ev.message}\n`);
            else if (ev.type === "authenticated") setDelegateOutput(p => p + `✅ ${ev.message}\n\n`);
            else if (ev.type === "chunk" && ev.content) setDelegateOutput(p => p + ev.content);
            else if (ev.type === "federation_done") setDelegateOutput(p => p + "\n\n✅ Federation complete");
          } catch { /* ignore */ }
        }
      }
      await fetchAll();
    } catch { /* ignore */ }
    setDelegating(false);
  }

  async function broadcastMessage() {
    if (!broadcastMsg.trim()) return;
    setBroadcasting(true);
    try {
      await fetch(`${BASE_URL}/api/federation/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: broadcastMsg, encrypted: true }),
      });
      setBroadcastMsg("");
      await fetchAll();
    } catch { /* ignore */ }
    setBroadcasting(false);
  }

  const onlineNodes = nodes.filter(n => n.status === "online");
  const totalAgents = nodes.reduce((s, n) => s + n.agentCount, 0);

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      <div className="sticky top-0 z-20 bg-[#0d1117]/95 backdrop-blur border-b border-white/[0.08] px-4 pt-safe">
        <div className="flex items-center gap-3 py-3">
          <button onClick={() => navigate("/")} className="p-1.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <Globe size={18} className="text-blue-400" />
          <span className="font-semibold flex-1">Agent Federation</span>
          {status && <span className="text-[10px] bg-green-500/20 text-green-300 border border-green-400/20 px-2 py-0.5 rounded-full">Zero-Trust</span>}
        </div>
        <div className="flex gap-1 pb-3">
          {(["nodes", "delegate", "broadcast"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={cn("flex-1 py-1.5 rounded-lg text-[11px] font-medium capitalize transition-colors", tab === t ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70")}>
              {t === "nodes" ? `Nodes (${nodes.length})` : t === "delegate" ? "Delegate" : `Broadcast (${messages.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4 space-y-3">
        {tab === "nodes" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Online", value: onlineNodes.length, color: "text-green-400" },
                { label: "Total Nodes", value: nodes.length, color: "text-blue-400" },
                { label: "Fed Agents", value: totalAgents, color: "text-purple-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-[#161b22] border border-white/[0.06] rounded-xl p-3 text-center">
                  <div className={cn("text-xl font-bold", color)}>{value}</div>
                  <div className="text-[9px] text-white/30">{label}</div>
                </div>
              ))}
            </div>

            {status && (
              <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-3">
                <div className="text-[11px] text-blue-300 font-medium mb-2 flex items-center gap-1"><Shield size={11} /> Zero-Trust Security</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(status.security).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-1.5">
                      <CheckCircle2 size={9} className="text-green-400 shrink-0" />
                      <span className="text-[10px] text-white/50">{k}: <span className="text-white/70">{String(v)}</span></span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {nodes.map(node => (
                <div key={node.id} className="bg-[#161b22] border border-white/[0.06] rounded-xl p-3">
                  <div className="flex items-start gap-3">
                    <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0 animate-pulse", STATUS_DOT[node.status])} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-medium">{node.name}</span>
                        <span className={cn("text-[10px]", STATUS_COLOR[node.status])}>{node.status}</span>
                        <span className="text-[9px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded">{node.region}</span>
                      </div>
                      <div className="text-[10px] font-mono text-white/30 truncate">{node.endpoint}</div>
                      <div className="flex gap-3 mt-1">
                        <span className="text-[10px] text-white/40">{node.agentCount} agents</span>
                        <span className="text-[10px] text-white/30">Trust: {(node.trustScore * 100).toFixed(0)}%</span>
                        <span className="text-[10px] text-white/20">Last: {new Date(node.lastSeen).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    {node.status === "online" && (
                      <button onClick={() => { setSelectedNode(node.id); setTab("delegate"); }}
                        className="shrink-0 px-2.5 py-1.5 bg-blue-600/20 border border-blue-400/30 rounded-lg text-blue-300 text-[10px] hover:bg-blue-600/30 transition-colors">
                        Delegate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={fetchAll} className="w-full py-2 bg-white/5 border border-white/10 rounded-xl text-white/40 text-[12px] flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh Nodes
            </button>
          </motion.div>
        )}

        {tab === "delegate" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-4">
              <div className="text-[13px] font-medium mb-1">Delegate Task to Remote Node</div>
              <p className="text-[11px] text-white/40">Securely delegate a task to an agent on another machine via zero-trust mTLS.</p>
            </div>

            <div>
              <label className="text-[11px] text-white/50 mb-1.5 block">Target Node</label>
              <select value={selectedNode ?? ""} onChange={e => setSelectedNode(e.target.value || null)} className="w-full bg-[#161b22] border border-white/[0.06] rounded-lg px-3 py-2 text-[12px] focus:outline-none text-white">
                <option value="">Auto-select best node</option>
                {onlineNodes.map(n => <option key={n.id} value={n.id}>{n.name} ({n.region})</option>)}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-white/50 mb-1.5 block">Task</label>
              <textarea value={task} onChange={e => setTask(e.target.value)} placeholder="Describe the task to delegate to the remote node..." rows={3} className="w-full bg-[#161b22] border border-white/[0.06] rounded-xl py-3 px-4 text-[13px] placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 resize-none" />
            </div>

            <button onClick={delegateTask} disabled={delegating || !task.trim()}
              className="w-full py-3 bg-blue-600/20 border border-blue-400/30 rounded-xl text-blue-300 text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-blue-600/30 transition-colors disabled:opacity-50">
              {delegating ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Delegate via Federation
            </button>

            {delegateOutput && (
              <div className="bg-[#161b22] border border-blue-400/20 rounded-xl p-4 max-h-60 overflow-y-auto">
                <div className="text-[11px] text-blue-300 mb-2">Federation Output</div>
                <pre className="text-[12px] text-white/70 whitespace-pre-wrap font-sans">{delegateOutput}</pre>
              </div>
            )}
          </motion.div>
        )}

        {tab === "broadcast" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="flex gap-2">
              <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} placeholder="Message to broadcast to all online nodes..." rows={3} className="flex-1 bg-[#161b22] border border-white/[0.06] rounded-xl py-3 px-4 text-[12px] placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 resize-none" />
            </div>
            <button onClick={broadcastMessage} disabled={broadcasting || !broadcastMsg.trim()}
              className="w-full py-3 bg-blue-600/20 border border-blue-400/30 rounded-xl text-blue-300 text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-blue-600/30 transition-colors disabled:opacity-50">
              {broadcasting ? <Loader2 size={14} className="animate-spin" /> : <Network size={14} />}
              Broadcast to {onlineNodes.length} Online Nodes
            </button>

            <div className="text-[11px] text-white/40">Message Log ({messages.length})</div>
            <div className="space-y-1.5">
              {messages.map(msg => (
                <div key={msg.id} className="bg-[#161b22] border border-white/[0.06] rounded-lg p-2.5">
                  <div className="flex items-center gap-2">
                    <Lock size={9} className={msg.encrypted ? "text-green-400" : "text-white/30"} />
                    <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-white/50">{msg.type}</span>
                    <span className="text-[9px] text-white/30 ml-auto">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-[10px] text-white/40 mt-1">→ {msg.toNode}</div>
                </div>
              ))}
              {messages.length === 0 && <div className="text-center py-8 text-[12px] text-white/20">No messages yet</div>}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
