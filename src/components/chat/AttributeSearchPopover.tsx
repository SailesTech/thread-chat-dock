
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotionAttributes } from "@/hooks/useNotionData";

interface AttributeSearchPopoverProps {
  selectedDatabase: string;
  onAttributeSelect: (attributeName: string) => void;
}

export function AttributeSearchPopover({ selectedDatabase, onAttributeSelect }: AttributeSearchPopoverProps) {
  const [attributeSearch, setAttributeSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { attributes, loading: attributesLoading } = useNotionAttributes(selectedDatabase || null);

  const filteredAttributes = attributes.filter(attr =>
    attr.name.toLowerCase().includes(attributeSearch.toLowerCase())
  );

  const handleAttributeSelect = (attributeName: string) => {
    onAttributeSelect(attributeName);
    setAttributeSearch("");
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-12 bottom-3 h-10 w-10 p-0 text-slate-400 hover:text-slate-600"
          title="Wyszukaj atrybuty"
        >
          <Search className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" side="top">
        <div className="p-3 border-b">
          <Input
            placeholder="Szukaj atrybutów..."
            value={attributeSearch}
            onChange={(e) => setAttributeSearch(e.target.value)}
            className="bg-white border-slate-200"
            autoFocus
          />
        </div>
        <div className="max-h-60 overflow-y-auto">
          {attributesLoading ? (
            <div className="p-3 text-sm text-slate-500">Ładowanie atrybutów...</div>
          ) : filteredAttributes.length > 0 ? (
            <div className="p-2">
              {filteredAttributes.map((attr) => (
                <button
                  key={attr.id}
                  onClick={() => handleAttributeSelect(attr.name)}
                  className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded text-left"
                >
                  <span className="text-sm font-medium">{attr.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {attr.type}
                  </Badge>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 text-sm text-slate-500">
              {selectedDatabase ? "Brak atrybutów" : "Wybierz bazę danych w sidebarze"}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
