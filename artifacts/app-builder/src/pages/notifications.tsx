import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Heart, GitBranch, Star, MessageSquare, UserPlus,
  Trophy, Zap, Bell, BellOff, Check, CheckCheck, Trash2,
  Eye, Play, Circle, X
} from "lucide-react";
import { cn } from "@/lib/utils";

type NotifType = "like" | "fork" | "star" | "comment" | "follow" | "achievement" | "system" | "mention";

interface Notification {
  id: string;
  type: NotifType;
  actor: string;
  actorInitial: string;
  actorColor: string;
  action: string;
  target?: string;
  time: string;
  timeMs: number;
  read: boolean;
  badge?: string;
  badgeColor?: string;
}

const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: "1", type: "like", actor: "sara_codes", actorInitial: "S", actorColor: "bg-purple-500",
    action: "liked your repl", target: "AI Chat Interface",
    time: "2m ago", timeMs: Date.now() - 120000, read: false,
  },
  {
    id: "2", type: "fork", actor: "mike_ui", actorInitial: "M", actorColor: "bg-green-500",
    action: "forked your repl", target: "Portfolio Generator",
    time: "15m ago", timeMs: Date.now() - 900000, read: false,
  },
  {
    id: "3", type: "achievement", actor: "Replit", actorInitial: "R", actorColor: "bg-orange-500",
    action: "Achievement unlocked:", target: "First 100 likes 🏆",
    time: "1h ago", timeMs: Date.now() - 3600000, read: false,
    badge: "Achievement", badgeColor: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30",
  },
  {
    id: "4", type: "follow", actor: "alex_dev", actorInitial: "A", actorColor: "bg-blue-500",
    action: "started following you",
    time: "2h ago", timeMs: Date.now() - 7200000, read: false,
  },
  {
    id: "5", type: "comment", actor: "data_viz", actorInitial: "D", actorColor: "bg-teal-500",
    action: "commented on", target: "Real-time Dashboard",
    time: "3h ago", timeMs: Date.now() - 10800000, read: true,
  },
  {
    id: "6", type: "star", actor: "retro_coder", actorInitial: "R", actorColor: "bg-emerald-600",
    action: "starred your repl", target: "Snake Game",
    time: "5h ago", timeMs: Date.now() - 18000000, read: true,
  },
  {
    id: "7", type: "system", actor: "Replit", actorInitial: "R", actorColor: "bg-orange-500",
    action: "Your deployment is live:", target: "portfolio-gen.replit.app",
    time: "6h ago", timeMs: Date.now() - 21600000, read: true,
    badge: "Deploy", badgeColor: "bg-green-500/20 text-green-400 border-green-400/30",
  },
  {
    id: "8", type: "mention", actor: "backend_pro", actorInitial: "B", actorColor: "bg-yellow-500",
    action: "mentioned you in", target: "REST API Best Practices",
    time: "1d ago", timeMs: Date.now() - 86400000, read: true,
  },
  {
    id: "9", type: "like", actor: "game_dev42", actorInitial: "G", actorColor: "bg-red-500",
    action: "liked your repl", target: "2048 Game",
    time: "1d ago", timeMs: Date.now() - 90000000, read: true,
  },
  {
    id: "10", type: "achievement", actor: "Replit", actorInitial: "R", actorColor: "bg-orange-500",
    action: "Achievement unlocked:", target: "10 Repls Created 🎯",
    time: "2d ago", timeMs: Date.now() - 172800000, read: true,
    badge: "Achievement", badgeColor: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30",
  },
];

const NOTIF_ICONS: Record<NotifType, React.ElementType> = {
  like: Heart,
  fork: GitBranch,
  star: Star,
  comment: MessageSquare,
  follow: UserPlus,
  achievement: Trophy,
  system: Zap,
  mention: MessageSquare,
};

const NOTIF_COLORS: Record<NotifType, string> = {
  like: "text-red-400",
  fork: "text-blue-400",
  star: "text-yellow-400",
  comment: "text-purple-400",
  follow: "text-green-400",
  achievement: "text-amber-400",
  system: "text-orange-400",
  mention: "text-cyan-400",
};

const NOTIF_BG: Record<NotifType, string> = {
  like: "bg-red-500/12",
  fork: "bg-blue-500/12",
  star: "bg-yellow-500/12",
  comment: "bg-purple-500/12",
  follow: "bg-green-500/12",
  achievement: "bg-amber-500/12",
  system: "bg-orange-500/12",
  mention: "bg-cyan-500/12",
};

type TabFilter = "all" | "unread" | "likes" | "social";

