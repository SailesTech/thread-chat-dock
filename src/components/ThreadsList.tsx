
import { useState } from "react";
import { MessageCircle, Search, MoreVertical, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSupabaseChatThreads } from "@/hooks/useSupabaseChatData";
import { useChatContext } from "@/contexts/ChatContext";

export function ThreadsList() {
  const [searchQuery, setSearchQuery] = useState("");
  const { currentThreadId, setCurrentThreadId } = useChatContext();
  const { threads, loading, createThread, deleteThread, updateThreadTitle } = useSupabaseChatThreads();

  const filteredThreads = threads.filter(thread =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleThreadSelect = (threadId: string) => {
    setCurrentThreadId(threadId);
  };

  const handleCreateThread = async () => {
    try {
      const newThread = await createThread("Nowy wątek");
      setCurrentThreadId(newThread.id);
    } catch (error) {
      console.error('Failed to create thread:', error);
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    try {
      await deleteThread(threadId);
      if (currentThreadId === threadId) {
        setCurrentThreadId(null);
      }
    } catch (error) {
      console.error('Failed to delete thread:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="p-4 text-center text-slate-500">
          Ładowanie wątków...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Wyszukiwanie i dodawanie */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Szukaj wątków..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-slate-200"
          />
        </div>
        <Button 
          onClick={handleCreateThread}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nowy wątek
        </Button>
      </div>

      {/* Lista wątków */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredThreads.length === 0 ? (
          <div className="p-4 text-center text-slate-500">
            {searchQuery ? "Brak wątków pasujących do wyszukiwania" : "Brak wątków. Utwórz pierwszy!"}
          </div>
        ) : (
          filteredThreads.map((thread) => (
            <div
              key={thread.id}
              className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                currentThreadId === thread.id
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
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(thread.updated_at).toLocaleDateString("pl-PL", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        const newTitle = prompt("Nowa nazwa wątku:", thread.title);
                        if (newTitle && newTitle !== thread.title) {
                          updateThreadTitle(thread.id, newTitle);
                        }
                      }}
                    >
                      Edytuj nazwę
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Czy na pewno chcesz usunąć ten wątek?")) {
                          handleDeleteThread(thread.id);
                        }
                      }}
                    >
                      Usuń wątek
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
