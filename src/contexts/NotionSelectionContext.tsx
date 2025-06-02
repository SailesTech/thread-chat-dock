
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { FilteringAttribute, DataAttribute, NotionFilter } from '@/types/notion';

interface NotionSelectionState {
  selectedDatabase: string;
  selectedPage: string;
  filteringAttributes: FilteringAttribute[];
  dataAttributes: DataAttribute[];
  filteringAttributeValues: NotionFilter[];
}

interface NotionSelectionContextType extends NotionSelectionState {
  setSelectedDatabase: (id: string) => void;
  setSelectedPage: (id: string) => void;
  setFilteringAttributes: (attributes: FilteringAttribute[]) => void;
  setDataAttributes: (attributes: DataAttribute[]) => void;
  setFilteringAttributeValues: (values: NotionFilter[]) => void;
  
  // Filtering attributes management
  toggleFilteringAttribute: (attributeId: string, attribute: any) => void;
  addFilteringAttributeValue: (attributeId: string, attributeName: string, valueId: string, valueName: string, attributeType?: string) => void;
  removeFilteringAttributeValue: (attributeId: string, valueId: string) => void;
  
  // Data attributes management
  toggleDataAttribute: (attributeId: string, attribute: any) => void;
  
  // Utility functions
  clearSelection: () => void;
  resetFiltersForDatabase: () => void;
  hasSelection: boolean;
  hasFilters: boolean;
  hasDataSelection: boolean;
  getThreadTitle: () => string;
  getFilterSummary: () => string;
  getDataAttributesSummary: () => string;
}

const NotionSelectionContext = createContext<NotionSelectionContextType | undefined>(undefined);

export function NotionSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedDatabase, setSelectedDatabase] = useState<string>("");
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [filteringAttributes, setFilteringAttributes] = useState<FilteringAttribute[]>([]);
  const [dataAttributes, setDataAttributes] = useState<DataAttribute[]>([]);
  const [filteringAttributeValues, setFilteringAttributeValues] = useState<NotionFilter[]>([]);

  // Reset filters when database changes
  useEffect(() => {
    if (selectedDatabase) {
      console.log('Database changed, resetting filters and attributes');
      resetFiltersForDatabase();
    }
  }, [selectedDatabase]);

  const resetFiltersForDatabase = () => {
    setFilteringAttributes([]);
    setDataAttributes([]);
    setFilteringAttributeValues([]);
    setSelectedPage("");
  };

  const toggleFilteringAttribute = (attributeId: string, attribute: any) => {
    setFilteringAttributes(prev => {
      const exists = prev.find(attr => attr.id === attributeId);
      if (exists) {
        // Remove the attribute and its values
        setFilteringAttributeValues(current => 
          current.filter(filter => filter.attributeId !== attributeId)
        );
        return prev.filter(attr => attr.id !== attributeId);
      } else {
        // Add the attribute
        return [...prev, {
          id: attributeId,
          name: attribute.name,
          type: attribute.type,
          values: []
        }];
      }
    });
  };

  const addFilteringAttributeValue = (attributeId: string, attributeName: string, valueId: string, valueName: string, attributeType?: string) => {
    console.log(`Adding filter value: ${valueName} (${valueId}) for ${attributeName} (${attributeType})`);
    
    setFilteringAttributeValues(prev => {
      const existing = prev.find(filter => filter.attributeId === attributeId);
      
      if (existing) {
        return prev.map(filter => 
          filter.attributeId === attributeId
            ? { 
                ...filter, 
                selectedValues: [...filter.selectedValues, valueId],
                selectedNames: [...filter.selectedNames, valueName],
                attributeType: attributeType || filter.attributeType
              }
            : filter
        );
      } else {
        return [...prev, { 
          attributeId, 
          attributeName, 
          selectedValues: [valueId],
          selectedNames: [valueName],
          attributeType: attributeType
        }];
      }
    });
  };

  const removeFilteringAttributeValue = (attributeId: string, valueId: string) => {
    setFilteringAttributeValues(prev => 
      prev.map(filter => {
        if (filter.attributeId === attributeId) {
          const valueIndex = filter.selectedValues.indexOf(valueId);
          return {
            ...filter,
            selectedValues: filter.selectedValues.filter(v => v !== valueId),
            selectedNames: filter.selectedNames.filter((_, index) => index !== valueIndex)
          };
        }
        return filter;
      }).filter(filter => filter.selectedValues.length > 0)
    );
  };

  const toggleDataAttribute = (attributeId: string, attribute: any) => {
    setDataAttributes(prev => {
      const exists = prev.find(attr => attr.id === attributeId);
      if (exists) {
        return prev.map(attr => 
          attr.id === attributeId 
            ? { ...attr, selected: !attr.selected }
            : attr
        );
      } else {
        return [...prev, {
          id: attributeId,
          name: attribute.name,
          type: attribute.type,
          selected: true
        }];
      }
    });
  };

  const clearSelection = () => {
    setSelectedDatabase("");
    setSelectedPage("");
    setFilteringAttributes([]);
    setDataAttributes([]);
    setFilteringAttributeValues([]);
  };

  const getThreadTitle = () => {
    const parts = [];
    
    if (selectedDatabase) {
      parts.push(`DB`);
    }
    
    if (hasFilters) {
      parts.push(`${filteringAttributeValues.length} filters`);
    }
    
    if (hasDataSelection) {
      const selectedCount = dataAttributes.filter(attr => attr.selected).length;
      parts.push(`${selectedCount} data attrs`);
    }
    
    return parts.length > 0 ? parts.join(' | ') : 'Nowy czat';
  };

  const getFilterSummary = () => {
    if (filteringAttributeValues.length === 0) return 'Brak filtrów';
    
    return filteringAttributeValues
      .map(filter => `${filter.attributeName}: ${filter.selectedNames.join(', ')}`)
      .join('; ');
  };

  const getDataAttributesSummary = () => {
    const selected = dataAttributes.filter(attr => attr.selected);
    if (selected.length === 0) return 'Wszystkie atrybuty';
    
    return selected.map(attr => attr.name).join(', ');
  };

  const hasSelection = selectedDatabase !== "";
  const hasFilters = filteringAttributeValues.length > 0;
  const hasDataSelection = dataAttributes.some(attr => attr.selected);

  const value = {
    selectedDatabase,
    selectedPage,
    filteringAttributes,
    dataAttributes,
    filteringAttributeValues,
    setSelectedDatabase,
    setSelectedPage,
    setFilteringAttributes,
    setDataAttributes,
    setFilteringAttributeValues,
    toggleFilteringAttribute,
    addFilteringAttributeValue,
    removeFilteringAttributeValue,
    toggleDataAttribute,
    clearSelection,
    resetFiltersForDatabase,
    hasSelection,
    hasFilters,
    hasDataSelection,
    getThreadTitle,
    getFilterSummary,
    getDataAttributesSummary,
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
