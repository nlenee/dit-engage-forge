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
            <ul 
              key={`bullets-${elements.length}`} 
              style={{ 
                listStyleType: "disc",
                marginLeft: "24px",
                marginTop: "12px",
                marginBottom: "12px",
              }}
            >
              {currentBullets.map((bullet, i) => (
                <li 
                  key={i} 
                  style={{ 
                    fontSize: "11pt",
                    lineHeight: "1.6",
                    marginBottom: "6px",
                    color: "#1a1a1a",
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
          flushBullets();
          elements.push(<div key={`space-${index}`} style={{ height: "8px" }} />);
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
                fontSize: "11pt",
                lineHeight: "1.6",
                textAlign: "justify",
                marginBottom: "10px",
                color: "#1a1a1a",
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
        className="letter-document"
        style={{ 
          width: "210mm",
          minHeight: "297mm",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "11pt",
          color: "#1a1a1a",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div 
          style={{ 
            backgroundColor: "#e8f4f8",
            padding: "20px 32px",
            borderBottom: "2px solid #0d9488",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <img 
            src={ditLogo} 
            alt="DIT Logo" 
            style={{ 
              height: "60px", 
              width: "60px", 
              objectFit: "contain",
            }}
          />
          <div style={{ textAlign: "right" }}>
            <h2 style={{ 
              fontSize: "16pt",
              fontWeight: "bold",
              color: "#1e3a5f",
              margin: 0,
              letterSpacing: "2px",
            }}>
              DIVINTEL TEAM
            </h2>
            <p style={{ 
              fontSize: "9pt", 
              color: "#0d9488",
              margin: "4px 0 0 0",
              letterSpacing: "1px",
            }}>
              Excellence in Innovation
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ padding: "28px 40px" }}>
          {/* Recipient */}
          <div style={{ marginBottom: "16px" }}>
            <p style={{ 
              fontSize: "9pt", 
              color: "#666", 
              fontWeight: "bold", 
              marginBottom: "4px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}>To:</p>
            <p style={{ 
              fontSize: "14pt", 
              fontWeight: "bold", 
              color: "#0d9488",
              margin: 0,
            }}>
              {data.recipientName || "Recipient Name"}
            </p>
          </div>

          {/* Location and Date */}
          <div style={{ marginBottom: "20px", fontSize: "10pt", color: "#444" }}>
            {location && <p style={{ margin: "0 0 4px 0" }}>{location}</p>}
            <p style={{ margin: 0, fontStyle: "italic" }}>{formattedDate}</p>
          </div>

          {/* Divider */}
          <div style={{ 
            width: "50px", 
            height: "2px", 
            backgroundColor: "#0d9488",
            marginBottom: "24px",
          }} />

          {/* Title */}
          <h1 style={{ 
            fontSize: "14pt",
            fontWeight: "bold",
            textAlign: "center",
            margin: "20px 0 28px 0",
            letterSpacing: "3px",
            color: "#1e3a5f",
            textTransform: "uppercase",
          }}>
            LETTER OF ENGAGEMENT
          </h1>

          {/* Greeting */}
          <p style={{ 
            fontSize: "11pt", 
            marginBottom: "16px",
            color: "#1a1a1a",
          }}>
            Dear {data.recipientName?.split(" ")[0] || "Recipient"},
          </p>

          {/* Body Content */}
          <div>{renderContent()}</div>

          {/* Closing */}
          <div style={{ marginTop: "28px" }}>
            <p style={{ 
              fontSize: "11pt", 
              marginBottom: "24px",
              color: "#1a1a1a",
            }}>
              Best Regards,
            </p>

            {/* Signatories and Seal */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "flex-end",
            }}>
              {/* Signatories */}
              <div>
                {data.signatories.map((signatory) => (
                  <div key={signatory.id} style={{ marginBottom: "20px" }}>
                    {signatory.signatureImage ? (
                      <div style={{ height: "50px", marginBottom: "8px" }}>
                        <img
                          src={signatory.signatureImage}
                          alt="Signature"
                          style={{ height: "100%", width: "auto", objectFit: "contain" }}
                        />
                      </div>
                    ) : (
                      <div style={{ 
                        height: "50px", 
                        marginBottom: "8px", 
                        borderBottom: "1px dashed #999", 
                        width: "150px",
                      }} />
                    )}
                    <p style={{ 
                      color: "#0d9488", 
                      fontWeight: "bold",
                      fontSize: "11pt",
                      margin: "0 0 2px 0",
                    }}>
                      {signatory.name || "Signatory Name"}
                    </p>
                    <p style={{ 
                      color: "#666", 
                      fontSize: "10pt",
                      fontStyle: "italic",
                      margin: 0,
                    }}>
                      {signatory.title || "Title, DIT"}
                    </p>
                  </div>
                ))}
              </div>

              {/* Digital Seal */}
              {showSeal && (
                <div style={{ 
                  textAlign: "center",
                  padding: "10px",
                  border: "1px solid #d1fae5",
                  borderRadius: "8px",
                  backgroundColor: "#f0fdfa",
                }}>
                  <img
                    src={ditSeal}
                    alt="DIT Official Seal"
                    style={{ height: "70px", width: "70px", objectFit: "contain" }}
                  />
                  <p style={{ 
                    fontSize: "7pt", 
                    color: "#059669", 
                    marginTop: "4px",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}>
                    Digitally Verified
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          backgroundColor: "#1e3a5f",
          color: "white", 
          padding: "16px 32px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          fontSize: "9pt",
          marginTop: "auto",
        }}>
          <div>
            <p style={{ margin: "0 0 4px 0" }}>📞 +234 905 365 1803</p>
            <p style={{ margin: 0 }}>📞 +234 814 588 0856</p>
          </div>
          <div>
            <p style={{ margin: "0 0 4px 0" }}>✉️ divintelteam@gmail.com</p>
            <p style={{ margin: 0 }}>📘 facebook.com/divintelteam</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontWeight: "bold" }}>© DIT {new Date().getFullYear()}</span>
            <img 
              src={ditLogo}
              alt="DIT" 
              style={{ height: "24px", width: "24px", objectFit: "contain", borderRadius: "4px" }}
            />
          </div>
        </div>
      </div>
    );
  }
);

LetterPreview.displayName = "LetterPreview";

export default LetterPreview;
