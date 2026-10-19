import { useState, useEffect } from "react";
import { ArrowLeft, FileText, Shield, FileCheck, DollarSign, FileSignature } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LegalTabSkeleton } from "../components/ui/TabSkeletons";

const tabs = [
  { id: "terms", label: "Terms of Service", icon: FileText, file: "terms-of-service.md" },
  { id: "privacy", label: "Privacy Policy", icon: Shield, file: "privacy-policy.md" },
  { id: "dpa", label: "Data Processing", icon: FileCheck, file: "data-processing-agreement.md" },
  { id: "refund", label: "Refund Policy", icon: DollarSign, file: "refund-policy.md" },
  { id: "msa", label: "Master Service Agreement", icon: FileSignature, file: "master-service-agreement.md" },
];

function LegalScreen() {
  const [activeTab, setActiveTab] = useState("terms");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const currentTab = tabs.find((t) => t.id === activeTab);
    if (!currentTab) return;

    setLoading(true);
    setError(null);

    fetch(`/legal/${currentTab.file}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load document");
        return res.text();
      })
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [activeTab]);

  const handleBack = () => {
    window.history.back();
  };

  // Simple markdown-to-HTML conversion (basic formatting only)
  const renderMarkdown = (markdown) => {
    if (!markdown) return null;

    // Split by lines and process
    const lines = markdown.split("\n");
    const elements = [];
    let currentParagraph = [];
    let listItems = [];
    let inList = false;

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        elements.push(
          <p
            key={`p-${elements.length}`}
            style={{
              marginBottom: 16,
              lineHeight: 1.7,
              color: "var(--text-primary)",
              fontSize: 14,
            }}
          >
            {formatInlineMarkdown(currentParagraph.join(" "))}
          </p>
        );
        currentParagraph = [];
      }
    };

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul
            key={`ul-${elements.length}`}
            style={{
              marginBottom: 16,
              paddingLeft: 24,
              color: "var(--text-primary)",
              fontSize: 14,
              lineHeight: 1.7,
            }}
          >
            {listItems.map((item, i) => (
              <li key={i} style={{ marginBottom: 8 }}>
                {formatInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line, idx) => {
      // H1
      if (line.startsWith("# ")) {
        flushParagraph();
        flushList();
        elements.push(
          <h1
            key={`h1-${idx}`}
            style={{
              fontSize: 28,
              fontWeight: 800,
              fontFamily: "Baloo 2, cursive",
              color: "var(--text-primary)",
              marginBottom: 12,
              marginTop: idx > 0 ? 24 : 0,
            }}
          >
            {line.slice(2)}
          </h1>
        );
      }
      // H2
      else if (line.startsWith("## ")) {
        flushParagraph();
        flushList();
        elements.push(
          <h2
            key={`h2-${idx}`}
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginTop: 28,
              marginBottom: 12,
            }}
          >
            {line.slice(3)}
          </h2>
        );
      }
      // H3
      else if (line.startsWith("### ")) {
        flushParagraph();
        flushList();
        elements.push(
          <h3
            key={`h3-${idx}`}
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginTop: 20,
              marginBottom: 10,
            }}
          >
            {line.slice(4)}
          </h3>
        );
      }
      // Unordered list
      else if (line.match(/^[\-\*]\s+/)) {
        flushParagraph();
        inList = true;
        listItems.push(line.replace(/^[\-\*]\s+/, ""));
      }
      // Empty line
      else if (line.trim() === "") {
        flushParagraph();
        if (inList) flushList();
      }
      // Regular paragraph line
      else {
        if (inList) flushList();
        currentParagraph.push(line);
      }
    });

    // Flush any remaining content
    flushParagraph();
    flushList();

    return elements;
  };

  // Format inline markdown (bold, italic, links)
  const formatInlineMarkdown = (text) => {
    const parts = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Bold **text**
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      if (boldMatch && boldMatch.index === 0) {
        parts.push(
          <strong key={`b-${key++}`} style={{ fontWeight: 700 }}>
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Italic *text* or _text_
      const italicMatch = remaining.match(/[\*_](.+?)[\*_]/);
      if (italicMatch && italicMatch.index === 0) {
        parts.push(
          <em key={`i-${key++}`} style={{ fontStyle: "italic" }}>
            {italicMatch[1]}
          </em>
        );
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Link [text](url)
      const linkMatch = remaining.match(/\[(.+?)\]\((.+?)\)/);
      if (linkMatch && linkMatch.index === 0) {
        parts.push(
          <a
            key={`a-${key++}`}
            href={linkMatch[2]}
            style={{
              color: "var(--btn-primary-bg)",
              textDecoration: "underline",
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            {linkMatch[1]}
          </a>
        );
        remaining = remaining.slice(linkMatch[0].length);
        continue;
      }

      // Regular text until next special character
      const nextSpecial = remaining.search(/[\*_\[]/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        break;
      } else if (nextSpecial > 0) {
        parts.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      } else {
        // Special char but no match, output it
        parts.push(remaining[0]);
        remaining = remaining.slice(1);
      }
    }

    return parts;
  };

  // Compliance badges section for Privacy Policy
  const ComplianceBadges = () => (
    <div
      style={{
        background: "var(--bg-card)",
        borderRadius: 16,
        padding: 24,
        marginBottom: 32,
        border: "1px solid var(--border-subtle)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <h2
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: "var(--text-primary)",
          marginBottom: 16,
          textAlign: "center",
        }}
      >
        Data Protection Compliance
      </h2>
      
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 24,
          marginBottom: 20,
        }}
      >
        {/* NPC Registration Badge */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <img
            src="/images/legal/npc-dpo-dps-badge.png"
            alt="National Privacy Commission - DPO/DPS Registered"
            style={{
              width: "100%",
              maxWidth: 180,
              height: "auto",
              borderRadius: 8,
            }}
          />
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              NPC Registered
            </p>
            <p
              style={{
                fontSize: 11,
                color: "var(--text-secondary)",
                margin: "4px 0 0 0",
              }}
            >
              Valid until June 23, 2027
            </p>
          </div>
        </div>

        {/* ICT Division Logo */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <img
            src="/images/legal/ict-division-logo.png"
            alt="Palayan City ICT Division"
            style={{
              width: "100%",
              maxWidth: 180,
              height: "auto",
              borderRadius: 8,
            }}
          />
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              ICT Division
            </p>
            <p
              style={{
                fontSize: 11,
                color: "var(--text-secondary)",
                margin: "4px 0 0 0",
              }}
            >
              Palayan City Government
            </p>
          </div>
        </div>

        {/* Palayan City Seal */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <img
            src="/images/legal/palayan-city-seal.png"
            alt="Lungsod ng Palayan - Kabisera ng Nueva Ecija"
            style={{
              width: "100%",
              maxWidth: 180,
              height: "auto",
              borderRadius: 8,
            }}
          />
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Official Seal
            </p>
            <p
              style={{
                fontSize: 11,
                color: "var(--text-secondary)",
                margin: "4px 0 0 0",
              }}
            >
              City Government of Palayan
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          background: "var(--bg-base)",
          borderRadius: 12,
          padding: 16,
          borderLeft: "4px solid #2563eb",
        }}
      >
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.6,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          <strong>Datos ng Pilipino, Protektado Ko!</strong> - The City Government of Palayan is officially registered with the National Privacy Commission as a Data Protection Officer (DPO) and operates a compliant Data Processing System (DPS). Your personal data is protected under Republic Act 10173 (Data Privacy Act of 2012).
        </p>
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        background: "var(--bg-base)",
        overflow: "hidden",
      }}
    >
      {/* Header with back button */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-card)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <button
          onClick={handleBack}
          style={{
            padding: "8px 16px 8px 12px",
            background: "var(--bg-base)",
            borderRadius: "20px",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 14,
            fontWeight: 800,
            color: "var(--text-primary)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
          Back
        </button>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 800,
            fontFamily: "Baloo 2, cursive",
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          Legal Documents
        </h1>
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          overflowX: "auto",
          gap: 8,
          padding: "12px 20px",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-card)",
          whiteSpace: "nowrap",
        }}
        className="hide-scroll"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                border: isActive
                  ? "1px solid var(--btn-primary-bg)"
                  : "1px solid var(--border-subtle)",
                background: isActive ? "var(--btn-primary-bg)" : "var(--bg-base)",
                color: isActive ? "var(--btn-primary-text)" : "var(--text-primary)",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s",
              }}
            >
              <Icon size={16} strokeWidth={2.5} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 20px calc(110px + env(safe-area-inset-bottom, 0px))",
        }}
        className="hide-scroll"
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <LegalTabSkeleton />
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 200,
                color: "#ef4444",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              Error: {error}
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{
                maxWidth: 800,
                margin: "0 auto",
              }}
            >
              {/* Show compliance badges only for Privacy Policy */}
              {activeTab === "privacy" && <ComplianceBadges />}
              {renderMarkdown(content)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default LegalScreen;
