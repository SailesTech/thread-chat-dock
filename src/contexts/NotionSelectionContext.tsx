import { createContext, useContext, useState, ReactNode } from 'react';

interface NotionSelectionState {
  selectedDatabase: string;
  selectedPage: string;
  selectedAttributes: string[];
}

interface NotionSelectionContextType extends NotionSelectionState {
  setSelectedDatabase: (id: string) => void;
  setSelectedPage: (id: string) => void;
  setSelectedAttributes: (ids: string[]) => void;
  clearSelection: () => void;
  hasSelection: boolean;
}

const NotionSelectionContext = createContext<NotionSelectionContextType | undefined>(undefined);

export function NotionSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedDatabase, setSelectedDatabase] = useState<string>("");
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);

  const clearSelection = () => {
    setSelectedDatabase("");
    setSelectedPage("");
    setSelectedAttributes([]);
  };

  const hasSelection = selectedDatabase !== "";

  const value = {
    selectedDatabase,
    selectedPage,
    selectedAttributes,
    setSelectedDatabase,
    setSelectedPage,
    setSelectedAttributes,
    clearSelection,
    hasSelection,
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
