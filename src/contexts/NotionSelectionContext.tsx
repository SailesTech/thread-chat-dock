import { createContext, useContext, useState, ReactNode } from 'react';

interface AttributeValue {
  id: string;
  name: string;
  color?: string;
}

interface SelectedAttribute {
  id: string;
  name: string;
  type: string;
  database_id: string;
  availableOptions?: AttributeValue[]; // Dostępne opcje (select/multi_select)
  selectedValues?: string[]; // Wybrane wartości przez użytkownika
}

interface NotionSelectionState {
  selectedDatabase: string;
  selectedPage: string;
  selectedAttributes: SelectedAttribute[]; // ✅ Zmieniony typ z string[] na SelectedAttribute[]
}

interface NotionSelectionContextType extends NotionSelectionState {
  setSelectedDatabase: (id: string) => void;
  setSelectedPage: (id: string) => void;
  setSelectedAttributes: (attributes: SelectedAttribute[]) => void;
  
  // ✅ Nowe funkcje do zarządzania wartościami atrybutów
  addAttributeWithValues: (attribute: SelectedAttribute) => void;
  updateAttributeValues: (attributeId: string, selectedValues: string[]) => void;
  removeAttribute: (attributeId: string) => void;
  
  clearSelection: () => void;
  hasSelection: boolean;
  hasAttributesWithValues: boolean;
}

const NotionSelectionContext = createContext<NotionSelectionContextType | undefined>(undefined);

export function NotionSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedDatabase, setSelectedDatabase] = useState<string>("");
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [selectedAttributes, setSelectedAttributes] = useState<SelectedAttribute[]>([]);

  const addAttributeWithValues = (attribute: SelectedAttribute) => {
    setSelectedAttributes(prev => {
      // Usuń jeśli już istnieje, dodaj nowy
      const filtered = prev.filter(attr => attr.id !== attribute.id);
      return [...filtered, attribute];
    });
  };

  const updateAttributeValues = (attributeId: string, selectedValues: string[]) => {
    setSelectedAttributes(prev => 
      prev.map(attr => 
        attr.id === attributeId 
          ? { ...attr, selectedValues }
          : attr
      )
    );
  };

  const removeAttribute = (attributeId: string) => {
    setSelectedAttributes(prev => prev.filter(attr => attr.id !== attributeId));
  };

  const clearSelection = () => {
    setSelectedDatabase("");
    setSelectedPage("");
    setSelectedAttributes([]);
  };

  const hasSelection = selectedDatabase !== "";
  const hasAttributesWithValues = selectedAttributes.some(attr => 
    attr.selectedValues && attr.selectedValues.length > 0
  );

  const value = {
    selectedDatabase,
    selectedPage,
    selectedAttributes,
    setSelectedDatabase,
    setSelectedPage,
    setSelectedAttributes,
    addAttributeWithValues,
    updateAttributeValues,
    removeAttribute,
    clearSelection,
    hasSelection,
    hasAttributesWithValues,
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

// ✅ Export types for use in other components
export type { SelectedAttribute, AttributeValue };
