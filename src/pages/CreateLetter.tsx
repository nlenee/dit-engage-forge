import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Download, Eye, EyeOff, Mail, Save, Sparkles, Clock, Users, Shield, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import LetterForm from "@/components/LetterForm";
import LetterPreview from "@/components/LetterPreview";
import TemplateSelector from "@/components/TemplateSelector";
import EmailDialog from "@/components/EmailDialog";
import VersionHistory from "@/components/VersionHistory";
import { ScheduleEmailDialog } from "@/components/ScheduleEmailDialog";
import { BulkEmailDialog } from "@/components/BulkEmailDialog";
import { DigitalSealDialog } from "@/components/DigitalSealDialog";
import { LetterFormData, defaultLetterContent, Signatory } from "@/types/letter";
import { useToast } from "@/hooks/use-toast";
import { useLetters } from "@/hooks/useLetters";
import { useDigitalSeals } from "@/hooks/useDigitalSeals";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const CreateLetter = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const { createLetter, updateLetter, updateStatus } = useLetters();
  const { getSealForLetter } = useDigitalSeals();
  const letterRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!id);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [sealDialogOpen, setSealDialogOpen] = useState(false);
  const [currentLetterId, setCurrentLetterId] = useState<string | null>(id || null);

  const [formData, setFormData] = useState<LetterFormData>({
    recipientName: "",
    recipientEmail: "",
    country: "NG",
    state: "",
    office: "",
    dateOfAssignment: new Date(),
    letterContent: defaultLetterContent,
    signatories: [
      {
        id: crypto.randomUUID(),
        name: "",
        title: "",
      },
    ],
  });

  const existingSeal = currentLetterId ? getSealForLetter(currentLetterId) : null;

  // Load existing letter if editing
  useEffect(() => {
    const loadLetter = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("letters")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data) {
          setFormData({
            recipientName: data.recipient_name,
            recipientEmail: data.recipient_email,
            country: data.country,
            state: data.state || "",
            office: data.office,
            dateOfAssignment: new Date(data.date_of_assignment),
            letterContent: data.letter_content,
            signatories: (data.signatories as unknown as Signatory[]) || [],
          });
          setCurrentLetterId(data.id);
        }
      } catch (error: any) {
        toast({
          title: "Error loading letter",
          description: error.message,
          variant: "destructive",
        });
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    loadLetter();
  }, [id, navigate, toast]);

  const handleTemplateSelect = (content: string) => {
    setFormData((prev) => ({ ...prev, letterContent: content }));
  };

  const handleVersionRestore = (version: LetterFormData) => {
    setFormData(version);
  };

  const generatePdfBase64 = async (): Promise<string> => {
    if (!letterRef.current) throw new Error("Letter preview not available");
    
    const canvas = await html2canvas(letterRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;

    pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    
    // Return base64 without the data URL prefix
    const base64 = pdf.output("datauristring").split(",")[1];
    return base64;
  };

  const handleDownloadPDF = async () => {
    if (!letterRef.current) return;

    const recipientName = formData.recipientName || "Recipient";
    const dateStr = format(formData.dateOfAssignment, "yyyy-MM-dd");
    const fileName = `DIT_Letter_of_Engagement_${recipientName.replace(/\s+/g, "_")}_${dateStr}.pdf`;

    setIsGenerating(true);

    try {
      const canvas = await html2canvas(letterRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(fileName);

      // Update status to downloaded if we have a letter ID
      if (currentLetterId) {
        await updateStatus.mutateAsync({ id: currentLetterId, status: "downloaded" });
      }

      toast({
        title: "PDF Generated Successfully!",
        description: `${fileName} has been downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Error generating PDF",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (currentLetterId) {
        await updateLetter.mutateAsync({ id: currentLetterId, formData });
      } else {
        const result = await createLetter.mutateAsync(formData);
        if (result?.id) {
          setCurrentLetterId(result.id);
          navigate(`/edit/${result.id}`, { replace: true });
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = formData.recipientName && formData.recipientEmail && formData.office;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-3xl font-bold text-foreground">
            {id ? "Edit Letter of Engagement" : "Create Letter of Engagement"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {id
              ? "Update the letter details and regenerate the PDF"
              : "Fill in the details below to generate an official DIT Letter of Engagement"}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Form Section */}
          <div className="flex-1 lg:max-w-xl">
            {/* Template Selector */}
            <div className="mb-6">
              <TemplateSelector 
                onSelectTemplate={handleTemplateSelect} 
                currentContent={formData.letterContent}
              />
            </div>

            <LetterForm data={formData} onChange={setFormData} />

            {/* Version History */}
            {currentLetterId && (
              <div className="mt-6">
                <VersionHistory
                  letterId={currentLetterId}
                  onRestoreVersion={(formData) => {
                    setFormData(formData);
                  }}
                />
              </div>
            )}

            {/* Seal Status */}
            {currentLetterId && existingSeal && (
              <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Digital Seal</span>
                  </div>
                  <Badge
                    className={
                      existingSeal.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : existingSeal.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }
                  >
                    {existingSeal.status}
                  </Badge>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-3 animate-fade-in" style={{ animationDelay: "0.5s" }}>
              <Button
                onClick={handleSave}
                variant="outline"
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? "Saving..." : currentLetterId ? "Update" : "Save Draft"}
              </Button>

              <Button
                onClick={handleDownloadPDF}
                disabled={!isFormValid || isGenerating}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isGenerating ? "Generating..." : "Download PDF"}
              </Button>

              {currentLetterId && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setEmailDialogOpen(true)}
                    disabled={!isFormValid}
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Send Email
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setScheduleDialogOpen(true)}
                    disabled={!isFormValid}
                    className="flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    Schedule
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setBulkDialogOpen(true)}
                    disabled={!isFormValid}
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Bulk Send
                  </Button>

                  {isAdmin && (
                    <Button
                      variant="outline"
                      onClick={() => setSealDialogOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <Shield className="h-4 w-4" />
                      {existingSeal ? "View Seal" : "Request Seal"}
                    </Button>
                  )}
                </>
              )}

              <Button
                variant="outline"
                className="flex items-center gap-2 lg:hidden"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPreview ? "Hide Preview" : "Show Preview"}
              </Button>
            </div>
          </div>

          {/* Preview Section */}
          <div
            className={`flex-1 ${showPreview ? "block" : "hidden"} lg:block`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Letter Preview
              </h2>
              <span className="text-xs text-muted-foreground bg-accent px-2 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Updates in real-time
              </span>
            </div>
            
            <LetterPreview 
              ref={letterRef} 
              data={formData} 
              showSeal={existingSeal?.status === "approved"}
            />

            {/* Download Button at bottom */}
            <div className="mt-6 flex justify-center">
              <Button
                onClick={handleDownloadPDF}
                disabled={!isFormValid || isGenerating}
                size="lg"
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 px-8"
              >
                {isGenerating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
                {isGenerating ? "Generating PDF..." : "Download Letter as PDF"}
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Dialogs */}
      {currentLetterId && (
        <>
          <EmailDialog
            open={emailDialogOpen}
            onOpenChange={setEmailDialogOpen}
            letterId={currentLetterId}
            recipientEmail={formData.recipientEmail}
            recipientName={formData.recipientName}
            generatePdf={generatePdfBase64}
          />

          <ScheduleEmailDialog
            open={scheduleDialogOpen}
            onOpenChange={setScheduleDialogOpen}
            letterId={currentLetterId}
            recipientEmail={formData.recipientEmail}
            recipientName={formData.recipientName}
            generatePdf={generatePdfBase64}
          />

          <BulkEmailDialog
            open={bulkDialogOpen}
            onOpenChange={setBulkDialogOpen}
            letterId={currentLetterId}
            generatePdf={generatePdfBase64}
          />

          <DigitalSealDialog
            open={sealDialogOpen}
            onOpenChange={setSealDialogOpen}
            letterId={currentLetterId}
            existingSeal={existingSeal}
          />
        </>
      )}
    </div>
  );
};

export default CreateLetter;