import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ExternalLink, Pencil, Moon, Sun, Monitor,
  Users, Info, Sparkles, Bell, Shield, Trash2, Check, X,
  Copy, LogOut, Key, CreditCard, Globe, Code2, Star, Zap,
  HelpCircle, BookOpen, MessageSquare, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeOption = "Dark" | "Light" | "System";

interface UsageItem {
  label: string;
  value: string;
  max: string;
  pct: number;
  color: string;
}

const USAGE_ITEMS: UsageItem[] = [
  { label: "Storage", value: "124 MB", max: "1 GB", pct: 12, color: "bg-blue-500" },
  { label: "Egress", value: "1.2 GB", max: "10 GB", pct: 12, color: "bg-green-500" },
  { label: "Compute Units", value: "8.2", max: "10", pct: 82, color: "bg-amber-500" },
  { label: "AI Checkpoints", value: "18", max: "50", pct: 36, color: "bg-purple-500" },
];

function SettingsRow({
  icon, label, value, chevron = true, danger = false, onClick, rightNode
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string;
  chevron?: boolean;
  danger?: boolean;
  onClick?: () => void;
  rightNode?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-[13px] transition-colors text-left",
        danger ? "hover:bg-red-500/8" : "hover:bg-white/4"
      )}
    >
      {icon && <div className={cn("shrink-0", danger ? "text-red-400" : "text-white/45")}>{icon}</div>}
      <span className={cn("flex-1 text-[15px] font-[450]", danger ? "text-red-400" : "text-white")}>{label}</span>
      {value && <span className="text-sm text-white/35 mr-1">{value}</span>}
      {rightNode}
      {chevron && !rightNode && <ChevronRight size={16} className="text-white/25 shrink-0" />}
    </button>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-4 pt-5 pb-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/35">{label}</p>
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-4 bg-[#1a1a1a] border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
      {children}
    </div>
  );
}

