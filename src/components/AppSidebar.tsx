
import { useState } from "react";
import { Filter, MessageCircle, Search, AlertCircle } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThreadsList } from "@/components/ThreadsList";
import { DatabaseSelector } from "@/components/sidebar/DatabaseSelector";
import { PageSelector } from "@/components/sidebar/PageSelector";
import { AttributeValueSelector } from "@/components/sidebar/AttributeValueSelector";
import { useNotionAttributes } from "@/hooks/useNotionData";
import { useNotionSelection } from "@/contexts/NotionSelectionContext";

export function AppSidebar() {
  const { state } = useSidebar();
  
  const {
    selectedDatabase,
    selectedAttributes,
    selectedAttributeValues,
    setSelectedAttributes,
  } = useNotionSelection();

  const [attributeSearch, setAttributeSearch] = useState("");

  const { attributes, loading: attributesLoading, error: attributesError } = useNotionAttributes(selectedDatabase || null);

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

  // Pobierz rzeczywiste opcje z API dla atrybutów select
  const getAttributeOptions = async (attribute: any) => {
    if (!selectedDatabase || (attribute.type !== 'select' && attribute.type !== 'multi_select')) {
      return [];
    }

    try {
      // Pobierz szczegóły bazy danych z Notion API
      const response = await fetch(`https://api.notion.com/v1/databases/${selectedDatabase}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const property = data.properties[attribute.name];
        
        if (property && (property.type === 'select' || property.type === 'multi_select')) {
          return property[property.type].options.map((option: any) => ({
            id: option.id,
            name: option.name,
            color: option.color,
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching attribute options:', error);
    }

    return [];
  };

  const isCollapsed = state === "collapsed";

  if (isCollapsed) {
    return (
      <Sidebar className="w-14">
        <SidebarContent className="flex flex-col items-center gap-4 pt-4">
          <Filter className="h-6 w-6 text-slate-400" />
          <MessageCircle className="h-6 w-6 text-slate-400" />
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar className="w-80 border-r bg-white/50 backdrop-blur-sm">
      <SidebarContent className="p-4 space-y-6">
        {/* Wybór bazy danych */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-semibold text-slate-700">
            Baza danych
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <DatabaseSelector />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Wybór strony */}
        {selectedDatabase && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sm font-semibold text-slate-700">
              Strona
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <PageSelector />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Atrybuty */}
        {selectedDatabase && (
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
                      <div key={attr.id} className="space-y-2">
                        <div className="flex items-center space-x-2">
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
                        
                        {/* Selector wartości atrybutu */}
                        {selectedAttributes.includes(attr.id) && 
                         (attr.type === 'select' || attr.type === 'multi_select') && (
                          <AttributeValueSelector
                            attributeId={attr.id}
                            attributeName={attr.name}
                            attributeType={attr.type}
                            options={[]} // Będzie pobrane asynchronicznie
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Podsumowanie wyboru */}
        {selectedAttributeValues.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sm font-semibold text-slate-700">
              Wybrane wartości
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-2">
                {selectedAttributeValues.map((av) => (
                  <div key={av.attributeId} className="p-2 bg-blue-50 rounded">
                    <div className="text-xs font-medium text-blue-800">{av.attributeName}</div>
                    <div className="text-xs text-blue-600">
                      {av.selectedValues.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

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
