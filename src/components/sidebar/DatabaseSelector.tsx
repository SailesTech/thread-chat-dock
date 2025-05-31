
import { useState } from "react";
import { Database, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { useNotionDatabases } from "@/hooks/useNotionData";
import { useNotionSelection } from "@/contexts/NotionSelectionContext";

export function DatabaseSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const { databases, loading } = useNotionDatabases();
  const { selectedDatabase, setSelectedDatabase, setSelectedPage } = useNotionSelection();

  const selectedDb = databases.find(db => db.id === selectedDatabase);

  const filteredDatabases = databases.filter(db =>
    db.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSelect = (databaseId: string) => {
    setSelectedDatabase(databaseId);
    setSelectedPage(""); // Reset page when database changes
    setIsOpen(false);
    setSearchValue("");
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between text-left font-normal"
          disabled={loading}
        >
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="truncate">
              {loading ? "Ładowanie..." : selectedDb ? selectedDb.name : "Wybierz bazę danych..."}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Szukaj baz danych..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="border-0 p-2 focus-visible:ring-0"
            />
          </div>
          <CommandList>
            <CommandEmpty>
              {loading ? "Ładowanie..." : "Nie znaleziono baz danych"}
            </CommandEmpty>
            <CommandGroup heading="Bazy danych">
              {filteredDatabases.map((database) => (
                <CommandItem
                  key={database.id}
                  onSelect={() => handleSelect(database.id)}
                  className="flex items-center gap-2"
                >
                  <Database className="h-4 w-4" />
                  <span>{database.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
