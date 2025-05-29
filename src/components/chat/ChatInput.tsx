
import { useState } from "react";
import { Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AttributeSearchPopover } from "./AttributeSearchPopover";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

export function ChatInput({ onSendMessage, isLoading, disabled }: ChatInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [selectedDatabase] = useState<string>(""); // This would come from context/props in real app

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue);
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAttributeSelect = (attributeName: string) => {
    setInputValue(prev => prev + ` ${attributeName}`);
  };

  return (
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
              disabled={isLoading || disabled}
            />
            
            <AttributeSearchPopover
              selectedDatabase={selectedDatabase}
              onAttributeSelect={handleAttributeSelect}
            />

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
            disabled={!inputValue.trim() || isLoading || disabled}
            className="h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl"
          >
            <Send className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
