import { useState, useEffect } from "react";
import { Plus, Trash2, User, MapPin, Briefcase, Calendar, FileText, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AIEnhanceButton from "@/components/AIEnhanceButton";
import SignatureSelector from "@/components/SignatureSelector";
import { LetterFormData, Signatory, defaultLetterContent } from "@/types/letter";
import { getAllCountries, getStatesByCountry } from "@/data/countries";
import { getStoredOffices, saveOffice } from "@/data/offices";

interface LetterFormProps {
  data: LetterFormData;
  onChange: (data: LetterFormData) => void;
}

const LetterForm = ({ data, onChange }: LetterFormProps) => {
  const [countries] = useState(getAllCountries());
  const [states, setStates] = useState<{ value: string; label: string }[]>([]);
  const [offices, setOffices] = useState<string[]>(getStoredOffices());
  const [showNewOffice, setShowNewOffice] = useState(false);
  const [newOffice, setNewOffice] = useState("");

  useEffect(() => {
    if (data.country) {
      setStates(getStatesByCountry(data.country));
    }
  }, [data.country]);

  const handleChange = (field: keyof LetterFormData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleAddSignatory = () => {
    const newSignatory: Signatory = {
      id: crypto.randomUUID(),
      name: "",
      title: "",
    };
    handleChange("signatories", [...data.signatories, newSignatory]);
  };

  const handleRemoveSignatory = (id: string) => {
    handleChange(
      "signatories",
      data.signatories.filter((s) => s.id !== id)
    );
  };

  const handleSignatoryChange = (id: string, field: keyof Signatory, value: string) => {
    handleChange(
      "signatories",
      data.signatories.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      )
    );
  };

  const handleSignatureUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleSignatoryChange(id, "signatureImage", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddNewOffice = () => {
    if (newOffice.trim()) {
      saveOffice(newOffice.trim());
      setOffices(getStoredOffices());
      handleChange("office", newOffice.trim());
      setNewOffice("");
      setShowNewOffice(false);
    }
  };

  const handleEnhancedContent = (enhancedText: string) => {
    handleChange("letterContent", enhancedText);
  };

  return (
    <div className="space-y-6">
      {/* Recipient Information */}
      <div className="form-section animate-fade-in">
        <h3 className="form-section-title">
          <User className="h-5 w-5 text-dit-teal" />
          Recipient Information
        </h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="recipientName">Full Name *</Label>
            <Input
              id="recipientName"
              placeholder="Enter recipient's full name"
              value={data.recipientName}
              onChange={(e) => handleChange("recipientName", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="recipientEmail">Email Address *</Label>
            <Input
              id="recipientEmail"
              type="email"
              placeholder="Enter email address"
              value={data.recipientEmail}
              onChange={(e) => handleChange("recipientEmail", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="form-section animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <h3 className="form-section-title">
          <MapPin className="h-5 w-5 text-dit-teal" />
          Location
        </h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <Select
              value={data.country}
              onValueChange={(value) => {
                handleChange("country", value);
                handleChange("state", "");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {countries.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="state">State/Province</Label>
            <Select
              value={data.state}
              onValueChange={(value) => handleChange("state", value)}
              disabled={!data.country || states.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={states.length === 0 ? "No states available" : "Select state"} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {states.map((state) => (
                  <SelectItem key={state.value} value={state.value}>
                    {state.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Engagement Details */}
      <div className="form-section animate-fade-in" style={{ animationDelay: "0.2s" }}>
        <h3 className="form-section-title">
          <Briefcase className="h-5 w-5 text-dit-teal" />
          Engagement Details
        </h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="office">Office / Position *</Label>
            {!showNewOffice ? (
              <div className="flex gap-2">
                <Select
                  value={data.office}
                  onValueChange={(value) => handleChange("office", value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {offices.map((office) => (
                      <SelectItem key={office} value={office}>
                        {office}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowNewOffice(true)}
                  title="Add new office"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter new office/position"
                  value={newOffice}
                  onChange={(e) => setNewOffice(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddNewOffice()}
                />
                <Button type="button" onClick={handleAddNewOffice}>
                  Add
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowNewOffice(false);
                    setNewOffice("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dateOfAssignment">Date of Assignment *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="dateOfAssignment"
                type="date"
                className="pl-10"
                value={data.dateOfAssignment.toISOString().split("T")[0]}
                onChange={(e) => handleChange("dateOfAssignment", new Date(e.target.value))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Letter Content */}
      <div className="form-section animate-fade-in" style={{ animationDelay: "0.3s" }}>
        <h3 className="form-section-title">
          <FileText className="h-5 w-5 text-dit-teal" />
          Letter Content
        </h3>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="letterContent">Body of Letter</Label>
            <AIEnhanceButton
              text={data.letterContent}
              onEnhance={handleEnhancedContent}
            />
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Use [POSITION] as a placeholder for the office/position. It will be automatically replaced.
          </p>
          <Textarea
            id="letterContent"
            placeholder="Enter the letter content..."
            value={data.letterContent}
            onChange={(e) => handleChange("letterContent", e.target.value)}
            rows={12}
            className="font-sans text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleChange("letterContent", defaultLetterContent)}
            className="mt-2"
          >
            Reset to Default Template
          </Button>
        </div>
      </div>

      {/* Signatories */}
      <div className="form-section animate-fade-in" style={{ animationDelay: "0.4s" }}>
        <h3 className="form-section-title">
          <PenTool className="h-5 w-5 text-dit-teal" />
          Signatories
        </h3>
        
        <div className="space-y-4">
          {data.signatories.map((signatory, index) => (
            <div
              key={signatory.id}
              className="p-4 border border-border rounded-lg bg-accent/30 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Signatory {index + 1}
                </span>
                {data.signatories.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSignatory(signatory.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    placeholder="Enter signatory name"
                    value={signatory.name}
                    onChange={(e) =>
                      handleSignatoryChange(signatory.id, "name", e.target.value)
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Title/Office *</Label>
                  <Input
                    placeholder="e.g., CED, DIT."
                    value={signatory.title}
                    onChange={(e) =>
                      handleSignatoryChange(signatory.id, "title", e.target.value)
                    }
                  />
                </div>
              </div>
              
              <SignatureSelector
                signatory={signatory}
                onSelect={(url) => handleSignatoryChange(signatory.id, "signatureImage", url)}
                onUpload={(e) => handleSignatureUpload(signatory.id, e)}
              />
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={handleAddSignatory}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Signatory
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LetterForm;
