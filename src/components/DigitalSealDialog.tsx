import { useState } from "react";
import { Shield, Check, Clock, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useDigitalSeals, DigitalSeal } from "@/hooks/useDigitalSeals";

interface DigitalSealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  letterId: string;
  existingSeal?: DigitalSeal | null;
}

export function DigitalSealDialog({
  open,
  onOpenChange,
  letterId,
  existingSeal,
}: DigitalSealDialogProps) {
  const { requestSeal } = useDigitalSeals();
  const [isRequesting, setIsRequesting] = useState(false);
  const [purpose, setPurpose] = useState("");

  const handleRequest = async () => {
    if (!purpose.trim()) return;

    setIsRequesting(true);
    try {
      await requestSeal.mutateAsync({
        letterId,
        purpose: purpose.trim(),
      });
      setPurpose("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to request seal:", error);
    } finally {
      setIsRequesting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-green-600">
            <Check className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <X className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Pending Approval
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Digital Seal
          </DialogTitle>
          <DialogDescription>
            Request a professional digital seal for this letter. Verification emails will be sent to designated approvers.
          </DialogDescription>
        </DialogHeader>

        {existingSeal ? (
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              {getStatusBadge(existingSeal.status)}
            </div>

            <div className="space-y-2">
              <Label>Purpose</Label>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                {existingSeal.purpose}
              </p>
            </div>

            {existingSeal.status === "pending" && (
              <p className="text-sm text-muted-foreground">
                Waiting for approval from verification email recipients. The seal will be automatically applied once approved.
              </p>
            )}

            {existingSeal.status === "approved" && existingSeal.approved_by_email && (
              <p className="text-sm text-muted-foreground">
                Approved by {existingSeal.approved_by_email} on{" "}
                {new Date(existingSeal.approved_at!).toLocaleDateString()}
              </p>
            )}

            {existingSeal.status === "rejected" && existingSeal.rejection_reason && (
              <div className="space-y-2">
                <Label>Rejection Reason</Label>
                <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {existingSeal.rejection_reason}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="seal-purpose">Purpose of Seal</Label>
              <Textarea
                id="seal-purpose"
                placeholder="Describe why this document requires a digital seal (e.g., official engagement letter for [recipient name] for [project/role])"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                This information will be included in the verification email sent to approvers.
              </p>
            </div>

            <div className="bg-muted/50 p-3 rounded-md text-sm">
              <p className="font-medium mb-1">Verification Process:</p>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• Verification emails will be sent to designated approvers</li>
                <li>• Each approver will receive a unique approval/rejection link</li>
                <li>• The seal will be applied once approved</li>
                <li>• You will be notified of the decision via email</li>
              </ul>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {existingSeal ? "Close" : "Cancel"}
          </Button>
          {!existingSeal && (
            <Button onClick={handleRequest} disabled={!purpose.trim() || isRequesting}>
              {isRequesting ? (
                "Requesting..."
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Request Seal
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
