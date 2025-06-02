
import { useState } from "react";
import { Plus, MessageCircle, Clock, User, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChatContext } from "@/contexts/ChatContext";
import { useSupabaseChatThreads } from "@/hooks/useSupabaseChatData";
import { useNotionSelection } from "@/contexts/NotionSelectionContext";
import { ChatThread } from "@/types/database";

interface ThreadsListProps {
  searchTerm: string;
}

export function ThreadsList({ searchTerm }: ThreadsListProps) {
  const { threads, createThread, deleteThread, updateThreadTitle } = useSupabaseChatThreads();
  const { currentThreadId, setCurrentThreadId } = useChatContext();
  const { getThreadTitle } = useNotionSelection();
  
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const filteredThreads = threads.filter(thread =>
    thread.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateNewThread = async () => {
    try {
      const title = getThreadTitle();
      const thread = await createThread(title);
      if (thread) {
        setCurrentThreadId(thread.id);
      }
    } catch (error) {
      console.error('Failed to create thread:', error);
    }
  };

  const handleRenameStart = (thread: ChatThread) => {
    setIsRenaming(thread.id);
    setNewTitle(thread.title);
  };

  const handleRenameSubmit = async () => {
    if (!isRenaming || !newTitle.trim()) return;
    
    try {
      await updateThreadTitle(isRenaming, newTitle.trim());
      setIsRenaming(null);
      setNewTitle("");
    } catch (error) {
      console.error('Failed to rename thread:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!isDeleting) return;
    
    try {
      await deleteThread(isDeleting);
      if (currentThreadId === isDeleting) {
        setCurrentThreadId(null);
      }
      setIsDeleting(null);
    } catch (error) {
      console.error('Failed to delete thread:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handleCreateNewThread}
        className="w-full text-left justify-start"
        variant="outline"
      >
        <Plus className="h-4 w-4 mr-2" />
        Nowy wątek
      </Button>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {filteredThreads.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-8">
            {searchTerm ? 'Brak wątków pasujących do wyszukiwania' : 'Brak wątków'}
          </div>
        ) : (
          filteredThreads.map((thread) => (
            <Card
              key={thread.id}
              className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                currentThreadId === thread.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => setCurrentThreadId(thread.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageCircle className="h-3 w-3 text-slate-400 flex-shrink-0" />
                      <h4 className="text-sm font-medium text-slate-900 truncate">
                        {thread.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(thread.updated_at)}
                      </div>
                    </div>
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
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleRenameStart(thread);
                      }}>
                        <Pencil className="h-3 w-3 mr-2" />
                        Zmień nazwę
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsDeleting(thread.id);
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Usuń
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Rename Dialog */}
      <Dialog open={!!isRenaming} onOpenChange={() => setIsRenaming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zmień nazwę wątku</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="thread-title">Nowa nazwa</Label>
            <Input
              id="thread-title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Wprowadź nazwę wątku..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenaming(null)}>
              Anuluj
            </Button>
            <Button onClick={handleRenameSubmit}>
              Zapisz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!isDeleting} onOpenChange={() => setIsDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usuń wątek</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Czy na pewno chcesz usunąć ten wątek? Ta akcja nie może być cofnięta.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleting(null)}>
              Anuluj
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Usuń
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
