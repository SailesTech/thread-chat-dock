
import { useState } from "react";
import { FileText, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { useNotionPages } from "@/hooks/useNotionData";
import { useNotionSelection } from "@/contexts/NotionSelectionContext";

export function PageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedDatabase, selectedPage, setSelectedPage } = useNotionSelection();
  const { pages, loading } = useNotionPages(selectedDatabase || null);

  const selectedPageData = pages.find(page => page.id === selectedPage);

  const handleSelect = (pageId: string) => {
    setSelectedPage(pageId);
    setIsOpen(false);
  };

  if (!selectedDatabase) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between text-left font-normal"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="truncate">
              {selectedPageData ? selectedPageData.name : "Wybierz stronę (opcjonalne)..."}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>
              {loading ? "Ładowanie..." : "Nie znaleziono stron"}
            </CommandEmpty>
            <CommandGroup heading="Strony">
              <CommandItem
                onSelect={() => handleSelect("")}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                <span className="italic text-slate-500">Wszystkie strony</span>
              </CommandItem>
              {pages.map((page) => (
                <CommandItem
                  key={page.id}
                  onSelect={() => handleSelect(page.id)}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>{page.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
