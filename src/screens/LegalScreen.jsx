import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Shield, 
  Users, 
  RefreshCw, 
  FileCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import CitizenNav from '../components/layout/CitizenNav';

const legalDocuments = [
  {
    id: 'terms',
    title: 'Terms of Service',
    icon: FileText,
    description: 'User agreement and acceptable use policy for CLIMA platform',
    file: '/legal/terms-of-service.md',
    color: '#2563eb'
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    icon: Shield,
    description: 'How we collect, use, and protect your personal information (R.A. 10173 compliant)',
    file: '/legal/privacy-policy.md',
    color: '#059669'
  },
  {
    id: 'dpa',
    title: 'Data Processing Agreement',
    icon: Users,
    description: 'Inter-agency data sharing and processing terms',
    file: '/legal/data-processing-agreement.md',
    color: '#7c3aed'
  },
  {
    id: 'refund',
    title: 'Refund Policy',
    icon: RefreshCw,
    description: 'CLIMA is a free government service (no fees, no refunds)',
    file: '/legal/refund-policy.md',
    color: '#dc2626'
  },
  {
    id: 'msa',
    title: 'Master Service Agreement',
    icon: FileCheck,
    description: 'Service level agreement for participating government agencies',
    file: '/legal/master-service-agreement.md',
    color: '#ea580c'
  }
];

