import { motion } from "framer-motion";
import { Settings, CreditCard, HelpCircle, LogOut, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Account() {
  const options = [
    { icon: Settings, label: "Settings" },
    { icon: CreditCard, label: "Billing" },
    { icon: HelpCircle, label: "Help & Support" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full px-4 pt-12 pb-24 max-w-[480px] mx-auto w-full"
    >
      <h1 className="text-2xl font-bold mb-8 text-foreground">Account</h1>
      
      <div className="flex flex-col items-center mb-10">
        <Avatar className="w-24 h-24 border-4 border-border mb-4">
          <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">N</AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-bold text-foreground">N's workspace</h2>
        <p className="text-sm text-muted-foreground mt-1">Free Plan</p>
        
        <div className="flex gap-6 mt-6">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-foreground">5</span>
            <span className="text-xs text-muted-foreground">Projects</span>
          </div>
          <div className="w-px bg-border"></div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-foreground">12</span>
            <span className="text-xs text-muted-foreground">Deployments</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {options.map((option, idx) => {
          const Icon = option.icon;
          return (
            <button 
              key={idx}
              className="flex items-center justify-between p-4 rounded-xl hover:bg-secondary/50 transition-colors"
              data-testid={`button-account-${option.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="flex items-center gap-3">
                <div className="text-muted-foreground">
                  <Icon size={20} />
                </div>
                <span className="font-medium text-foreground">{option.label}</span>
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
          );
        })}
        
        <div className="h-px bg-border my-2 mx-4" />
        
        <button 
          className="flex items-center justify-between p-4 rounded-xl hover:bg-destructive/10 text-destructive transition-colors group"
          data-testid="button-account-sign-out"
        >
          <div className="flex items-center gap-3">
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </div>
        </button>
      </div>
    </motion.div>
  );
}
