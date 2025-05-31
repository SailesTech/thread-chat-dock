
import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/types/database";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

interface MessagesListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export function MessagesList({ messages, isLoading }: MessagesListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
      <div className="space-y-6 max-w-4xl mx-auto">
        {messages.map((message) => (
          <MessageBubble 
            key={message.id} 
            content={message.content}
            sender={message.sender}
            timestamp={message.created_at}
          />
        ))}
        
        {isLoading && <TypingIndicator />}
      </div>
    </ScrollArea>
  );
}
