import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical } from "lucide-react";
import { SiGithub } from "react-icons/si";
import { CategoryChips } from "@/components/CategoryChips";
import { CreateInput } from "@/components/CreateInput";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [showGithubTooltip, setShowGithubTooltip] = useState(true);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col h-full px-4 pt-12 pb-24 max-w-[480px] mx-auto w-full relative"
    >
      {/* Header */}
      <header className="flex items-center justify-between mb-12">
        <button
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground"
          data-testid="button-menu"
        >
          <MoreVertical size={24} />
        </button>
        <span className="text-sm font-medium text-muted-foreground">N's workspace</span>
        <div className="relative">
          <Avatar
            className="w-8 h-8 border border-border cursor-pointer"
            onClick={() => setShowGithubTooltip((v) => !v)}
            data-testid="avatar-user"
          >
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
              N
            </AvatarFallback>
          </Avatar>

          <AnimatePresence>
            {showGithubTooltip && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 top-12 bg-card border border-border shadow-xl rounded-lg p-3 w-48 z-50 flex items-start gap-3"
              >
                <div className="mt-0.5 text-foreground">
                  <SiGithub size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground leading-tight mb-1">
                    Import from GitHub
                  </p>
                  <p className="text-xs text-muted-foreground leading-snug">
                    Bring in your existing repositories.
                  </p>
                </div>
                <div className="absolute -top-2 right-3 w-4 h-4 bg-card border-t border-l border-border transform rotate-45" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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

      {/* Click away listener for tooltip */}
      {showGithubTooltip && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowGithubTooltip(false)}
          data-testid="overlay-dismiss-tooltip"
        />
      )}
    </motion.div>
  );
}
