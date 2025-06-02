
import { useState } from "react";
import { Filter, Database, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useNotionSelection } from "@/contexts/NotionSelectionContext";
import { useNotionAttributes } from "@/hooks/useNotionData";
import { AttributeValueSelector } from "./AttributeValueSelector";

interface AttributeSectionManagerProps {
  databaseId: string;
}

export function AttributeSectionManager({ databaseId }: AttributeSectionManagerProps) {
  const [filteringSectionOpen, setFilteringSectionOpen] = useState(true);
  const [dataSectionOpen, setDataSectionOpen] = useState(false);
  
  const {
    filteringAttributes,
    dataAttributes,
    filteringAttributeValues,
    toggleFilteringAttribute,
    toggleDataAttribute,
  } = useNotionSelection();

  const { attributes, loading, error } = useNotionAttributes(databaseId);

  if (loading) {
    return <div className="text-sm text-slate-500">Ładowanie atrybutów...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500">Błąd: {error}</div>;
  }

  const filterableTypes = ['select', 'multi_select', 'status', 'checkbox', 'date', 'number'];
  const filterableAttributes = attributes.filter(attr => filterableTypes.includes(attr.type));

  return (
    <div className="space-y-4">
      {/* Filtering Attributes Section */}
      <Collapsible open={filteringSectionOpen} onOpenChange={setFilteringSectionOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Atrybuty filtrujące</span>
              <Badge variant="secondary" className="text-xs">
                {filteringAttributes.length}
              </Badge>
            </div>
            {filteringSectionOpen ? 
              <ChevronDown className="h-4 w-4" /> : 
              <ChevronRight className="h-4 w-4" />
            }
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-2">
          <div className="text-xs text-slate-600 mb-2">
            Wybierz atrybuty, których wartości będą używane do filtrowania stron w bazie danych
          </div>
          {filterableAttributes.length === 0 ? (
            <div className="text-sm text-slate-500">Brak atrybutów do filtrowania</div>
          ) : (
            <div className="space-y-3">
              {filterableAttributes.map((attr) => {
                const isSelected = filteringAttributes.some(fa => fa.id === attr.id);
                return (
                  <div key={attr.id} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`filtering-${attr.id}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleFilteringAttribute(attr.id, attr)}
                      />
                      <label
                        htmlFor={`filtering-${attr.id}`}
                        className="text-sm font-medium leading-none flex-1"
                      >
                        {attr.name}
                      </label>
                      <Badge variant="outline" className="text-xs">
                        {attr.type}
                      </Badge>
                    </div>
                    
                    {isSelected && (attr.type === 'select' || attr.type === 'multi_select' || attr.type === 'status') && (
                      <div className="ml-6">
                        <AttributeValueSelector
                          attributeId={attr.id}
                          attributeName={attr.name}
                          attributeType={attr.type}
                          databaseId={databaseId}
                          mode="filtering"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Data Attributes Section */}
      <Collapsible open={dataSectionOpen} onOpenChange={setDataSectionOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="font-medium">Atrybuty danych</span>
              <Badge variant="secondary" className="text-xs">
                {dataAttributes.filter(attr => attr.selected).length}/{attributes.length}
              </Badge>
            </div>
            {dataSectionOpen ? 
              <ChevronDown className="h-4 w-4" /> : 
              <ChevronRight className="h-4 w-4" />
            }
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-2">
          <div className="text-xs text-slate-600 mb-2">
            Wybierz które atrybuty będą wysyłane do AI (domyślnie wszystkie)
          </div>
          {attributes.length === 0 ? (
            <div className="text-sm text-slate-500">Brak atrybutów</div>
          ) : (
            <div className="space-y-2">
              {attributes.map((attr) => {
                const dataAttr = dataAttributes.find(da => da.id === attr.id);
                const isSelected = dataAttr?.selected ?? true; // Default to selected
                
                return (
                  <div key={attr.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`data-${attr.id}`}
                      checked={isSelected}
                      onCheckedChange={() => toggleDataAttribute(attr.id, attr)}
                    />
                    <label
                      htmlFor={`data-${attr.id}`}
                      className="text-sm font-medium leading-none flex-1"
                    >
                      {attr.name}
                    </label>
                    <Badge variant="outline" className="text-xs">
                      {attr.type}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Filter Summary */}
      {filteringAttributeValues.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-xs font-medium text-blue-800 mb-2">Aktywne filtry:</div>
          <div className="space-y-1">
            {filteringAttributeValues.map((filter) => (
              <div key={filter.attributeId} className="text-xs text-blue-700">
                <strong>{filter.attributeName}:</strong> {filter.selectedNames.join(', ')}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
