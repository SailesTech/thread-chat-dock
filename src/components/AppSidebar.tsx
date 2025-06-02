
import { useState } from "react";
import { MessageCircle, Search, AlertCircle } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThreadsList } from "@/components/ThreadsList";
import { DatabaseSelector } from "@/components/sidebar/DatabaseSelector";
import { PageSelector } from "@/components/sidebar/PageSelector";
import { AttributeSectionManager } from "@/components/sidebar/AttributeSectionManager";
import { FilterPreview } from "@/components/sidebar/FilterPreview";
import { useNotionSelection } from "@/contexts/NotionSelectionContext";

export function AppSidebar() {
  const { state } = useSidebar();
  const { selectedDatabase } = useNotionSelection();
  const [searchTerm, setSearchTerm] = useState("");

  const isCollapsed = state === "collapsed";

  if (isCollapsed) {
    return (
      <Sidebar className="w-14">
        <SidebarHeader className="p-2">
          <SidebarTrigger />
        </SidebarHeader>
        <SidebarContent className="flex flex-col items-center gap-4 pt-4">
          <MessageCircle className="h-6 w-6 text-slate-400" />
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar className="w-80 border-r bg-white/50 backdrop-blur-sm">
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Notion AI Assistant</h2>
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4 space-y-6">
        {/* Database Selection */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-semibold text-slate-700">
            Baza danych
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <DatabaseSelector />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Page Selection */}
        {selectedDatabase && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sm font-semibold text-slate-700">
              Strona (opcjonalnie)
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <PageSelector />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Attribute Management */}
        {selectedDatabase && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sm font-semibold text-slate-700">
              Konfiguracja atrybutów
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <AttributeSectionManager databaseId={selectedDatabase} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Filter Preview */}
        <FilterPreview />

        {/* Chat Threads */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <MessageCircle className="h-4 w-4" />
            Wątki
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Szukaj wątków..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-slate-200"
                />
              </div>
              <ThreadsList searchTerm={searchTerm} />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
