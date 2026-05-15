import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { GeminiChatPanel } from "@/components/GeminiChatPanel";
import { BYOKPanel } from "@/components/BYOKPanel";

export default function GeminiPage() {
  const [, setLocation] = useLocation();
  const [showBYOK, setShowBYOK] = useState(false);

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0a0a0a] overflow-hidden">
      <GeminiChatPanel onOpenBYOK={() => setShowBYOK(true)} />

      {showBYOK && (
        <BYOKPanel
          initialProvider="gemini"
          onClose={() => setShowBYOK(false)}
        />
      )}
    </div>
  );
}
