import { useState } from "react";
import { Sparkles, Wand2, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AIEnhanceButtonProps {
  text: string;
  onEnhance: (enhancedText: string) => void;
}

const AIEnhanceButton = ({ text, onEnhance }: AIEnhanceButtonProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<string | null>(null);

  const enhanceText = async (type: "enhance" | "proofread" | "formal") => {
    if (!text.trim()) {
      toast({
        title: "No content",
        description: "Please add some letter content first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setLoadingType(type);

    try {
      const { data, error } = await supabase.functions.invoke("enhance-text", {
        body: { text, type },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      onEnhance(data.enhancedText);
      
      toast({
        title: "Text enhanced!",
        description: `Your letter content has been ${type === "enhance" ? "enhanced" : type === "proofread" ? "proofread" : "formalized"}.`,
      });
    } catch (error: any) {
      toast({
        title: "Enhancement failed",
        description: error.message || "Failed to enhance text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="flex items-center gap-2 border-dit-teal/30 text-dit-teal hover:bg-dit-teal/10"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isLoading ? "Enhancing..." : "AI Enhance"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onClick={() => enhanceText("enhance")}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Wand2 className="h-4 w-4" />
          <div>
            <p className="font-medium">Enhance Clarity</p>
            <p className="text-xs text-muted-foreground">Improve readability & professionalism</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => enhanceText("proofread")}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          <div>
            <p className="font-medium">Proofread</p>
            <p className="text-xs text-muted-foreground">Fix grammar & spelling</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => enhanceText("formal")}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          <div>
            <p className="font-medium">Make Formal</p>
            <p className="text-xs text-muted-foreground">More formal business tone</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AIEnhanceButton;
