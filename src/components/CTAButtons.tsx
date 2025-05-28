
import { Button } from "@/components/ui/button";
import { Filter, Plus, RotateCcw, Download } from "lucide-react";

export function CTAButtons() {
  const handleInsertAttribute = () => {
    console.log("Insert attribute clicked - API placeholder");
  };

  const handleNewThread = () => {
    console.log("New thread clicked - API placeholder");
  };

  const handleClearFilters = () => {
    console.log("Clear filters clicked - API placeholder");
  };

  const handleExportData = () => {
    console.log("Export data clicked - API placeholder");
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleInsertAttribute}
        className="text-blue-600 border-blue-200 hover:bg-blue-50"
      >
        <Filter className="h-4 w-4 mr-2" />
        Wstaw atrybut
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleNewThread}
        className="text-green-600 border-green-200 hover:bg-green-50"
      >
        <Plus className="h-4 w-4 mr-2" />
        Nowy wątek
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleClearFilters}
        className="text-orange-600 border-orange-200 hover:bg-orange-50"
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Wyczyść filtry
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportData}
        className="text-purple-600 border-purple-200 hover:bg-purple-50"
      >
        <Download className="h-4 w-4 mr-2" />
        Eksportuj dane
      </Button>
    </div>
  );
}
