import { useState } from "react";
import { Database, FileText, Filter, MessageCircle, Search, AlertCircle } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThreadsList } from "@/components/ThreadsList";
import { useNotionDatabases, useNotionPages, useNotionAttributes } from "@/hooks/useNotionData";
import { useNotionSelection } from "@/contexts/NotionSelectionContext"; // ✅ Dodaj import

export function AppSidebar() {
  const { state } = useSidebar();
  
  // ✅ Użyj shared context zamiast lokalnego state
  const {
    selectedDatabase,
    selectedPage,
    selectedAttributes,
    setSelectedDatabase,
    setSelectedPage,
    setSelectedAttributes,
  } = useNotionSelection();

  // Lokalne state tylko dla search/filter
  const [databaseSearch, setDatabaseSearch] = useState("");
  const [pageSearch, setPageSearch] = useState("");
  const [attributeSearch, setAttributeSearch] = useState("");

  const { databases, loading: databasesLoading, error: databasesError } = useNotionDatabases();
  const { pages, loading: pagesLoading, error: pagesError } = useNotionPages(selectedDatabase || null);
  const { attributes, loading: attributesLoading, error: attributesError } = useNotionAttributes(selectedDatabase || null);

  const filteredDatabases = databases.filter(db =>
    db.name.toLowerCase().includes(databaseSearch.toLowerCase())
  );

  const filteredPages = pages.filter(page =>
    page.name.toLowerCase().includes(pageSearch.toLowerCase())
  );

  const filteredAttributes = attributes.filter(attr =>
    attr.name.toLowerCase().includes(attributeSearch.toLowerCase())
  );

  const handleAttributeChange = (attributeId: string, checked: boolean) => {
    setSelectedAttributes(
      checked 
        ? [...selectedAttributes, attributeId]
        : selectedAttributes.filter(id => id !== attributeId)
    );
  };

  const isCollapsed = state === "collapsed";

  if (isCollapsed) {
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
            <div className="space-y-2">
              {databasesError && (
                <Alert className="mb-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {databasesError}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Szukaj baz danych..."
                  value={databaseSearch}
                  onChange={(e) => setDatabaseSearch(e.target.value)}
                  className="pl-10 bg-white border-slate-200"
                  disabled={databasesLoading}
                />
              </div>
              <Select value={selectedDatabase} onValueChange={setSelectedDatabase}>
                <SelectTrigger className="w-full bg-white border-slate-200">
                  <SelectValue placeholder="Wybierz bazę danych" />
                </SelectTrigger>
                <SelectContent>
                  {databasesLoading ? (
                    <SelectItem value="loading" disabled>
                      Ładowanie...
                    </SelectItem>
                  ) : filteredDatabases.length === 0 ? (
                    <SelectItem value="no-data" disabled>
                      {databasesError ? 'Błąd połączenia' : 'Brak baz danych'}
                    </SelectItem>
                  ) : (
                    filteredDatabases.map((db) => (
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
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Strony */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <FileText className="h-4 w-4" />
            Strony
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-2">
              {pagesError && (
                <Alert className="mb-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {pagesError}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Szukaj stron..."
                  value={pageSearch}
                  onChange={(e) => setPageSearch(e.target.value)}
                  className="pl-10 bg-white border-slate-200"
                  disabled={!selectedDatabase || pagesLoading}
                />
              </div>
              <Select 
                value={selectedPage} 
                onValueChange={setSelectedPage}
                disabled={!selectedDatabase}
              >
                <SelectTrigger className="w-full bg-white border-slate-200">
                  <SelectValue placeholder="Wybierz stronę" />
                </SelectTrigger>
                <SelectContent>
                  {pagesLoading ? (
                    <SelectItem value="loading" disabled>
                      Ładowanie...
                    </SelectItem>
                  ) : filteredPages.length === 0 ? (
                    <SelectItem value="no-data" disabled>
                      {pagesError ? 'Błąd połączenia' : 'Brak stron'}
                    </SelectItem>
                  ) : (
                    filteredPages.map((page) => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
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
              {attributesError && (
                <Alert className="mb-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {attributesError}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Szukaj atrybutów..."
                  value={attributeSearch}
                  onChange={(e) => setAttributeSearch(e.target.value)}
                  className="pl-10 bg-white border-slate-200"
                  disabled={!selectedDatabase || attributesLoading}
                />
              </div>
              {attributesLoading ? (
                <div className="text-sm text-slate-500">Ładowanie atrybutów...</div>
              ) : filteredAttributes.length === 0 ? (
                <div className="text-sm text-slate-500">
                  {attributesError ? 'Błąd połączenia' : 'Brak atrybutów'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAttributes.map((attr) => (
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
              )}
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
