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
            <ul 
              key={`bullets-${elements.length}`} 
              style={{ 
                listStyleType: "disc",
                listStylePosition: "outside",
                marginLeft: "32px",
                marginTop: "24px",
                marginBottom: "24px",
                textAlign: "justify",
              }}
            >
              {currentBullets.map((bullet, i) => (
                <li 
                  key={i} 
                  style={{ 
                    fontSize: "14px",
                    lineHeight: "1.8",
                    paddingLeft: "8px",
                    marginBottom: "12px",
                    letterSpacing: "0.02em",
                    wordSpacing: "0.1em",
                  }}
                >
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
          elements.push(<div key={`space-${index}`} style={{ height: "16px" }} />);
          return;
        }

        if (trimmedLine.startsWith("•") || trimmedLine.startsWith("-")) {
          currentBullets.push(trimmedLine);
        } else {
          flushBullets();
          elements.push(
            <p 
              key={index} 
              style={{ 
                fontSize: "14px",
                lineHeight: "1.8",
                textAlign: "justify",
                marginTop: "16px",
                marginBottom: "16px",
                letterSpacing: "0.02em",
                wordSpacing: "0.1em",
              }}
            >
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
        style={{ 
          minHeight: "297mm",
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          letterSpacing: "0.01em",
          wordSpacing: "0.05em",
        }}
      >
        {/* Header with gradient */}
        <div className="dit-gradient-header" style={{ padding: "24px 24px 16px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <img 
              src={ditLogo} 
              alt="DIT Logo" 
              style={{ height: "64px", width: "64px", objectFit: "contain", borderRadius: "6px" }}
            />
          </div>
        </div>

        {/* Letter Content */}
        <div style={{ padding: "24px 40px" }}>
          {/* Recipient */}
          <div style={{ marginBottom: "24px" }}>
            <p style={{ fontSize: "14px", color: "#1e3a5f", fontWeight: 500, letterSpacing: "0.02em" }}>To:</p>
            <p style={{ fontSize: "18px", fontWeight: 600, color: "#0d9488", letterSpacing: "0.02em" }}>
              {data.recipientName || "Recipient Name"},
            </p>
          </div>

          {/* Location and Date */}
          <div style={{ marginBottom: "24px", fontSize: "14px", color: "#0d9488", letterSpacing: "0.02em" }}>
            {location && <p>{location}.</p>}
            <p>{formattedDate}.</p>
          </div>

          {/* Title */}
          <h1 
            style={{ 
              fontSize: "20px",
              fontWeight: "bold",
              textAlign: "center",
              marginTop: "32px",
              marginBottom: "32px",
              letterSpacing: "0.15em",
              wordSpacing: "0.2em",
            }}
          >
            LETTER OF ENGAGEMENT
          </h1>

          {/* Greeting */}
          <p style={{ fontSize: "14px", marginBottom: "16px", letterSpacing: "0.02em" }}>
            Dear {data.recipientName?.split(" ")[0] || "Recipient"},
          </p>

          {/* Body */}
          <div style={{ fontSize: "14px", color: "#1a1a1a" }}>
            {renderContent()}
          </div>

          {/* Closing */}
          <div style={{ marginTop: "32px" }}>
            <p style={{ fontSize: "14px", marginBottom: "24px", letterSpacing: "0.02em" }}>Best Regards,</p>

            {/* Signatories and Seal Container */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              {/* Signatories */}
              <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                {data.signatories.map((signatory) => (
                  <div key={signatory.id} style={{ display: "flex", flexDirection: "column" }}>
                    {signatory.signatureImage && (
                      <div style={{ height: "64px", marginBottom: "8px" }}>
                        <img
                          src={signatory.signatureImage}
                          alt={`${signatory.name}'s signature`}
                          style={{ height: "100%", width: "auto", objectFit: "contain" }}
                        />
                      </div>
                    )}
                    {!signatory.signatureImage && (
                      <div style={{ height: "64px", marginBottom: "8px", borderBottom: "1px dashed #9ca3af", width: "160px" }} />
                    )}
                    <p style={{ color: "#0d9488", fontWeight: 500, letterSpacing: "0.02em" }}>{signatory.name || "Signatory Name"}</p>
                    <p style={{ color: "#0d9488", fontSize: "14px", letterSpacing: "0.02em" }}>{signatory.title || "Title, DIT."}</p>
                  </div>
                ))}
              </div>

              {/* Digital Seal */}
              {showSeal && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <img
                    src={ditSeal}
                    alt="DIT Official Seal"
                    style={{ height: "96px", width: "96px", objectFit: "contain", opacity: 0.9 }}
                  />
                  <p style={{ fontSize: "9px", color: "#6b7280", marginTop: "4px", textAlign: "center", letterSpacing: "0.02em" }}>
                    Digitally Verified
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: "auto" }}>
          <div 
            className="dit-gradient-footer" 
            style={{ 
              color: "white", 
              padding: "16px 24px", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between", 
              fontSize: "12px",
              letterSpacing: "0.02em",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>📞</span>
                <span>+234 905 365 1803</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>📞</span>
                <span>+234 814 588 0856</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>✉️</span>
                <span>divintelteam@gmail.com</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>📘</span>
                <span>facebook.com/divintelteam</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>© DIT {new Date().getFullYear()}</span>
              <img 
                src={ditLogo}
                alt="DIT" 
                style={{ height: "24px", width: "24px", objectFit: "contain", borderRadius: "4px", opacity: 0.8 }}
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
