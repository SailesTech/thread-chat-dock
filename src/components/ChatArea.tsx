
import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotionAttributes } from "@/hooks/useNotionData";
import { useSupabaseChatMessages } from "@/hooks/useSupabaseChatData";
import { useChatContext } from "@/contexts/ChatContext";

export function ChatArea() {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attributeSearch, setAttributeSearch] = useState("");
  const [selectedDatabase] = useState<string>(""); // This would come from context/props in real app
  const [isAttributePopoverOpen, setIsAttributePopoverOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { currentThreadId } = useChatContext();
  const { messages, sendMessage } = useSupabaseChatMessages(currentThreadId);
  const { attributes, loading: attributesLoading } = useNotionAttributes(selectedDatabase || null);

  const filteredAttributes = attributes.filter(attr =>
    attr.name.toLowerCase().includes(attributeSearch.toLowerCase())
  );

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentThreadId) return;

    const messageContent = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      // Send user message
      await sendMessage(messageContent, 'user');

      // Simulate bot response (in a real app, this would be an API call)
      setTimeout(async () => {
        try {
          await sendMessage(
            "Pracuję nad Twoim zapytaniem... (Tutaj będzie odpowiedź z API)", 
            'bot'
          );
        } catch (error) {
          console.error('Failed to send bot message:', error);
        } finally {
          setIsLoading(false);
        }
      }, 1500);
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAttributeSelect = (attributeName: string) => {
    setInputValue(prev => prev + ` ${attributeName}`);
    setAttributeSearch("");
    setIsAttributePopoverOpen(false);
  };

  if (!currentThreadId) {
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

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-slate-50">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
        <div className="space-y-6 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.sender === "bot" && (
                <Avatar className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500">
                  <AvatarFallback className="text-white text-sm">AI</AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  message.sender === "user"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    : "bg-white border border-slate-200 text-slate-900 shadow-sm"
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
                <div
                  className={`text-xs mt-2 ${
                    message.sender === "user" ? "text-blue-100" : "text-slate-500"
                  }`}
                >
                  {new Date(message.created_at).toLocaleTimeString("pl-PL", { 
                    hour: "2-digit", 
                    minute: "2-digit" 
                  })}
                </div>
              </div>

              {message.sender === "user" && (
                <Avatar className="w-8 h-8 bg-gradient-to-r from-slate-600 to-slate-700">
                  <AvatarFallback className="text-white text-sm">TY</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-4">
              <Avatar className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500">
                <AvatarFallback className="text-white text-sm">AI</AvatarFallback>
              </Avatar>
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-white/80 backdrop-blur-sm p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-4 items-end">
            <div className="flex-1 relative">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Wpisz swoje pytanie o dane z Notion..."
                className="min-h-[120px] max-h-48 resize-none pr-24 text-lg bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                disabled={isLoading}
              />
              
              {/* Attribute Search Popover */}
              <Popover open={isAttributePopoverOpen} onOpenChange={setIsAttributePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-12 bottom-3 h-10 w-10 p-0 text-slate-400 hover:text-slate-600"
                    title="Wyszukaj atrybuty"
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end" side="top">
                  <div className="p-3 border-b">
                    <Input
                      placeholder="Szukaj atrybutów..."
                      value={attributeSearch}
                      onChange={(e) => setAttributeSearch(e.target.value)}
                      className="bg-white border-slate-200"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {attributesLoading ? (
                      <div className="p-3 text-sm text-slate-500">Ładowanie atrybutów...</div>
                    ) : filteredAttributes.length > 0 ? (
                      <div className="p-2">
                        {filteredAttributes.map((attr) => (
                          <button
                            key={attr.id}
                            onClick={() => handleAttributeSelect(attr.name)}
                            className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded text-left"
                          >
                            <span className="text-sm font-medium">{attr.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {attr.type}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-sm text-slate-500">
                        {selectedDatabase ? "Brak atrybutów" : "Wybierz bazę danych w sidebarze"}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 bottom-3 h-10 w-10 p-0 text-slate-400 hover:text-slate-600"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading || !currentThreadId}
              className="h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl"
            >
              <Send className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
