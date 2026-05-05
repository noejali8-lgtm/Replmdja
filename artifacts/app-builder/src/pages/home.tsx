import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Lock, Globe, Download, ChevronDown, X } from "lucide-react";
import { SiGithub } from "react-icons/si";
import { CategoryChips } from "@/components/CategoryChips";
import { CreateInput } from "@/components/CreateInput";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function ImportFromGitHubSheet({ onClose }: { onClose: () => void }) {
  const [, setLocation] = useLocation();
  const [repoUrl, setRepoUrl] = useState("");
  const [privacy, setPrivacy] = useState<"private" | "public">("private");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  const username =
    (typeof localStorage !== "undefined" && localStorage.getItem("git_author_name")) ||
    "username";
  const initial = username[0]?.toUpperCase() || "U";

  const normalizeUrl = (raw: string) => {
    const trimmed = raw.trim().replace(/^https?:\/\//, "").replace(/^github\.com\//, "");
    return trimmed;
  };

  const handleImport = async () => {
    const slug = normalizeUrl(repoUrl);
    if (!slug || !slug.includes("/")) {
      setError("Please enter a valid GitHub URL (e.g. github.com/user/repo)");
      return;
    }
    setError("");
    setImporting(true);
    await new Promise(r => setTimeout(r, 1400));
    setImporting(false);
    onClose();
    sessionStorage.setItem("chat_prompt", `Import GitHub repo: https://github.com/${slug}`);
    setLocation("/chat");
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 360, damping: 38 }}
        className="relative w-full max-w-[480px] bg-[#1a1a2e] rounded-t-3xl overflow-hidden shadow-2xl z-10"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4">
          <div className="w-8" />
          <h2 className="text-xl font-bold text-white tracking-tight">Import From GitHub</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white transition-colors rounded-full hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pb-8 space-y-5">

          {/* GitHub URL */}
          <div>
            <label className="block text-sm font-semibold text-white text-right mb-2">
              GitHub URL
            </label>
            <input
              type="text"
              value={repoUrl}
              onChange={e => { setRepoUrl(e.target.value); setError(""); }}
              placeholder="github.com/user/repo"
              className={cn(
                "w-full bg-transparent border rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-white/35 outline-none transition-colors",
                error ? "border-red-400/60 focus:border-red-400" : "border-white/15 focus:border-white/40"
              )}
              data-testid="input-github-repo-url"
              autoFocus
            />
            {error && (
              <p className="text-xs text-red-400 mt-1.5">{error}</p>
            )}
          </div>

          {/* Owner */}
          <div>
            <label className="block text-sm font-semibold text-white text-right mb-2">
              Owner
            </label>
            <div className="flex items-center justify-between border border-white/15 rounded-xl px-4 py-3 bg-transparent">
              <ChevronDown size={16} className="text-white/50" />
              <div className="flex items-center gap-2.5">
                <span className="text-sm text-white font-medium">{username}</span>
                <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-white">{initial}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div>
            <label className="block text-sm font-semibold text-white text-right mb-2">
              Privacy
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
              <button
                onClick={() => setPrivacy("private")}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all",
                  privacy === "private"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "text-white/50 hover:text-white/80"
                )}
                data-testid="button-privacy-private"
              >
                <Lock size={14} />
                Private
              </button>
              <button
                onClick={() => setPrivacy("public")}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all",
                  privacy === "public"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "text-white/50 hover:text-white/80"
                )}
                data-testid="button-privacy-public"
              >
                <Globe size={14} />
                Public
              </button>
            </div>
            <p className="text-xs text-white/45 mt-2 text-center leading-relaxed">
              {privacy === "private"
                ? "Only you and collaborators can view and remix this Project."
                : "Anyone can view and remix this Project."}
            </p>
          </div>

          {/* Import button */}
          <button
            onClick={handleImport}
            disabled={importing}
            className={cn(
              "w-full flex items-center justify-center gap-2.5 py-4 rounded-xl text-sm font-semibold transition-all",
              importing
                ? "bg-white/10 text-white/50 cursor-not-allowed"
                : "bg-white/10 border border-white/20 text-white hover:bg-white/15 active:scale-[0.98]"
            )}
            data-testid="button-import-repo"
          >
            {importing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
                Importing...
              </>
            ) : (
              <>
                Import
                <Download size={15} />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [, setLocation] = useLocation();

  const handleChipSelect = (category: string) => {
    const newText =
      prompt.length > 0 ? `${prompt} ${category}` : `I want to make a ${category}`;
    setPrompt(newText);
  };

  const handleSubmit = () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    sessionStorage.setItem("chat_prompt", trimmed);
    setLocation("/chat");
  };

  const handleImportGithub = () => {
    setShowMenu(false);
    setShowImport(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col h-full px-4 pt-12 pb-24 max-w-[480px] mx-auto w-full relative"
    >
      {/* Header */}
      <header className="flex items-center justify-between mb-12">
        <div className="relative">
          <button
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowMenu((v) => !v)}
            data-testid="button-menu"
          >
            <MoreVertical size={24} />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                  data-testid="overlay-dismiss-menu"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-10 bg-card border border-border shadow-xl rounded-xl overflow-hidden z-50 min-w-[200px]"
                >
                  <button
                    onClick={handleImportGithub}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/60 transition-colors text-left"
                    data-testid="button-import-github"
                  >
                    <SiGithub size={18} className="text-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground leading-tight">
                        Import from GitHub
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Bring in your existing repositories
                      </p>
                    </div>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <span className="text-sm font-medium text-muted-foreground">N's workspace</span>

        <Avatar
          className="w-8 h-8 border border-border cursor-pointer"
          data-testid="avatar-user"
        >
          <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
            N
          </AvatarFallback>
        </Avatar>
      </header>

      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground leading-tight tracking-tight">
          Hi N,
          <br />
          what do you want to make?
        </h1>
      </div>

      {/* Categories */}
      <div className="mb-auto">
        <CategoryChips onSelect={handleChipSelect} />
      </div>

      {/* Input Area */}
      <div className="mt-8 space-y-4">
        <CreateInput value={prompt} onChange={setPrompt} onSubmit={handleSubmit} />

        <div className="flex flex-col items-center gap-1 text-xs pb-4">
          <span className="text-muted-foreground">Start creating for free</span>
          <a
            href="#"
            className="text-primary hover:underline font-medium decoration-primary/50 underline-offset-4"
          >
            Join Replit Core to unlock more usage
          </a>
        </div>
      </div>

      {/* Import from GitHub sheet */}
      <AnimatePresence>
        {showImport && (
          <ImportFromGitHubSheet onClose={() => setShowImport(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
