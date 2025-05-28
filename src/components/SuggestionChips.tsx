
import { Badge } from "@/components/ui/badge";

interface SuggestionChipsProps {
  onChipClick: (text: string) => void;
}

const suggestions = [
  "Pokaż wszystkie produkty",
  "Ile mamy klientów VIP?",
  "Analiza sprzedaży z tego miesiąca",
  "Produkty z niskim stanem magazynowym",
  "Top 10 najlepiej sprzedających się produktów",
  "Lista ostatnich zamówień",
];

export function SuggestionChips({ onChipClick }: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((suggestion, index) => (
        <Badge
          key={index}
          variant="outline"
          className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 text-sm py-1.5 px-3 transition-colors"
          onClick={() => onChipClick(suggestion)}
        >
          {suggestion}
        </Badge>
      ))}
    </div>
  );
}
