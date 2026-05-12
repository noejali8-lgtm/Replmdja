import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const UNREAD_COUNT_KEY = "notif_unread_count";

export function NotificationBell() {
  const [, setLocation] = useLocation();
  const [count, setCount] = useState(4);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(UNREAD_COUNT_KEY);
    if (stored !== null) setCount(parseInt(stored, 10));
  }, []);

  useEffect(() => {
    if (count > 0) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 1200);
      return () => clearTimeout(t);
    }
  }, [count]);

  const handleClick = () => {
    setCount(0);
    localStorage.setItem(UNREAD_COUNT_KEY, "0");
    setLocation("/notifications");
  };

  return (
    <button
      onClick={handleClick}
      className="relative w-8 h-8 flex items-center justify-center text-white/50 hover:text-white transition-colors rounded-xl hover:bg-white/6"
      data-testid="button-notifications"
    >
      <motion.div
        animate={pulse ? { rotate: [-8, 8, -6, 6, 0] } : {}}
        transition={{ duration: 0.5 }}
      >
        <Bell size={18} />
      </motion.div>

      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className={cn(
              "absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center px-1",
              "bg-blue-500 border border-[#141414]"
            )}
          >
            <span className="text-[9px] font-bold text-white leading-none">
              {count > 9 ? "9+" : count}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
