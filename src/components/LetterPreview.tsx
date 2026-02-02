import { forwardRef } from "react";
import { format } from "date-fns";
import { LetterFormData } from "@/types/letter";
import { getCountryName, getStateName } from "@/data/countries";
import ditLogo from "@/assets/dit-logo.jpg";
import ditSeal from "@/assets/dit-seal.png";

interface LetterPreviewProps {
  data: LetterFormData;
  showSeal?: boolean;
}

const LetterPreview = forwardRef<HTMLDivElement, LetterPreviewProps>(
  ({ data, showSeal = false }, ref) => {
    const formattedDate = format(data.dateOfAssignment, "EEEE, d MMMM, yyyy");
    const countryName = getCountryName(data.country);
    const stateName = getStateName(data.country, data.state);
    const location = `${stateName}${stateName && countryName ? ", " : ""}${countryName}`;

    const processedContent = data.letterContent.replace(
      /\[POSITION\]/g,
      data.office || "[POSITION]"
    );

    const renderContent = () => {
      const lines = processedContent.split("\n");
      const elements: JSX.Element[] = [];
      let currentBullets: string[] = [];

      const flushBullets = () => {
        if (currentBullets.length > 0) {
          elements.push(
            <ul key={`bullets-${elements.length}`} className="list-disc list-outside ml-6 space-y-2 my-4">
              {currentBullets.map((bullet, i) => (
                <li key={i} className="text-foreground leading-relaxed">
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
          flushBullets();
          elements.push(<div key={`space-${index}`} className="h-4" />);
          return;
        }

        if (trimmedLine.startsWith("•") || trimmedLine.startsWith("-")) {
          currentBullets.push(trimmedLine);
        } else {
          flushBullets();
          elements.push(
            <p key={index} className="text-foreground leading-relaxed mb-4">
              {trimmedLine}
            </p>
          );
        }
      });

      flushBullets();
      return elements;
    };

    return (
      <div ref={ref} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-secondary/50 border-b border-border p-6">
          <div className="flex items-center justify-between">
            <img 
              src={ditLogo} 
              alt="DIT Logo" 
              className="h-14 w-14 object-contain rounded-lg"
            />
            <div className="text-right">
              <h2 className="text-xl font-bold text-primary tracking-wider">
                DIVINTEL TEAM
              </h2>
              <p className="text-sm text-muted-foreground italic mt-1">
                Excellence in Innovation
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          {/* Recipient Info */}
          <div className="mb-6">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">To:</span>
            <h3 className="text-lg font-bold text-primary mt-1">
              {data.recipientName || "Recipient Name"}
            </h3>
          </div>

          {/* Location & Date */}
          <div className="mb-6 text-sm text-muted-foreground">
            {location && <p>{location}</p>}
            <p className="italic">{formattedDate}</p>
          </div>

          <div className="w-16 h-1 bg-primary rounded mb-8" />

          {/* Title */}
          <h1 className="text-xl md:text-2xl font-bold text-center text-primary uppercase tracking-widest mb-8">
            Letter of Engagement
          </h1>

          {/* Greeting */}
          <p className="text-foreground leading-relaxed mb-6">
            Dear {data.recipientName?.split(" ")[0] || "Recipient"},
          </p>

          {/* Body Content */}
          <div className="prose prose-sm max-w-none">
            {renderContent()}
          </div>

          {/* Closing */}
          <div className="mt-10">
            <p className="text-foreground mb-8">Best Regards,</p>

            <div className="flex flex-wrap items-start justify-between gap-6">
              {/* Signatories */}
              <div className="space-y-6">
                {data.signatories.map((signatory) => (
                  <div key={signatory.id}>
                    {signatory.signatureImage ? (
                      <div className="h-14 mb-2">
                        <img
                          src={signatory.signatureImage}
                          alt="Signature"
                          className="h-full w-auto max-w-[160px] object-contain"
                        />
                      </div>
                    ) : (
                      <div className="h-14 mb-2 w-40 border-b border-dashed border-muted-foreground" />
                    )}
                    <p className="font-bold text-primary">
                      {signatory.name || "Signatory Name"}
                    </p>
                    <p className="text-sm text-muted-foreground italic">
                      {signatory.title || "Title, DIT"}
                    </p>
                  </div>
                ))}
              </div>

              {/* Digital Seal */}
              {showSeal && (
                <div className="text-center p-4 border-2 border-accent rounded-lg bg-accent/30">
                  <img
                    src={ditSeal}
                    alt="DIT Official Seal"
                    className="h-16 w-16 object-contain mx-auto"
                  />
                  <p className="text-xs font-bold text-primary mt-2 uppercase tracking-wider">
                    Digitally Verified
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-primary text-primary-foreground p-4 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <p>📞 +234 905 365 1803</p>
              <p>📞 +234 814 588 0856</p>
            </div>
            <div className="space-y-1 text-center">
              <p>✉️ divintelteam@gmail.com</p>
              <p>📘 facebook.com/divintelteam</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">© DIT {new Date().getFullYear()}</span>
              <img 
                src={ditLogo}
                alt="DIT" 
                className="h-7 w-7 object-contain rounded"
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
