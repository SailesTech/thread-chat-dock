
import { createContext, useContext, useState, ReactNode } from 'react';

interface AttributeValue {
  attributeId: string;
  attributeName: string;
  selectedValues: string[];
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
  addAttributeValue: (attributeId: string, attributeName: string, value: string) => void;
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

  const addAttributeValue = (attributeId: string, attributeName: string, value: string) => {
    setSelectedAttributeValues(prev => {
      const existing = prev.find(av => av.attributeId === attributeId);
      if (existing) {
        return prev.map(av => 
          av.attributeId === attributeId
            ? { ...av, selectedValues: [...av.selectedValues, value] }
            : av
        );
      } else {
        return [...prev, { attributeId, attributeName, selectedValues: [value] }];
      }
    });
  };

  const removeAttributeValue = (attributeId: string, value: string) => {
    setSelectedAttributeValues(prev => 
      prev.map(av => 
        av.attributeId === attributeId
          ? { ...av, selectedValues: av.selectedValues.filter(v => v !== value) }
          : av
      ).filter(av => av.selectedValues.length > 0)
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