function LegalScreen() {
  const [activeTab, setActiveTab] = useState('terms');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const activeDoc = legalDocuments.find(doc => doc.id === activeTab);

  useEffect(() => {
    async function loadDocument() {
      setLoading(true);
      try {
        const response = await fetch(activeDoc.file);
        const text = await response.text();
        setContent(text);
      } catch (error) {
        console.error('Error loading legal document:', error);
        setContent('# Error Loading Document\n\nUnable to load this document. Please try again later or contact ICT Office.');
      } finally {
        setLoading(false);
      }
    }
    loadDocument();
  }, [activeTab, activeDoc.file]);

  // Simple markdown to HTML converter (handles basic markdown)
  const renderMarkdown = (md) => {
    if (!md) return '';
    
    let html = md;
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    
    // Lists
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Paragraphs
    html = html.split('\n\n').map(para => {
      if (para.startsWith('<h') || para.startsWith('<ul') || para.startsWith('<li')) {
        return para;
      }
      return `<p>${para}</p>`;
    }).join('\n');
    
    // Tables (basic support)
    const tableRegex = /\|(.+)\|\n\|[-:| ]+\|\n((?:\|.+\|\n?)+)/g;
    html = html.replace(tableRegex, (match, header, rows) => {
      const headers = header.split('|').filter(h => h.trim()).map(h => `<th>${h.trim()}</th>`).join('');
      const rowsHtml = rows.trim().split('\n').map(row => {
        const cells = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      return `<table><thead><tr>${headers}</tr></thead><tbody>${rowsHtml}</tbody></table>`;
    });
    
    return html;
  };

  const S = {
    bg: isDark ? '#1a1a1a' : '#f8f9fa',
    card: isDark ? '#262626' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#1f2937',
    textSub: isDark ? '#a3a3a3' : '#6b7280',
    border: isDark ? '#404040' : '#e5e7eb',
    hover: isDark ? '#333333' : '#f3f4f6',
    primary: '#373D20',
  };

  return (
    <div style={{ minHeight: '100vh', background: S.bg }}>
      <CitizenNav />
      
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '80px 20px 40px' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '40px' }}
        >
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '800', 
            color: S.text, 
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <FileText size={40} color={S.primary} />
            Legal Information
          </h1>
          <p style={{ 
            fontSize: '1.1rem', 
            color: S.textSub,
            maxWidth: '700px'
          }}>
            Important legal documents governing the use of CLIMA platform. All documents comply with Philippine laws including the Data Privacy Act of 2012 (R.A. 10173).
          </p>
        </motion.div>

        {/* Two-column layout */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'minmax(280px, 320px) 1fr',
          gap: '24px',
          alignItems: 'start'
        }}>
          {/* Sidebar - Document tabs */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              position: 'sticky',
              top: '100px'
            }}
          >
            <div style={{
              background: S.card,
              borderRadius: '12px',
              border: `1px solid ${S.border}`,
              overflow: 'hidden'
            }}>
              {legalDocuments.map((doc, index) => {
                const Icon = doc.icon;
                const isActive = activeTab === doc.id;
                
                return (
                  <motion.button
                    key={doc.id}
                    onClick={() => setActiveTab(doc.id)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      background: isActive ? `${doc.color}15` : 'transparent',
                      borderLeft: isActive ? `4px solid ${doc.color}` : '4px solid transparent',
                      borderBottom: index < legalDocuments.length - 1 ? `1px solid ${S.border}` : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      transition: 'all 0.2s',
                      textAlign: 'left'
                    }}
                  >
                    <Icon 
                      size={24} 
                      color={isActive ? doc.color : S.textSub}
                      style={{ flexShrink: 0, marginTop: '2px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontWeight: isActive ? '700' : '600',
                        color: isActive ? doc.color : S.text,
                        fontSize: '0.95rem',
                        marginBottom: '4px'
                      }}>
                        {doc.title}
                      </div>
                      <div style={{ 
                        fontSize: '0.8rem',
                        color: S.textSub,
                        lineHeight: '1.4'
                      }}>
                        {doc.description}
                      </div>
                    </div>
                    <ChevronRight 
                      size={18} 
                      color={S.textSub}
                      style={{ 
                        flexShrink: 0,
                        opacity: isActive ? 1 : 0.3,
                        transform: isActive ? 'translateX(4px)' : 'translateX(0)',
                        transition: 'all 0.2s'
                      }}
                    />
                  </motion.button>
                );
              })}
            </div>

            {/* Quick links */}
            <div style={{
              marginTop: '20px',
              padding: '16px',
              background: S.card,
              borderRadius: '12px',
              border: `1px solid ${S.border}`
            }}>
              <h3 style={{ 
                fontSize: '0.9rem', 
                fontWeight: '700', 
                color: S.text,
                marginBottom: '12px'
              }}>
                External Resources
              </h3>
              <a
                href="https://www.privacy.gov.ph"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 0',
                  color: S.primary,
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: '500'
                }}
              >
                <ExternalLink size={14} />
                National Privacy Commission
              </a>
              <a
                href="https://www.foi.gov.ph"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 0',
                  color: S.primary,
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: '500'
                }}
              >
                <ExternalLink size={14} />
                Freedom of Information
              </a>
            </div>
          </motion.div>

          {/* Main content area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              background: S.card,
              borderRadius: '12px',
              border: `1px solid ${S.border}`,
              minHeight: '600px',
              position: 'relative'
            }}
          >
            {/* Document header */}
            <div style={{
              padding: '24px 32px',
              borderBottom: `2px solid ${activeDoc.color}`,
              background: `${activeDoc.color}08`,
              borderRadius: '12px 12px 0 0'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: `${activeDoc.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <activeDoc.icon size={28} color={activeDoc.color} />
                </div>
                <div>
                  <h2 style={{ 
                    fontSize: '1.75rem', 
                    fontWeight: '800', 
                    color: S.text,
                    marginBottom: '4px'
                  }}>
                    {activeDoc.title}
                  </h2>
                  <p style={{ 
                    fontSize: '0.9rem', 
                    color: S.textSub 
                  }}>
                    {activeDoc.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Document content */}
            <div style={{ padding: '32px' }}>
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '400px',
                      gap: '16px'
                    }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <FileText size={48} color={activeDoc.color} />
                    </motion.div>
                    <p style={{ color: S.textSub, fontSize: '0.95rem' }}>
                      Loading document...
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      color: S.text,
                      lineHeight: '1.8',
                      fontSize: '0.95rem'
                    }}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                    className="legal-content"
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Footer contact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            marginTop: '40px',
            padding: '24px',
            background: S.card,
            borderRadius: '12px',
            border: `1px solid ${S.border}`,
            textAlign: 'center'
          }}
        >
          <p style={{ color: S.text, marginBottom: '8px', fontWeight: '600' }}>
            Questions about these legal documents?
          </p>
          <p style={{ color: S.textSub, fontSize: '0.9rem' }}>
            Contact Palayan City ICT Office: <strong style={{ color: S.primary }}>ict@palayan.gov.ph</strong> | (044) XXX-XXXX
          </p>
        </motion.div>
      </div>

      {/* Scoped styles for markdown content */}
      <style>{`
        .legal-content h1 {
          font-size: 2rem;
          font-weight: 800;
          color: ${S.text};
          margin: 32px 0 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid ${activeDoc.color};
        }
        
        .legal-content h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: ${S.text};
          margin: 28px 0 12px;
        }
        
        .legal-content h3 {
          font-size: 1.2rem;
          font-weight: 600;
          color: ${S.text};
          margin: 20px 0 10px;
        }
        
        .legal-content p {
          margin: 12px 0;
          color: ${S.text};
        }
        
        .legal-content ul {
          margin: 12px 0;
          padding-left: 24px;
        }
        
        .legal-content li {
          margin: 6px 0;
          color: ${S.text};
        }
        
        .legal-content strong {
          font-weight: 600;
          color: ${activeDoc.color};
        }
        
        .legal-content a {
          color: ${activeDoc.color};
          text-decoration: none;
          font-weight: 500;
          border-bottom: 1px solid ${activeDoc.color}40;
          transition: border-color 0.2s;
        }
        
        .legal-content a:hover {
          border-bottom-color: ${activeDoc.color};
        }
        
        .legal-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 0.9rem;
        }
        
        .legal-content th {
          background: ${activeDoc.color}15;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          border: 1px solid ${S.border};
          color: ${S.text};
        }
        
        .legal-content td {
          padding: 10px 12px;
          border: 1px solid ${S.border};
          color: ${S.text};
        }
        
        .legal-content tr:hover {
          background: ${S.hover};
        }
      `}</style>
    </div>
  );
}

export default LegalScreen;
