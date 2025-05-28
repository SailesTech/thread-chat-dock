
import { useState } from "react";
import { Database, FileText, Filter, MessageCircle, ChevronDown } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ThreadsList } from "@/components/ThreadsList";

const databases = [
  { id: "db1", name: "Produkty", available: true },
  { id: "db2", name: "Klienci", available: true },
  { id: "db3", name: "Zamówienia", available: false },
];

const pages = [
  { id: "p1", name: "Strona główna", database: "db1" },
  { id: "p2", name: "Katalog produktów", database: "db1" },
  { id: "p3", name: "Baza klientów", database: "db2" },
];

const attributes = [
  { id: "a1", name: "Nazwa", type: "text" },
  { id: "a2", name: "Cena", type: "number" },
  { id: "a3", name: "Kategoria", type: "select" },
  { id: "a4", name: "Dostępność", type: "checkbox" },
];

export function AppSidebar() {
  const { collapsed } = useSidebar();
  const [selectedDatabase, setSelectedDatabase] = useState<string>("");
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);

  const filteredPages = pages.filter(page => page.database === selectedDatabase);

  const handleAttributeChange = (attributeId: string, checked: boolean) => {
    setSelectedAttributes(prev => 
      checked 
        ? [...prev, attributeId]
        : prev.filter(id => id !== attributeId)
    );
  };

  if (collapsed) {
    return (
      <Sidebar className="w-14">
        <SidebarContent className="flex flex-col items-center gap-4 pt-4">
          <Database className="h-6 w-6 text-blue-600" />
          <FileText className="h-6 w-6 text-slate-400" />
          <Filter className="h-6 w-6 text-slate-400" />
          <MessageCircle className="h-6 w-6 text-slate-400" />
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar className="w-80 border-r bg-white/50 backdrop-blur-sm">
      <SidebarContent className="p-4 space-y-6">
        {/* Baza danych */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Database className="h-4 w-4" />
            Baza danych
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <Select value={selectedDatabase} onValueChange={setSelectedDatabase}>
              <SelectTrigger className="w-full bg-white border-slate-200">
                <SelectValue placeholder="Wybierz bazę danych" />
              </SelectTrigger>
              <SelectContent>
                {databases.map((db) => (
                  <SelectItem 
                    key={db.id} 
                    value={db.id}
                    disabled={!db.available}
                    className={!db.available ? "text-slate-400" : ""}
                  >
                    <div className="flex items-center justify-between w-full">
                      {db.name}
                      {!db.available && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Niedostępna
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Strony */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <FileText className="h-4 w-4" />
            Strony
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <Select 
              value={selectedPage} 
              onValueChange={setSelectedPage}
              disabled={!selectedDatabase}
            >
              <SelectTrigger className="w-full bg-white border-slate-200">
                <SelectValue placeholder="Wybierz stronę" />
              </SelectTrigger>
              <SelectContent>
                {filteredPages.map((page) => (
                  <SelectItem key={page.id} value={page.id}>
                    {page.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Atrybuty */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Filter className="h-4 w-4" />
            Atrybuty
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-3">
              {attributes.map((attr) => (
                <div key={attr.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={attr.id}
                    checked={selectedAttributes.includes(attr.id)}
                    onCheckedChange={(checked) => 
                      handleAttributeChange(attr.id, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={attr.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                  >
                    {attr.name}
                  </label>
                  <Badge variant="outline" className="text-xs">
                    {attr.type}
                  </Badge>
                </div>
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Wątki */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <MessageCircle className="h-4 w-4" />
            Wątki
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <ThreadsList />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
