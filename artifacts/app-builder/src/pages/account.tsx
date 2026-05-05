import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ExternalLink, Pencil, Moon, Users, Info,
  Sparkles, Bell, Shield, Trash2, Check
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type ThemeOption = "Dark" | "Light" | "System";

export default function Account() {
  const [theme, setTheme] = useState<ThemeOption>("Dark");
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showUsage, setShowUsage] = useState(false);

  const themeOptions: ThemeOption[] = ["Dark", "Light", "System"];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col min-h-full pb-24 max-w-[480px] mx-auto w-full"
    >
      {/* Profile header */}
      <div className="flex flex-col items-center pt-14 pb-6 px-4">
        <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center mb-3 shadow-lg">
          <span className="text-white text-3xl font-bold">N</span>
        </div>
        <h2 className="text-xl font-bold text-foreground leading-tight">N</h2>
        <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
          <span>n_builder</span>
          <span className="text-border">@</span>
        </p>
        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
          <span>n_builder@gmail.com</span>
          <span className="text-border">✉</span>
        </p>
        <p className="text-sm text-muted-foreground/60 mt-2 italic">You don't have a bio yet...</p>
      </div>

      <div className="px-4 space-y-2">
        {/* Join Replit Core */}
        <button
          className="w-full bg-[#1f6feb] hover:bg-[#388bfd] text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md"
          data-testid="button-join-core"
        >
          <Sparkles size={18} className="text-yellow-300" />
          Join Replit Core
        </button>

        {/* Usage */}
        <button
          onClick={() => setShowUsage(!showUsage)}
          className="w-full flex items-center justify-between px-4 py-4 bg-secondary/30 hover:bg-secondary/50 rounded-xl transition-colors"
          data-testid="button-usage"
        >
          <div className="flex items-center gap-3 text-foreground font-medium">
            <ChevronRight size={18} className="text-muted-foreground" />
            Usage
          </div>
          <Info size={18} className="text-muted-foreground" />
        </button>

        <AnimatePresence>
          {showUsage && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 py-4 bg-secondary/20 rounded-xl space-y-3 border border-border/50">
                {[
                  { label: "Storage", value: "124 MB", max: "1 GB", pct: 12 },
                  { label: "Compute Units", value: "8.2", max: "10", pct: 82 },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{item.label}</span>
                      <span>{item.value} / {item.max}</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PROFILE */}
        <div className="pt-2">
          <p className="text-xs text-muted-foreground/60 font-semibold uppercase tracking-widest px-1 mb-1">Profile</p>
          <button
            className="w-full flex items-center justify-between px-4 py-4 bg-secondary/30 hover:bg-secondary/50 rounded-xl transition-colors"
            data-testid="button-edit-profile"
          >
            <div className="flex items-center gap-3 text-foreground font-medium">
              <ChevronRight size={18} className="text-muted-foreground" />
              Edit Profile
            </div>
            <Pencil size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* THEME */}
        <div className="pt-2">
          <p className="text-xs text-muted-foreground/60 font-semibold uppercase tracking-widest px-1 mb-1">Theme</p>
          <button
            onClick={() => setShowThemePicker(!showThemePicker)}
            className="w-full flex items-center justify-between px-4 py-4 bg-secondary/30 hover:bg-secondary/50 rounded-xl transition-colors"
            data-testid="button-theme"
          >
            <div className="flex items-center gap-3 text-foreground font-medium">
              <ChevronRight size={18} className="text-muted-foreground" />
              Theme – {theme}
            </div>
            <Moon size={16} className="text-muted-foreground" />
          </button>
          <AnimatePresence>
            {showThemePicker && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-1 bg-secondary/20 rounded-xl border border-border/50 overflow-hidden">
                  {themeOptions.map(opt => (
                    <button
                      key={opt}
                      onClick={() => { setTheme(opt); setShowThemePicker(false); }}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors"
                      data-testid={`theme-option-${opt.toLowerCase()}`}
                    >
                      <span className="text-sm text-foreground">{opt}</span>
                      {theme === opt && <Check size={16} className="text-primary" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* REPLIT TEAMS */}
        <div className="pt-2">
          <p className="text-xs text-muted-foreground/60 font-semibold uppercase tracking-widest px-1 mb-1">Replit Teams</p>
          <button
            className="w-full flex items-center justify-between px-4 py-4 bg-secondary/30 hover:bg-secondary/50 rounded-xl transition-colors"
            data-testid="button-get-teams"
          >
            <div className="flex items-center gap-3 text-foreground font-medium">
              <ExternalLink size={18} className="text-muted-foreground" />
              Get Teams
            </div>
            <Users size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* NOTIFICATIONS */}
        <div className="pt-2">
          <p className="text-xs text-muted-foreground/60 font-semibold uppercase tracking-widest px-1 mb-1">Notifications</p>
          <button
            className="w-full flex items-center justify-between px-4 py-4 bg-secondary/30 hover:bg-secondary/50 rounded-xl transition-colors"
            data-testid="button-notifications"
          >
            <div className="flex items-center gap-3 text-foreground font-medium">
              <ChevronRight size={18} className="text-muted-foreground" />
              Notifications
            </div>
            <Bell size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* DANGER ZONE */}
        <div className="pt-2">
          <p className="text-xs text-muted-foreground/60 font-semibold uppercase tracking-widest px-1 mb-1">Account</p>
          <div className="bg-secondary/30 rounded-xl overflow-hidden border border-border/30">
            <button
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-secondary/50 transition-colors border-b border-border/30"
              data-testid="button-privacy"
            >
              <div className="flex items-center gap-3 text-foreground font-medium">
                <ChevronRight size={18} className="text-muted-foreground" />
                Privacy & Security
              </div>
              <Shield size={16} className="text-muted-foreground" />
            </button>
            <button
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-destructive/10 transition-colors"
              data-testid="button-delete-account"
            >
              <div className="flex items-center gap-3 text-destructive font-medium">
                <Trash2 size={18} />
                Delete Account
              </div>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
