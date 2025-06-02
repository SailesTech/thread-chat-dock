
import { Eye, Filter, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotionSelection } from "@/contexts/NotionSelectionContext";

export function FilterPreview() {
  const {
    hasFilters,
    hasDataSelection,
    filteringAttributeValues,
    dataAttributes,
    getFilterSummary,
    getDataAttributesSummary,
  } = useNotionSelection();

  if (!hasFilters && !hasDataSelection) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Eye className="h-4 w-4" />
          Podgląd konfiguracji
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasFilters && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Filter className="h-3 w-3 text-blue-600" />
              <span className="text-xs font-medium text-blue-800">Filtry:</span>
              <Badge variant="secondary" className="text-xs">
                {filteringAttributeValues.length}
              </Badge>
            </div>
            <div className="text-xs text-slate-600 pl-5">
              {getFilterSummary()}
            </div>
          </div>
        )}

        {hasDataSelection && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Database className="h-3 w-3 text-green-600" />
              <span className="text-xs font-medium text-green-800">Dane do AI:</span>
              <Badge variant="secondary" className="text-xs">
                {dataAttributes.filter(attr => attr.selected).length}
              </Badge>
            </div>
            <div className="text-xs text-slate-600 pl-5">
              {getDataAttributesSummary()}
            </div>
          </div>
        )}

        <div className="pt-2 border-t">
          <div className="text-xs text-slate-500">
            💡 AI otrzyma tylko dane z przefiltrowanych stron i wybranych atrybutów
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
