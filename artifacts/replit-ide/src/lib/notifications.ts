export type NotifLevel = "info" | "success" | "warning" | "error";

export interface Notification {
  id: string;
  level: NotifLevel;
  title: string;
  message?: string;
  ts: number;
  read: boolean;
  action?: { label: string; href?: string; onClick?: () => void };
}

type Listener = (notifs: Notification[]) => void;

let notifications: Notification[] = [];
const listeners = new Set<Listener>();

function broadcast() {
  listeners.forEach(fn => fn([...notifications]));
}

export const notificationStore = {
  subscribe(fn: Listener) {
    listeners.add(fn);
    fn([...notifications]);
    return () => listeners.delete(fn);
  },

  push(level: NotifLevel, title: string, message?: string, action?: Notification["action"]) {
    const n: Notification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      level, title, message: message ?? "", ts: Date.now(), read: false, action,
    };
    notifications = [n, ...notifications].slice(0, 50);
    broadcast();
    return n.id;
  },

  markRead(id: string) {
    notifications = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    broadcast();
  },

  markAllRead() {
    notifications = notifications.map(n => ({ ...n, read: true }));
    broadcast();
  },

  clear() {
    notifications = [];
    broadcast();
  },

  get() { return [...notifications]; },
};

/* Convenience helpers */
export const notify = {
  info:    (title: string, msg?: string, action?: Notification["action"]) => notificationStore.push("info",    title, msg, action),
  success: (title: string, msg?: string, action?: Notification["action"]) => notificationStore.push("success", title, msg, action),
  warning: (title: string, msg?: string, action?: Notification["action"]) => notificationStore.push("warning", title, msg, action),
  error:   (title: string, msg?: string, action?: Notification["action"]) => notificationStore.push("error",   title, msg, action),
};
