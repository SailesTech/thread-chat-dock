
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChatMessage } from "@/types/database";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div
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
  );
}