const TABS: { id: TabFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "likes", label: "Likes & Stars" },
  { id: "social", label: "Social" },
];

export default function Notifications() {
  const [, setLocation] = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>(SAMPLE_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [pushEnabled, setPushEnabled] = useState(true);

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = notifications.filter(n => {
    if (activeTab === "unread") return !n.read;
    if (activeTab === "likes") return n.type === "like" || n.type === "star";
    if (activeTab === "social") return n.type === "follow" || n.type === "mention" || n.type === "comment";
    return true;
  });

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const dismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col min-h-full pb-24 max-w-[480px] mx-auto w-full"
    >
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#141414]/95 backdrop-blur-sm border-b border-white/[0.06]">
        <div className="flex items-center gap-3 px-4 pt-12 pb-3">
          <button
            onClick={() => setLocation("/")}
            className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white transition-colors rounded-xl hover:bg-white/6"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-[17px] font-bold text-white">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-[11px] text-white/40">{unreadCount} unread</p>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white/50 hover:text-white hover:bg-white/6 transition-all"
              >
                <CheckCheck size={13} />
                <span>Mark all read</span>
              </button>
            )}
            <button
              onClick={() => setPushEnabled(v => !v)}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-xl transition-all",
                pushEnabled ? "text-white/50 hover:text-white hover:bg-white/6" : "text-yellow-400 bg-yellow-500/10"
              )}
            >
              {pushEnabled ? <Bell size={16} /> : <BellOff size={16} />}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 px-2 pb-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-[12px] font-semibold transition-all",
                activeTab === tab.id
                  ? "bg-white/10 text-white"
                  : "text-white/35 hover:text-white/60"
              )}
            >
              {tab.label}
              {tab.id === "unread" && unreadCount > 0 && (
                <span className="ml-1 text-[10px] font-bold bg-blue-500 text-white px-1 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pt-3 space-y-1">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
                <Bell size={22} className="text-white/20" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-white/40">No notifications</p>
                <p className="text-[11px] text-white/25 mt-1">You're all caught up!</p>
              </div>
            </motion.div>
          ) : (
            filtered.map((notif, i) => {
              const Icon = NOTIF_ICONS[notif.type];
              return (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => markRead(notif.id)}
                  className={cn(
                    "relative flex items-start gap-3 px-3.5 py-3 rounded-2xl border cursor-pointer transition-all group",
                    notif.read
                      ? "bg-white/[0.025] border-white/[0.06] hover:bg-white/[0.04]"
                      : "bg-[#1a1a2a] border-blue-500/20 hover:border-blue-500/30"
                  )}
                >
                  {/* Unread dot */}
                  {!notif.read && (
                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-500" />
                  )}

                  {/* Actor avatar */}
                  <div className="relative shrink-0">
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white", notif.actorColor)}>
                      {notif.actorInitial}
                    </div>
                    <div className={cn("absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#141414] flex items-center justify-center", NOTIF_BG[notif.type])}>
                      <Icon size={10} className={NOTIF_COLORS[notif.type]} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[13px] font-semibold text-white/90">@{notif.actor}</span>
                      {notif.badge && (
                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border", notif.badgeColor)}>
                          {notif.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-white/50 mt-0.5">
                      {notif.action}{" "}
                      {notif.target && (
                        <span className="text-white/80 font-medium">"{notif.target}"</span>
                      )}
                    </p>
                    <p className="text-[10px] text-white/25 mt-1">{notif.time}</p>
                  </div>

                  {/* Dismiss button */}
                  <button
                    onClick={e => { e.stopPropagation(); dismiss(notif.id); }}
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-lg text-white/0 group-hover:text-white/25 hover:!text-white/60 hover:bg-white/8 transition-all"
                  >
                    <X size={12} />
                  </button>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Push notification toggle */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border border-white/[0.07] rounded-2xl">
          <div className="flex items-center gap-2.5">
            <Bell size={15} className="text-white/40" />
            <div>
              <p className="text-[13px] font-medium text-white">Push Notifications</p>
              <p className="text-[10px] text-white/35">Get notified on mobile</p>
            </div>
          </div>
          <button
            onClick={() => setPushEnabled(v => !v)}
            className={cn(
              "w-11 h-6 rounded-full border transition-all relative",
              pushEnabled ? "bg-blue-500 border-blue-400" : "bg-white/10 border-white/15"
            )}
          >
            <div className={cn(
              "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all",
              pushEnabled ? "left-5.5 left-[22px]" : "left-0.5"
            )} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
