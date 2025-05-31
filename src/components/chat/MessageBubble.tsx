
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface MessageBubbleProps {
  content: string;
  sender: "user" | "bot";
  timestamp: string;
}

export function MessageBubble({ content, sender, timestamp }: MessageBubbleProps) {
  const isBot = sender === "bot";

  return (
    <div className={cn("flex w-full", isBot ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-3 text-sm",
          isBot
            ? "bg-white border border-slate-200 text-slate-800"
            : "bg-blue-600 text-white"
        )}
      >
        {isBot ? (
          <MarkdownRenderer content={content} />
        ) : (
          <p className="whitespace-pre-wrap">{content}</p>
        )}
        <div
          className={cn(
            "mt-2 text-xs opacity-70",
            isBot ? "text-slate-500" : "text-blue-100"
          )}
        >
          {new Date(timestamp).toLocaleTimeString("pl-PL", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
