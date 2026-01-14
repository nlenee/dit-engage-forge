import { forwardRef } from "react";
import { format } from "date-fns";
import { LetterFormData } from "@/types/letter";
import { getCountryName, getStateName } from "@/data/countries";
import ditLogo from "@/assets/dit-logo.jpg";

interface LetterPreviewProps {
  data: LetterFormData;
}

const LetterPreview = forwardRef<HTMLDivElement, LetterPreviewProps>(
  ({ data }, ref) => {
    const formattedDate = format(data.dateOfAssignment, "EEEE, d MMMM, yyyy");
    const countryName = getCountryName(data.country);
    const stateName = getStateName(data.country, data.state);
    const location = `${stateName}${stateName && countryName ? ", " : ""}${countryName}`;

    // Replace placeholder in content with actual office
    const processedContent = data.letterContent.replace(
      /\[POSITION\]/g,
      data.office || "[POSITION]"
    );

    // Split content into paragraphs and bullet points
    const renderContent = () => {
      const lines = processedContent.split("\n");
      const elements: JSX.Element[] = [];
      let currentBullets: string[] = [];

      const flushBullets = () => {
        if (currentBullets.length > 0) {
          elements.push(
            <ul key={`bullets-${elements.length}`} className="list-disc list-outside ml-8 space-y-3 my-6 text-justify">
              {currentBullets.map((bullet, i) => (
                <li key={i} className="text-sm leading-loose pl-2">
                  {bullet.replace(/^[•\-]\s*/, "")}
                </li>
              ))}
            </ul>
          );
          currentBullets = [];
        }
      };

      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          // Add spacing for empty lines
          elements.push(<div key={`space-${index}`} className="h-4" />);
          return;
        }

        if (trimmedLine.startsWith("•") || trimmedLine.startsWith("-")) {
          currentBullets.push(trimmedLine);
        } else {
          flushBullets();
          elements.push(
            <p key={index} className="text-sm leading-loose text-justify my-4">
              {trimmedLine}
            </p>
          );
        }
      });

      flushBullets();
      return elements;
    };

    return (
      <div
        ref={ref}
        className="letter-document w-full max-w-[210mm] mx-auto bg-white rounded-lg overflow-hidden"
        style={{ minHeight: "297mm" }}
      >
        {/* Header with gradient */}
        <div className="dit-gradient-header p-6 pb-4">
          <div className="flex items-start gap-2">
            <img 
              src={ditLogo} 
              alt="DIT Logo" 
              className="h-16 w-16 object-contain rounded-md"
            />
          </div>
        </div>

        {/* Letter Content */}
        <div className="px-10 py-6">
          {/* Recipient */}
          <div className="mb-6">
            <p className="text-sm text-dit-navy font-medium">To:</p>
            <p className="text-lg font-semibold text-dit-teal">
              {data.recipientName || "Recipient Name"},
            </p>
          </div>

          {/* Location and Date */}
          <div className="mb-6 text-sm text-dit-teal">
            {location && <p>{location}.</p>}
            <p>{formattedDate}.</p>
          </div>

          {/* Title */}
          <h1 className="letter-title text-xl font-bold text-center my-8 tracking-wider">
            LETTER OF ENGAGEMENT
          </h1>

          {/* Greeting */}
          <p className="text-sm mb-4">
            Dear {data.recipientName?.split(" ")[0] || "Recipient"},
          </p>

          {/* Body */}
          <div className="text-sm text-foreground">
            {renderContent()}
          </div>

          {/* Closing */}
          <div className="mt-8">
            <p className="text-sm mb-6">Best Regards,</p>

            {/* Signatories */}
            <div className="space-y-8">
              {data.signatories.map((signatory) => (
                <div key={signatory.id} className="flex flex-col">
                  {signatory.signatureImage && (
                    <div className="h-16 mb-2">
                      <img
                        src={signatory.signatureImage}
                        alt={`${signatory.name}'s signature`}
                        className="h-full w-auto object-contain"
                      />
                    </div>
                  )}
                  {!signatory.signatureImage && (
                    <div className="h-16 mb-2 border-b border-dashed border-muted-foreground/30 w-40" />
                  )}
                  <p className="text-dit-teal font-medium">{signatory.name || "Signatory Name"}</p>
                  <p className="text-dit-teal text-sm">{signatory.title || "Title, DIT."}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto">
          <div className="dit-gradient-footer text-white px-6 py-4 flex items-center justify-between text-xs">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span>📞</span>
                <span>+234 905 365 1803</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📞</span>
                <span>+234 814 588 0856</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span>✉️</span>
                <span>divintelteam@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📘</span>
                <span>facebook.com/divintelteam</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span>© DIT {new Date().getFullYear()}</span>
              <img 
                src={ditLogo}
                alt="DIT" 
                className="h-6 w-6 object-contain rounded opacity-80"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

LetterPreview.displayName = "LetterPreview";

export default LetterPreview;
