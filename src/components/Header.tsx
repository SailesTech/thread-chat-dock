
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";

export function Header() {
  return (
    <header className="h-16 border-b bg-white/80 backdrop-blur-md flex items-center justify-between px-4 shadow-sm">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-slate-600 hover:text-slate-900" />
        <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Notion Chat Assistant
        </h1>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="border-blue-200 text-blue-600 hover:bg-blue-50"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nowy wątek
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-slate-600 hover:text-slate-900"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
