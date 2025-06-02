
export interface FilteringAttribute {
  id: string;
  name: string;
  type: string;
  values: FilteringAttributeValue[];
}

export interface FilteringAttributeValue {
  id: string;
  name: string;
  selected: boolean;
}

export interface DataAttribute {
  id: string;
  name: string;
  type: string;
  selected: boolean;
}

export interface NotionFilter {
  attributeId: string;
  attributeName: string;
  selectedValues: string[];
  selectedNames: string[];
  attributeType?: string;
}

export interface FilteredPage {
  id: string;
  title: string;
  properties: Record<string, any>;
}

export interface QueryWithFiltersRequest {
  databaseId: string;
  filters: NotionFilter[];
  dataAttributes: string[];
  pageSize?: number;
}

export interface QueryWithFiltersResponse {
  pages: FilteredPage[];
  totalCount: number;
  hasMore: boolean;
}
