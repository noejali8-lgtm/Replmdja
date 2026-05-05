import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Github } from "lucide-react";
import { SiGithub } from "react-icons/si";
import { CategoryChips } from "@/components/CategoryChips";
import { CreateInput } from "@/components/CreateInput";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [showMenu, setShowMenu] = useState(false);
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
    sessionStorage.setItem("chat_prompt", "Import from GitHub");
    setLocation("/chat");
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
        {/* Three-dot menu */}
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
    </motion.div>
  );
}
