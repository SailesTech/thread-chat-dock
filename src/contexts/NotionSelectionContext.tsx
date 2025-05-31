import { createContext, useContext, useState, ReactNode } from 'react';

interface AttributeValue {
  attributeId: string;
  attributeName: string;
  selectedValues: string[];        // ✅ IDs dla n8n query
  selectedNames?: string[];        // ✅ Nazwy dla AI/display
}

interface NotionSelectionState {
  selectedDatabase: string;
  selectedPage: string;
  selectedAttributes: string[];
  selectedAttributeValues: AttributeValue[];
}

interface NotionSelectionContextType extends NotionSelectionState {
  setSelectedDatabase: (id: string) => void;
  setSelectedPage: (id: string) => void;
  setSelectedAttributes: (ids: string[]) => void;
  setSelectedAttributeValues: (values: AttributeValue[]) => void;
  addAttributeValue: (attributeId: string, attributeName: string, valueId: string, valueName?: string) => void; // ✅ Dodano valueName
  removeAttributeValue: (attributeId: string, value: string) => void;
  clearSelection: () => void;
  hasSelection: boolean;
  getThreadTitle: () => string;
}

const NotionSelectionContext = createContext<NotionSelectionContextType | undefined>(undefined);

export function NotionSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedDatabase, setSelectedDatabase] = useState<string>("");
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [selectedAttributeValues, setSelectedAttributeValues] = useState<AttributeValue[]>([]);

  // ✅ Nowa funkcja przyjmująca ID i nazwę
  const addAttributeValue = (attributeId: string, attributeName: string, valueId: string, valueName?: string) => {
    setSelectedAttributeValues(prev => {
      const existing = prev.find(av => av.attributeId === attributeId);
      
      if (existing) {
        // Aktualizuj istniejący atrybut
        return prev.map(av => 
          av.attributeId === attributeId
            ? { 
                ...av, 
                selectedValues: [...av.selectedValues, valueId],                    // ✅ Dodaj ID
                selectedNames: [...(av.selectedNames || []), valueName || valueId]  // ✅ Dodaj nazwę
              }
            : av
        );
      } else {
        // Dodaj nowy atrybut
        return [...prev, { 
          attributeId, 
          attributeName, 
          selectedValues: [valueId],                    // ✅ ID dla n8n
          selectedNames: [valueName || valueId]        // ✅ Nazwa dla AI
        }];
      }
    });
  };

  const removeAttributeValue = (attributeId: string, valueId: string) => {
    setSelectedAttributeValues(prev => 
      prev.map(av => {
        if (av.attributeId === attributeId) {
          const valueIndex = av.selectedValues.indexOf(valueId);
          return {
            ...av,
            selectedValues: av.selectedValues.filter(v => v !== valueId),
            selectedNames: av.selectedNames 
              ? av.selectedNames.filter((_, index) => index !== valueIndex)
              : av.selectedNames
          };
        }
        return av;
      }).filter(av => av.selectedValues.length > 0)
    );
  };

  const clearSelection = () => {
    setSelectedDatabase("");
    setSelectedPage("");
    setSelectedAttributes([]);
    setSelectedAttributeValues([]);
  };

  const getThreadTitle = () => {
    const parts = [];
    
    if (selectedDatabase) {
      parts.push(`DB`);
    }
    
    if (selectedPage) {
      parts.push(`Page`);
    }
    
    if (selectedAttributeValues.length > 0) {
      const attrSummary = selectedAttributeValues
        .map(av => `${av.attributeName}(${av.selectedValues.length})`)
        .join(', ');
      parts.push(attrSummary);
    }
    
    return parts.length > 0 ? parts.join(' | ') : 'Nowy czat';
  };

  const hasSelection = selectedDatabase !== "";

  const value = {
    selectedDatabase,
    selectedPage,
    selectedAttributes,
    selectedAttributeValues,
    setSelectedDatabase,
    setSelectedPage,
    setSelectedAttributes,
    setSelectedAttributeValues,
    addAttributeValue,
    removeAttributeValue,
    clearSelection,
    hasSelection,
    getThreadTitle,
  };

  return (
    <NotionSelectionContext.Provider value={value}>
      {children}
    </NotionSelectionContext.Provider>
  );
}

export function useNotionSelection() {
  const context = useContext(NotionSelectionContext);
  if (context === undefined) {
    throw new Error('useNotionSelection must be used within a NotionSelectionProvider');
  }
  return context;
}
