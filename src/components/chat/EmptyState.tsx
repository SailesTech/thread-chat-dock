
export function EmptyState() {
  return (
    <div className="flex items-center justify-center h-full bg-gradient-to-b from-white to-slate-50">
      <div className="text-center p-8">
        <h2 className="text-2xl font-semibold text-slate-700 mb-4">
          Wybierz wątek aby rozpocząć rozmowę
        </h2>
        <p className="text-slate-500">
          Utwórz nowy wątek lub wybierz istniejący z listy po lewej stronie
        </p>
      </div>
    </div>
  );
}
