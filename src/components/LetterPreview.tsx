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
                listStylePosition: "outside",
                marginLeft: "20px",
                paddingLeft: "10px",
                marginTop: "12px",
                marginBottom: "12px",
              }}
            >
              {currentBullets.map((bullet, i) => (
                <li 
                  key={i} 
                  style={{ 
                    fontFamily: "'Times New Roman', Times, Georgia, serif",
                    fontSize: "11pt",
                    lineHeight: "1.8",
                    marginBottom: "8px",
                    color: "#000000",
                    textAlign: "left",
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
                fontFamily: "'Times New Roman', Times, Georgia, serif",
                fontSize: "11pt",
                lineHeight: "1.8",
                textAlign: "justify",
                marginBottom: "14px",
                marginTop: "0",
                color: "#000000",
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
          fontFamily: "'Times New Roman', Times, Georgia, serif",
          fontSize: "11pt",
          color: "#000000",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header Section */}
        <div 
          style={{ 
            backgroundColor: "#f0f7fa",
            padding: "24px 50px",
            borderBottom: "3px solid #0d9488",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <img 
            src={ditLogo} 
            alt="DIT Logo" 
            style={{ 
              height: "70px", 
              width: "70px", 
              objectFit: "contain",
            }}
          />
          <div style={{ textAlign: "right" }}>
            <h2 style={{ 
              fontFamily: "'Times New Roman', Times, Georgia, serif",
              fontSize: "18pt",
              fontWeight: "bold",
              color: "#1e3a5f",
              margin: 0,
              letterSpacing: "3px",
            }}>
              DIVINTEL TEAM
            </h2>
            <p style={{ 
              fontFamily: "'Times New Roman', Times, Georgia, serif",
              fontSize: "10pt", 
              color: "#0d9488",
              margin: "6px 0 0 0",
              letterSpacing: "1px",
              fontStyle: "italic",
            }}>
              Excellence in Innovation
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ 
          padding: "40px 50px",
          flexGrow: 1,
        }}>
          {/* Recipient Section */}
          <div style={{ marginBottom: "20px" }}>
            <p style={{ 
              fontFamily: "'Times New Roman', Times, Georgia, serif",
              fontSize: "9pt", 
              color: "#555555", 
              fontWeight: "bold", 
              marginBottom: "6px",
              marginTop: "0",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}>To:</p>
            <p style={{ 
              fontFamily: "'Times New Roman', Times, Georgia, serif",
              fontSize: "14pt", 
              fontWeight: "bold", 
              color: "#0d9488",
              margin: 0,
            }}>
              {data.recipientName || "Recipient Name"}
            </p>
          </div>

          {/* Location and Date */}
          <div style={{ marginBottom: "24px" }}>
            {location && (
              <p style={{ 
                fontFamily: "'Times New Roman', Times, Georgia, serif",
                fontSize: "11pt", 
                color: "#333333",
                margin: "0 0 6px 0",
              }}>
                {location}
              </p>
            )}
            <p style={{ 
              fontFamily: "'Times New Roman', Times, Georgia, serif",
              fontSize: "11pt",
              color: "#333333",
              margin: 0, 
              fontStyle: "italic",
            }}>
              {formattedDate}
            </p>
          </div>

          {/* Decorative Line */}
          <div style={{ 
            width: "60px", 
            height: "3px", 
            backgroundColor: "#0d9488",
            marginBottom: "28px",
          }} />

          {/* Document Title */}
          <h1 style={{ 
            fontFamily: "'Times New Roman', Times, Georgia, serif",
            fontSize: "16pt",
            fontWeight: "bold",
            textAlign: "center",
            margin: "0 0 32px 0",
            letterSpacing: "4px",
            color: "#1e3a5f",
            textTransform: "uppercase",
          }}>
            LETTER OF ENGAGEMENT
          </h1>

          {/* Greeting */}
          <p style={{ 
            fontFamily: "'Times New Roman', Times, Georgia, serif",
            fontSize: "11pt", 
            marginBottom: "20px",
            marginTop: "0",
            color: "#000000",
            lineHeight: "1.8",
          }}>
            Dear {data.recipientName?.split(" ")[0] || "Recipient"},
          </p>

          {/* Body Content */}
          <div style={{ marginBottom: "32px" }}>
            {renderContent()}
          </div>

          {/* Closing Section */}
          <div style={{ marginTop: "36px" }}>
            <p style={{ 
              fontFamily: "'Times New Roman', Times, Georgia, serif",
              fontSize: "11pt", 
              marginBottom: "28px",
              marginTop: "0",
              color: "#000000",
              lineHeight: "1.8",
            }}>
              Best Regards,
            </p>

            {/* Signatories and Seal Container */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "20px",
            }}>
              {/* Signatories */}
              <div style={{ flexShrink: 0 }}>
                {data.signatories.map((signatory) => (
                  <div key={signatory.id} style={{ marginBottom: "24px" }}>
                    {signatory.signatureImage ? (
                      <div style={{ height: "55px", marginBottom: "10px" }}>
                        <img
                          src={signatory.signatureImage}
                          alt="Signature"
                          style={{ 
                            height: "100%", 
                            width: "auto", 
                            maxWidth: "180px",
                            objectFit: "contain",
                          }}
                        />
                      </div>
                    ) : (
                      <div style={{ 
                        height: "55px", 
                        marginBottom: "10px", 
                        borderBottom: "1px dashed #888888", 
                        width: "160px",
                      }} />
                    )}
                    <p style={{ 
                      fontFamily: "'Times New Roman', Times, Georgia, serif",
                      color: "#0d9488", 
                      fontWeight: "bold",
                      fontSize: "11pt",
                      margin: "0 0 4px 0",
                    }}>
                      {signatory.name || "Signatory Name"}
                    </p>
                    <p style={{ 
                      fontFamily: "'Times New Roman', Times, Georgia, serif",
                      color: "#555555", 
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
                  padding: "12px 16px",
                  border: "2px solid #d1fae5",
                  borderRadius: "8px",
                  backgroundColor: "#f0fdfa",
                  flexShrink: 0,
                }}>
                  <img
                    src={ditSeal}
                    alt="DIT Official Seal"
                    style={{ 
                      height: "75px", 
                      width: "75px", 
                      objectFit: "contain",
                    }}
                  />
                  <p style={{ 
                    fontFamily: "'Times New Roman', Times, Georgia, serif",
                    fontSize: "8pt", 
                    color: "#059669", 
                    marginTop: "6px",
                    marginBottom: "0",
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

        {/* Footer Section */}
        <div style={{ 
          backgroundColor: "#1e3a5f",
          color: "#ffffff", 
          padding: "18px 50px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          fontSize: "9pt",
          flexShrink: 0,
          marginTop: "auto",
        }}>
          <div>
            <p style={{ 
              fontFamily: "'Times New Roman', Times, Georgia, serif",
              margin: "0 0 4px 0",
              fontSize: "9pt",
            }}>
              📞 +234 905 365 1803
            </p>
            <p style={{ 
              fontFamily: "'Times New Roman', Times, Georgia, serif",
              margin: 0,
              fontSize: "9pt",
            }}>
              📞 +234 814 588 0856
            </p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ 
              fontFamily: "'Times New Roman', Times, Georgia, serif",
              margin: "0 0 4px 0",
              fontSize: "9pt",
            }}>
              ✉️ divintelteam@gmail.com
            </p>
            <p style={{ 
              fontFamily: "'Times New Roman', Times, Georgia, serif",
              margin: 0,
              fontSize: "9pt",
            }}>
              📘 facebook.com/divintelteam
            </p>
          </div>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "10px",
          }}>
            <span style={{ 
              fontFamily: "'Times New Roman', Times, Georgia, serif",
              fontWeight: "bold",
              fontSize: "9pt",
            }}>
              © DIT {new Date().getFullYear()}
            </span>
            <img 
              src={ditLogo}
              alt="DIT" 
              style={{ 
                height: "28px", 
                width: "28px", 
                objectFit: "contain", 
                borderRadius: "4px",
              }}
            />
          </div>
        </div>
      </div>
    );
  }
);

LetterPreview.displayName = "LetterPreview";

export default LetterPreview;