function EditProfileSheet({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("N");
  const [username, setUsername] = useState("n_builder");
  const [bio, setBio] = useState("");

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 360, damping: 38 }}
        className="relative w-full max-w-[480px] bg-[#1c1c1c] rounded-t-3xl shadow-2xl z-10 border-t border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
        <div className="flex items-center justify-between px-5 pt-2 pb-4">
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-sm">Cancel</button>
          <h2 className="text-base font-semibold text-white">Edit Profile</h2>
          <button onClick={onClose} className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-semibold">Save</button>
        </div>
        <div className="px-5 pb-8 space-y-4">
          <div className="flex flex-col items-center gap-3 pb-2">
            <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center">
              <span className="text-white text-3xl font-bold">N</span>
            </div>
            <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium">Change photo</button>
          </div>
          {[
            { label: "Display Name", value: name, setValue: setName, placeholder: "Your name" },
            { label: "Username", value: username, setValue: setUsername, placeholder: "@username" },
            { label: "Bio", value: bio, setValue: setBio, placeholder: "Tell us about yourself..." },
          ].map(field => (
            <div key={field.label}>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">{field.label}</label>
              <input
                value={field.value}
                onChange={e => field.setValue(e.target.value)}
                placeholder={field.placeholder}
                className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/25 transition-colors"
              />
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Account() {
  const [theme, setTheme] = useState<ThemeOption>("Dark");
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showUsage, setShowUsage] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyUsername = () => {
    navigator.clipboard.writeText("@n_builder").catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const themeOptions: { label: ThemeOption; icon: React.ReactNode }[] = [
    { label: "Dark", icon: <Moon size={15} /> },
    { label: "Light", icon: <Sun size={15} /> },
    { label: "System", icon: <Monitor size={15} /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col min-h-full pb-28 max-w-[480px] mx-auto w-full"
    >
      {/* Profile header */}
      <div className="flex flex-col items-center pt-14 pb-5 px-4">
        <div className="relative mb-4">
          <div className="w-[84px] h-[84px] rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
            <span className="text-white text-3xl font-bold">N</span>
          </div>
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-400 rounded-full border-2 border-[#141414]" />
        </div>
        <h2 className="text-xl font-bold text-white leading-tight">N</h2>
        <div className="flex items-center gap-1.5 mt-1">
          <p className="text-sm text-white/45">@n_builder</p>
          <button onClick={handleCopyUsername} className="text-white/25 hover:text-white/60 transition-colors">
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          </button>
        </div>
        <p className="text-sm text-white/25 mt-0.5">n_builder@gmail.com</p>
        <p className="text-sm text-white/25 mt-2 italic">You don't have a bio yet...</p>
      </div>

      <div className="px-4 mb-4">
        {/* Core CTA */}
        <button
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20"
          data-testid="button-join-core"
        >
          <Sparkles size={16} className="text-yellow-300" />
          Join Replit Core
          <span className="ml-1 text-[11px] bg-white/20 px-1.5 py-0.5 rounded-full font-bold">PRO</span>
        </button>
      </div>

      {/* USAGE */}
      <SectionHeader label="Usage" />
      <div className="mx-4 bg-[#1a1a1a] border border-white/[0.08] rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowUsage(!showUsage)}
          className="w-full flex items-center gap-3 px-4 py-[13px] hover:bg-white/4 transition-colors"
          data-testid="button-usage"
        >
          <Info size={16} className="text-white/45 shrink-0" />
          <span className="flex-1 text-[15px] font-[450] text-white">Storage & Compute</span>
          <span className="text-xs text-white/30 mr-1">Free plan</span>
          <motion.div animate={{ rotate: showUsage ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={16} className="text-white/25" />
          </motion.div>
        </button>
        <AnimatePresence>
          {showUsage && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-white/[0.06]"
            >
              <div className="px-4 py-4 space-y-3.5">
                {USAGE_ITEMS.map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs font-medium text-white/50">{item.label}</span>
                      <span className="text-xs text-white/35 font-mono">{item.value} / {item.max}</span>
                    </div>
                    <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.pct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className={cn("h-full rounded-full", item.color, item.pct > 80 ? "opacity-100" : "opacity-80")}
                      />
                    </div>
                  </div>
                ))}
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-xs text-white/30">Resets monthly</span>
                  <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">Upgrade plan →</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PROFILE */}
      <SectionHeader label="Profile" />
      <Section>
        <SettingsRow icon={<Pencil size={16} />} label="Edit Profile" onClick={() => setShowEditProfile(true)} />
        <SettingsRow icon={<Globe size={16} />} label="Public Profile" value="replit.com/@n_builder" />
        <SettingsRow icon={<Code2 size={16} />} label="My Repls" />
      </Section>

      {/* SUBSCRIPTION */}
      <SectionHeader label="Subscription" />
      <Section>
        <SettingsRow icon={<CreditCard size={16} />} label="Billing" value="Free" />
        <SettingsRow icon={<Star size={16} />} label="Core Features" />
        <SettingsRow icon={<Zap size={16} />} label="AI Usage Limits" value="10 msgs/day" />
      </Section>

      {/* THEME */}
      <SectionHeader label="Appearance" />
      <div className="mx-4 bg-[#1a1a1a] border border-white/[0.08] rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowThemePicker(!showThemePicker)}
          className="w-full flex items-center gap-3 px-4 py-[13px] hover:bg-white/4 transition-colors"
          data-testid="button-theme"
        >
          <Moon size={16} className="text-white/45 shrink-0" />
          <span className="flex-1 text-[15px] font-[450] text-white">Theme</span>
          <span className="text-sm text-white/35 mr-1">{theme}</span>
          <motion.div animate={{ rotate: showThemePicker ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={16} className="text-white/25" />
          </motion.div>
        </button>
        <AnimatePresence>
          {showThemePicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-white/[0.06]"
            >
              <div className="p-2 grid grid-cols-3 gap-2">
                {themeOptions.map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => { setTheme(opt.label); setShowThemePicker(false); }}
                    className={cn(
                      "flex flex-col items-center gap-2 py-3 rounded-xl border transition-all",
                      theme === opt.label
                        ? "bg-white/10 border-white/25 text-white"
                        : "border-white/6 text-white/40 hover:text-white/70 hover:bg-white/5"
                    )}
                    data-testid={`theme-option-${opt.label.toLowerCase()}`}
                  >
                    {opt.icon}
                    <span className="text-xs font-medium">{opt.label}</span>
                    {theme === opt.label && <div className="w-1 h-1 rounded-full bg-blue-400" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* REPLIT TEAMS */}
      <SectionHeader label="Replit Teams" />
      <Section>
        <SettingsRow icon={<ExternalLink size={16} />} label="Get Teams" />
        <SettingsRow icon={<Users size={16} />} label="Join a Team" />
      </Section>

      {/* NOTIFICATIONS & PRIVACY */}
      <SectionHeader label="Preferences" />
      <Section>
        <SettingsRow icon={<Bell size={16} />} label="Notifications" />
        <SettingsRow icon={<Key size={16} />} label="Connected Apps" />
        <SettingsRow icon={<Shield size={16} />} label="Privacy & Security" />
      </Section>

      {/* HELP */}
      <SectionHeader label="Help & Support" />
      <Section>
        <SettingsRow icon={<HelpCircle size={16} />} label="Help Center" />
        <SettingsRow icon={<BookOpen size={16} />} label="Documentation" />
        <SettingsRow icon={<MessageSquare size={16} />} label="Community Forum" />
      </Section>

      {/* ACCOUNT DANGER ZONE */}
      <SectionHeader label="Account" />
      <Section>
        <SettingsRow icon={<LogOut size={16} />} label="Log Out" chevron={false} />
        <SettingsRow icon={<Trash2 size={16} />} label="Delete Account" danger chevron={false} />
      </Section>

      <p className="text-center text-[11px] text-white/15 mt-6">Replit v4.2.0 · iOS 17.4</p>

      {/* Edit Profile Sheet */}
      <AnimatePresence>
        {showEditProfile && <EditProfileSheet onClose={() => setShowEditProfile(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
