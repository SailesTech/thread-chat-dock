
import { useState, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotionSelection } from "@/contexts/NotionSelectionContext";
import { supabase } from "@/integrations/supabase/client";

interface AttributeOption {
  id: string;
  name: string;
  color?: string;
}

interface AttributeValueSelectorProps {
  attributeId: string;
  attributeName: string;
  attributeType: string;
  databaseId: string;
}

export function AttributeValueSelector({ 
  attributeId, 
  attributeName, 
  attributeType,
  databaseId
}: AttributeValueSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<AttributeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const { selectedAttributeValues, addAttributeValue, removeAttributeValue } = useNotionSelection();
  
  const currentSelection = selectedAttributeValues.find(av => av.attributeId === attributeId);
  const selectedValues = currentSelection?.selectedValues || [];
  
  const isMultiSelect = attributeType === 'multi_select';

  // Pobierz opcje dla tego atrybutu
  useEffect(() => {
    const fetchOptions = async () => {
      if (!databaseId || (attributeType !== 'select' && attributeType !== 'multi_select' && attributeType !== 'status')) {
        return;
      }

      setLoading(true);
      try {
        console.log(`Fetching options for attribute "${attributeName}" (${attributeType}) in database ${databaseId}`);
        
        const { data, error } = await supabase.functions.invoke('notion-integration', {
          body: {
            action: 'get_database_properties',
            database_id: databaseId,
            property_name: attributeName
          }
        });

        if (error) {
          console.error('Supabase function error:', error);
          return;
        }
        
        console.log(`Property "${attributeName}" response:`, data);
        
        if (data && data.property && data.property.options) {
          setOptions(data.property.options.map((option: any) => ({
            id: option.id,
            name: option.name,
            color: option.color
          })));
        } else {
          console.log(`No options found for property "${attributeName}"`);
          setOptions([]);
        }
      } catch (error) {
        console.error('Error fetching property options:', error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [databaseId, attributeName, attributeType]);
  
  const handleValueToggle = (optionId: string, optionName: string) => {
    if (selectedValues.includes(optionId)) {
      removeAttributeValue(attributeId, optionId);
    } else {
      if (!isMultiSelect && attributeType !== 'status') {
        // For single select, clear other values first
        selectedValues.forEach(value => {
          removeAttributeValue(attributeId, value);
        });
      }
      addAttributeValue(attributeId, attributeName, optionId);
    }
  };

  if (attributeType !== 'select' && attributeType !== 'multi_select' && attributeType !== 'status') {
    return null;
  }

  return (
    <div className="mt-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between text-xs"
            disabled={loading}
          >
            <span>
              {loading 
                ? "Ładowanie..."
                : selectedValues.length > 0 
                  ? `${selectedValues.length} wybranych`
                  : `Wybierz ${attributeName}`
              }
            </span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-600 mb-2">
              {attributeName} ({isMultiSelect ? 'multi' : attributeType === 'status' ? 'status' : 'single'})
            </div>
            {loading ? (
              <div className="text-xs text-slate-500">Ładowanie opcji...</div>
            ) : options.length === 0 ? (
              <div className="text-xs text-slate-500">Brak opcji</div>
            ) : (
              options.map((option) => {
                const isSelected = selectedValues.includes(option.id);
                return (
                  <div
                    key={option.id}
                    className="flex items-center space-x-2 p-1 hover:bg-slate-50 rounded cursor-pointer"
                    onClick={() => handleValueToggle(option.id, option.name)}
                  >
                    {isMultiSelect ? (
                      <Checkbox checked={isSelected} />
                    ) : (
                      <div className={`w-4 h-4 rounded-full border ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300'} flex items-center justify-center`}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                    )}
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                      style={{ backgroundColor: option.color ? `var(--${option.color})` : undefined }}
                    >
                      {option.name}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
      
      {selectedValues.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {selectedValues.map(valueId => {
            const option = options.find(o => o.id === valueId);
            return option ? (
              <Badge key={valueId} variant="secondary" className="text-xs">
                {option.name}
              </Badge>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}
