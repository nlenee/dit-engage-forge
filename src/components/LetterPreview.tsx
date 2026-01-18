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
                marginLeft: "36px",
                marginTop: "20px",
                marginBottom: "20px",
                textAlign: "justify",
              }}
            >
              {currentBullets.map((bullet, i) => (
                <li 
                  key={i} 
                  style={{ 
                    fontSize: "13px",
                    lineHeight: "2",
                    paddingLeft: "10px",
                    marginBottom: "10px",
                    letterSpacing: "0.025em",
                    wordSpacing: "0.12em",
                    color: "#2d3748",
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
          elements.push(<div key={`space-${index}`} style={{ height: "14px" }} />);
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
                fontSize: "13px",
                lineHeight: "2",
                textAlign: "justify",
                marginTop: "14px",
                marginBottom: "14px",
                letterSpacing: "0.025em",
                wordSpacing: "0.12em",
                color: "#2d3748",
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
          position: "relative",
          width: "210mm",
          minHeight: "297mm",
          maxWidth: "210mm",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          fontFamily: "'Inter', 'Segoe UI', -apple-system, sans-serif",
          letterSpacing: "0.02em",
          wordSpacing: "0.08em",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
          borderRadius: "8px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Watermark - DIT Logo at center */}
        <div 
          className="letter-watermark"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "280px",
            height: "280px",
            opacity: 0.04,
            pointerEvents: "none",
            zIndex: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img 
            src={ditLogo} 
            alt="" 
            style={{ 
              width: "100%", 
              height: "100%", 
              objectFit: "contain",
              filter: "grayscale(100%)",
            }}
          />
        </div>

        {/* Header with elegant gradient */}
        <div 
          style={{ 
            background: "linear-gradient(135deg, #e0f7fa 0%, #e8f4f8 40%, #d4edda 100%)",
            padding: "28px 32px 20px 32px",
            borderBottom: "3px solid #0d9488",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <img 
              src={ditLogo} 
              alt="DIT Logo" 
              style={{ 
                height: "72px", 
                width: "72px", 
                objectFit: "contain", 
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            />
            <div style={{ textAlign: "right" }}>
              <h2 style={{ 
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "18px",
                fontWeight: 700,
                color: "#1e3a5f",
                letterSpacing: "0.08em",
                marginBottom: "4px",
              }}>
                DIVINTEL TEAM
              </h2>
              <p style={{ 
                fontSize: "10px", 
                color: "#0d9488",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}>
                Excellence in Innovation
              </p>
            </div>
          </div>
        </div>

        {/* Letter Content */}
        <div style={{ 
          padding: "32px 48px", 
          flex: 1,
          position: "relative",
          zIndex: 1,
        }}>
          {/* Recipient */}
          <div style={{ marginBottom: "20px" }}>
            <p style={{ 
              fontSize: "12px", 
              color: "#1e3a5f", 
              fontWeight: 600, 
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}>To:</p>
            <p style={{ 
              fontSize: "18px", 
              fontWeight: 700, 
              color: "#0d9488", 
              letterSpacing: "0.03em",
              fontFamily: "'Playfair Display', Georgia, serif",
            }}>
              {data.recipientName || "Recipient Name"},
            </p>
          </div>

          {/* Location and Date */}
          <div style={{ 
            marginBottom: "28px", 
            fontSize: "13px", 
            color: "#4a5568", 
            letterSpacing: "0.025em",
            lineHeight: "1.8",
          }}>
            {location && <p style={{ marginBottom: "4px" }}>{location}.</p>}
            <p style={{ fontStyle: "italic" }}>{formattedDate}.</p>
          </div>

          {/* Decorative line */}
          <div style={{ 
            width: "60px", 
            height: "3px", 
            background: "linear-gradient(90deg, #0d9488, #1e3a5f)",
            marginBottom: "28px",
            borderRadius: "2px",
          }} />

          {/* Title */}
          <h1 
            style={{ 
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "22px",
              fontWeight: 700,
              textAlign: "center",
              marginTop: "24px",
              marginBottom: "32px",
              letterSpacing: "0.18em",
              wordSpacing: "0.25em",
              color: "#1e3a5f",
              textTransform: "uppercase",
              position: "relative",
              paddingBottom: "16px",
            }}
          >
            LETTER OF ENGAGEMENT
            <span style={{
              position: "absolute",
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "80px",
              height: "2px",
              background: "linear-gradient(90deg, transparent, #0d9488, transparent)",
            }} />
          </h1>

          {/* Greeting */}
          <p style={{ 
            fontSize: "14px", 
            marginBottom: "18px", 
            letterSpacing: "0.02em",
            color: "#2d3748",
            fontWeight: 500,
          }}>
            Dear {data.recipientName?.split(" ")[0] || "Recipient"},
          </p>

          {/* Body */}
          <div style={{ position: "relative", zIndex: 1 }}>
            {renderContent()}
          </div>

          {/* Closing */}
          <div style={{ marginTop: "36px" }}>
            <p style={{ 
              fontSize: "14px", 
              marginBottom: "28px", 
              letterSpacing: "0.025em",
              color: "#2d3748",
              fontWeight: 500,
            }}>
              Best Regards,
            </p>

            {/* Signatories and Seal Container */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "flex-end",
              marginTop: "20px",
            }}>
              {/* Signatories */}
              <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                {data.signatories.map((signatory) => (
                  <div key={signatory.id} style={{ display: "flex", flexDirection: "column" }}>
                    {signatory.signatureImage && (
                      <div style={{ height: "56px", marginBottom: "10px" }}>
                        <img
                          src={signatory.signatureImage}
                          alt={`${signatory.name}'s signature`}
                          style={{ height: "100%", width: "auto", objectFit: "contain" }}
                        />
                      </div>
                    )}
                    {!signatory.signatureImage && (
                      <div style={{ 
                        height: "56px", 
                        marginBottom: "10px", 
                        borderBottom: "2px dashed #cbd5e0", 
                        width: "180px",
                      }} />
                    )}
                    <p style={{ 
                      color: "#0d9488", 
                      fontWeight: 600, 
                      letterSpacing: "0.03em",
                      fontSize: "14px",
                    }}>
                      {signatory.name || "Signatory Name"}
                    </p>
                    <p style={{ 
                      color: "#4a5568", 
                      fontSize: "13px", 
                      letterSpacing: "0.02em",
                      fontStyle: "italic",
                    }}>
                      {signatory.title || "Title, DIT."}
                    </p>
                  </div>
                ))}
              </div>

              {/* Digital Seal */}
              {showSeal && (
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "center",
                  padding: "12px",
                  background: "linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%)",
                  borderRadius: "12px",
                  border: "1px solid #d1fae5",
                }}>
                  <img
                    src={ditSeal}
                    alt="DIT Official Seal"
                    style={{ 
                      height: "88px", 
                      width: "88px", 
                      objectFit: "contain",
                    }}
                  />
                  <p style={{ 
                    fontSize: "8px", 
                    color: "#059669", 
                    marginTop: "6px", 
                    textAlign: "center", 
                    letterSpacing: "0.08em",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}>
                    Digitally Verified
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: "auto", position: "relative", zIndex: 1 }}>
          <div 
            style={{ 
              background: "linear-gradient(90deg, #1e3a5f 0%, #2d5a87 50%, #1e3a5f 100%)",
              color: "white", 
              padding: "18px 32px", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between", 
              fontSize: "11px",
              letterSpacing: "0.03em",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "12px" }}>📞</span>
                <span style={{ opacity: 0.95 }}>+234 905 365 1803</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "12px" }}>📞</span>
                <span style={{ opacity: 0.95 }}>+234 814 588 0856</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "12px" }}>✉️</span>
                <span style={{ opacity: 0.95 }}>divintelteam@gmail.com</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "12px" }}>📘</span>
                <span style={{ opacity: 0.95 }}>facebook.com/divintelteam</span>
              </div>
            </div>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "12px",
              background: "rgba(255,255,255,0.1)",
              padding: "8px 14px",
              borderRadius: "8px",
            }}>
              <span style={{ fontWeight: 600 }}>© DIT {new Date().getFullYear()}</span>
              <img 
                src={ditLogo}
                alt="DIT" 
                style={{ 
                  height: "28px", 
                  width: "28px", 
                  objectFit: "contain", 
                  borderRadius: "6px",
                }}
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
