
import { useState } from "react";
import { MessageCircle, Search, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Thread {
  id: string;
  title: string;
  lastMessage: string;
  unreadCount: number;
  timestamp: string;
  isActive: boolean;
}

const mockThreads: Thread[] = [
  {
    id: "1",
    title: "Analiza produktów Q4",
    lastMessage: "Jak wygląda sprzedaż w kategorii elektroniki?",
    unreadCount: 2,
    timestamp: "10:30",
    isActive: true,
  },
  {
    id: "2",
    title: "Raport klientów VIP",
    lastMessage: "Pokaż mi listę najważniejszych klientów",
    unreadCount: 0,
    timestamp: "09:15",
    isActive: false,
  },
  {
    id: "3",
    title: "Statystyki zamówień",
    lastMessage: "Ile zamówień zostało złożonych dzisiaj?",
    unreadCount: 1,
    timestamp: "Wczoraj",
    isActive: false,
  },
];

export function ThreadsList() {
  const [threads, setThreads] = useState<Thread[]>(mockThreads);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredThreads = threads.filter(thread =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleThreadSelect = (threadId: string) => {
    setThreads(prev => prev.map(thread => ({
      ...thread,
      isActive: thread.id === threadId,
    })));
  };

  return (
    <div className="space-y-3">
      {/* Wyszukiwanie */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Szukaj wątków..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white border-slate-200"
        />
      </div>

      {/* Lista wątków */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredThreads.map((thread) => (
          <div
            key={thread.id}
            className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
              thread.isActive
                ? "bg-blue-50 border-blue-200 shadow-sm"
                : "bg-white border-slate-200 hover:bg-slate-50"
            }`}
            onClick={() => handleThreadSelect(thread.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <h4 className="text-sm font-medium text-slate-900 truncate">
                    {thread.title}
                  </h4>
                  {thread.unreadCount > 0 && (
                    <Badge className="bg-blue-600 text-white text-xs px-1.5 py-0.5">
                      {thread.unreadCount}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                  {thread.lastMessage}
                </p>
                <span className="text-xs text-slate-400">{thread.timestamp}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Edytuj nazwę</DropdownMenuItem>
                  <DropdownMenuItem>Udostępnij</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    Usuń wątek
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
