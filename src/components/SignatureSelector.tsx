import { useState } from "react";
import { Upload, Save, Trash2, Check, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useSignatures, SavedSignature } from "@/hooks/useSignatures";
import { Signatory } from "@/types/letter";

interface SignatureSelectorProps {
  signatory: Signatory;
  onSelect: (signatureUrl: string) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SignatureSelector = ({
  signatory,
  onSelect,
  onUpload,
}: SignatureSelectorProps) => {
  const { signatures, uploadSignature, saveSignature, deleteSignature } = useSignatures();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveSignature = async () => {
    if (!signatory.signatureImage || !signatory.name || !signatory.title) return;

    setSaving(true);
    try {
      // If it's a base64 image, we need to convert it to a file and upload
      if (signatory.signatureImage.startsWith("data:")) {
        const response = await fetch(signatory.signatureImage);
        const blob = await response.blob();
        const file = new File([blob], `signature-${Date.now()}.png`, { type: "image/png" });
        const url = await uploadSignature(file);
        await saveSignature.mutateAsync({
          name: signatory.name,
          title: signatory.title,
          signatureUrl: url,
        });
      } else {
        await saveSignature.mutateAsync({
          name: signatory.name,
          title: signatory.title,
          signatureUrl: signatory.signatureImage,
        });
      }
      setSaveDialogOpen(false);
    } catch (error) {
      console.error("Error saving signature:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(e);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Signature</Label>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Image className="h-4 w-4" />
              {signatory.signatureImage ? "Change" : "Select Signature"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <label className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm">
              <Upload className="h-4 w-4" />
              Upload new signature
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            
            {signatures.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
                  Saved Signatures
                </div>
                {signatures.map((sig: SavedSignature) => (
                  <DropdownMenuItem
                    key={sig.id}
                    className="flex items-center justify-between gap-2"
                    onClick={() => onSelect(sig.signature_url)}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={sig.signature_url}
                        alt={sig.name}
                        className="h-6 w-12 object-contain bg-white rounded border"
                      />
                      <div className="text-xs">
                        <div className="font-medium truncate max-w-[120px]">{sig.name}</div>
                        <div className="text-muted-foreground truncate max-w-[120px]">{sig.title}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSignature.mutate(sig.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {signatory.signatureImage && (
          <>
            <div className="h-10 border border-border rounded-md p-1 bg-white">
              <img
                src={signatory.signatureImage}
                alt="Signature preview"
                className="h-full w-auto object-contain"
              />
            </div>
            
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Save className="h-4 w-4" />
                  Save for Reuse
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Signature</DialogTitle>
                  <DialogDescription>
                    Save this signature for reuse in future letters. Make sure the name and title are filled in.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="flex justify-center">
                    <div className="h-16 border border-border rounded-md p-2 bg-white">
                      <img
                        src={signatory.signatureImage}
                        alt="Signature preview"
                        className="h-full w-auto object-contain"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={signatory.name} disabled />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={signatory.title} disabled />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveSignature} 
                    disabled={saving || !signatory.name || !signatory.title}
                  >
                    {saving ? "Saving..." : "Save Signature"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
};

export default SignatureSelector;
