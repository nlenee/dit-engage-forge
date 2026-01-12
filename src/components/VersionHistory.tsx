import { useState, useEffect } from "react";
import { format } from "date-fns";
import { History, ChevronDown, ChevronUp, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { useLetters, LetterVersion } from "@/hooks/useLetters";
import { LetterFormData } from "@/types/letter";

interface VersionHistoryProps {
  letterId: string;
  onRestoreVersion: (formData: LetterFormData) => void;
}

const VersionHistory = ({ letterId, onRestoreVersion }: VersionHistoryProps) => {
  const { getLetterVersions } = useLetters();
  const [versions, setVersions] = useState<LetterVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen && letterId) {
      loadVersions();
    }
  }, [isOpen, letterId]);

  const loadVersions = async () => {
    setIsLoading(true);
    try {
      const data = await getLetterVersions(letterId);
      setVersions(data);
    } catch (error) {
      console.error("Failed to load versions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = (version: LetterVersion) => {
    const formData: LetterFormData = {
      recipientName: version.recipient_name,
      recipientEmail: version.recipient_email,
      country: version.country,
      state: version.state || "",
      office: version.office,
      dateOfAssignment: new Date(version.date_of_assignment),
      letterContent: version.letter_content,
      signatories: version.signatories,
    };
    onRestoreVersion(formData);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-4">
          <span className="flex items-center gap-2">
            <History className="h-4 w-4 text-dit-teal" />
            Version History
            {versions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {versions.length}
              </Badge>
            )}
          </span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="px-4 pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : versions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No previous versions yet. Changes will be tracked when you update this letter.
          </p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {versions.map((version) => (
              <div
                key={version.id}
                className="flex items-center justify-between p-3 bg-accent/30 rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm">Version {version.version_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(version.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                  {version.change_summary && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {version.change_summary}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(version)}
                  className="flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Restore
                </Button>
              </div>
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default VersionHistory;
