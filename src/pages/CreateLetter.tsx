import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Eye, EyeOff, Mail, Save, Sparkles } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import LetterForm from "@/components/LetterForm";
import LetterPreview from "@/components/LetterPreview";
import { LetterFormData, defaultLetterContent } from "@/types/letter";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const CreateLetter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const letterRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

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

      // Save to local storage for dashboard
      const savedLetters = JSON.parse(localStorage.getItem("dit_letters") || "[]");
      savedLetters.unshift({
        id: crypto.randomUUID(),
        ...formData,
        createdAt: new Date().toISOString(),
        status: "downloaded",
      });
      localStorage.setItem("dit_letters", JSON.stringify(savedLetters));

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

  const handleSaveDraft = () => {
    const savedLetters = JSON.parse(localStorage.getItem("dit_letters") || "[]");
    savedLetters.unshift({
      id: crypto.randomUUID(),
      ...formData,
      createdAt: new Date().toISOString(),
      status: "draft",
    });
    localStorage.setItem("dit_letters", JSON.stringify(savedLetters));

    toast({
      title: "Draft Saved",
      description: "Your letter has been saved as a draft.",
    });
  };

  const isFormValid = formData.recipientName && formData.recipientEmail && formData.office;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Create Letter of Engagement
          </h1>
          <p className="text-muted-foreground mt-2">
            Fill in the details below to generate an official DIT Letter of Engagement
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Form Section */}
          <div className="flex-1 lg:max-w-xl">
            <LetterForm data={formData} onChange={setFormData} />

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-3 animate-fade-in" style={{ animationDelay: "0.5s" }}>
              <Button
                onClick={handleSaveDraft}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Draft
              </Button>

              <Button
                onClick={handleDownloadPDF}
                disabled={!isFormValid || isGenerating}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90"
              >
                <Download className="h-4 w-4" />
                {isGenerating ? "Generating..." : "Download PDF"}
              </Button>

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
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
                  <Eye className="h-5 w-5 text-dit-teal" />
                  Live Preview
                </h2>
                <span className="text-xs text-muted-foreground bg-accent px-2 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Updates in real-time
                </span>
              </div>
              
              <div className="bg-muted/50 rounded-xl p-4 overflow-auto max-h-[calc(100vh-200px)]">
                <div className="transform scale-[0.6] origin-top-left" style={{ width: "166.67%" }}>
                  <LetterPreview ref={letterRef} data={formData} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateLetter;
