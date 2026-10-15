import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '../../context/ThemeContext';

export default function LegalModal({ isOpen, onClose, title, contentUrl }) {
  const [content, setContent] = useState('Loading...');
  const { isDark } = useTheme();

  useEffect(() => {
    if (isOpen && contentUrl) {
      fetch(contentUrl)
        .then((res) => res.text())
        .then((text) => setContent(text))
        .catch(() => setContent('Failed to load content.'));
    }
  }, [isOpen, contentUrl]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 800,
            maxHeight: '85vh',
            background: isDark ? '#121214' : '#ffffff',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: isDark ? '#1a1a1c' : '#f9fafb',
            }}
          >
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: isDark ? '#ffffff' : '#09090b',
                margin: 0,
              }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
              }}
            >
              <X size={20} color={isDark ? '#ffffff' : '#09090b'} />
            </button>
          </div>

          {/* Content */}
          <div
            className="hide-scroll"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              color: isDark ? '#e4e4e7' : '#18181b',
              fontSize: 14,
              lineHeight: 1.7,
            }}
          >
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => (
                  <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16, marginTop: 0, color: isDark ? '#ffffff' : '#09090b' }} {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, marginTop: 32, color: isDark ? '#ffffff' : '#09090b' }} {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, marginTop: 24, color: isDark ? '#ffffff' : '#09090b' }} {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p style={{ marginBottom: 12 }} {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul style={{ marginLeft: 20, marginBottom: 12 }} {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol style={{ marginLeft: 20, marginBottom: 12 }} {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li style={{ marginBottom: 6 }} {...props} />
                ),
                strong: ({ node, ...props }) => (
                  <strong style={{ fontWeight: 700, color: isDark ? '#ffffff' : '#09090b' }} {...props} />
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
