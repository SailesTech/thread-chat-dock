
import { useState, useMemo } from "react";
import { Search, Database, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useNotionDatabases, useNotionPages } from "@/hooks/useNotionData";
import { useNotionSelection } from "@/contexts/NotionSelectionContext";

export function UnifiedSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  
  const { databases, loading: databasesLoading } = useNotionDatabases();
  const { selectedDatabase, setSelectedDatabase, setSelectedPage } = useNotionSelection();
  const { pages, loading: pagesLoading } = useNotionPages(selectedDatabase || null);

  const filteredItems = useMemo(() => {
    if (!searchValue) return [];
    
    const searchLower = searchValue.toLowerCase();
    
    const filteredDatabases = databases
      .filter(db => db.name.toLowerCase().includes(searchLower))
      .map(db => ({ type: 'database' as const, item: db }));
    
    const filteredPages = pages
      .filter(page => page.name.toLowerCase().includes(searchLower))
      .map(page => ({ type: 'page' as const, item: page }));
    
    return [...filteredDatabases, ...filteredPages];
  }, [searchValue, databases, pages]);

  const handleSelect = (type: 'database' | 'page', item: any) => {
    if (type === 'database') {
      setSelectedDatabase(item.id);
      setSelectedPage(""); // Reset page when database changes
    } else if (type === 'page') {
      setSelectedPage(item.id);
    }
    setSearchValue("");
    setIsOpen(false);
  };

  const selectedItems = [];
  if (selectedDatabase) {
    const db = databases.find(d => d.id === selectedDatabase);
    if (db) selectedItems.push({ type: 'database', name: db.name });
  }
  if (selectedDatabase && selectedDatabase) {
    const page = pages.find(p => p.id === selectedDatabase);
    if (page) selectedItems.push({ type: 'page', name: page.name });
  }

  return (
    <div className="space-y-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
            onClick={() => setIsOpen(true)}
          >
            <Search className="mr-2 h-4 w-4" />
            {selectedItems.length > 0 
              ? `${selectedItems.length} wybranych` 
              : "Wyszukaj bazy i strony..."
            }
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input
                placeholder="Wyszukaj bazy i strony..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <CommandList>
              <CommandEmpty>
                {databasesLoading || pagesLoading ? "Ładowanie..." : "Nie znaleziono wyników"}
              </CommandEmpty>
              
              {filteredItems.length > 0 && (
                <>
                  <CommandGroup heading="Bazy danych">
                    {filteredItems
                      .filter(item => item.type === 'database')
                      .map(({ item }) => (
                        <CommandItem
                          key={`db-${item.id}`}
                          onSelect={() => handleSelect('database', item)}
                          className="flex items-center gap-2"
                        >
                          <Database className="h-4 w-4" />
                          <span>{item.name}</span>
                        </CommandItem>
                      ))
                    }
                  </CommandGroup>
                  
                  <CommandGroup heading="Strony">
                    {filteredItems
                      .filter(item => item.type === 'page')
                      .map(({ item }) => (
                        <CommandItem
                          key={`page-${item.id}`}
                          onSelect={() => handleSelect('page', item)}
                          className="flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          <span>{item.name}</span>
                        </CommandItem>
                      ))
                    }
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Wybrane elementy */}
      {selectedItems.length > 0 && (
        <div className="space-y-1">
          {selectedItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-2 py-1 rounded">
              {item.type === 'database' ? <Database className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
