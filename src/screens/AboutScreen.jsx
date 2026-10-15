import { motion } from 'framer-motion';
import {
  Info,
  Shield,
  Cloud,
  MapPin,
  Database,
  Code,
  ExternalLink,
  Copy,
  Share2,
  FileText,
  Users,
  Award,
  Heart,
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import './AboutScreen.css';

export default function AboutScreen() {
  const [copied, setCopied] = useState(false);
  const { isDark } = useTheme();

  const copyVersion = () => {
    navigator.clipboard.writeText('1.0.0');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CLIMA - Palayan City',
          text: 'Climate & Local Incident Monitoring Application for Palayan City disaster response',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  const bgColor = isDark ? '#161922' : '#1a1d2e';
  const contentBg = isDark ? '#27272a' : '#f9fafb';

  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 9999,
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Nunito', -apple-system, sans-serif",
      }}
      className="about-screen-wrapper"
    >
      {/* Scrollable Content */}
      <div
        className="hide-scroll"
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          background: bgColor,
        }}
      >
        {/* Header Section with Logos */}
        <div
          style={{
            background: isDark ? '#161922' : '#1a1d2e',
            padding: '40px 20px 32px',
            marginTop: 'env(safe-area-inset-top, 0px)',
            textAlign: 'center',
            boxShadow: isDark 
              ? '0 4px 16px rgba(0, 0, 0, 0.3)' 
              : '0 4px 16px rgba(0, 0, 0, 0.2)',
            position: 'relative',
            zIndex: 1,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* Logos Row with single connected white background */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 20,
              background: '#ffffff',
              padding: '16px 28px',
              borderRadius: 60,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              marginBottom: 24,
            }}
          >
            {/* Palayan City Seal */}
            <img
              src="/images/legal/palayan-city-seal.png"
              alt="Palayan City"
              style={{
                width: 70,
                height: 70,
                objectFit: 'contain',
              }}
            />
            
            {/* CLIMA Logo - Larger */}
            <img
              src="/logo.webp"
              alt="CLIMA"
              style={{
                width: 90,
                height: 90,
                objectFit: 'contain',
              }}
            />
            
            {/* ICT Division Logo */}
            <img
              src="/images/legal/ict-division-logo.png"
              alt="ICT Division"
              style={{
                width: 70,
                height: 70,
                objectFit: 'contain',
              }}
            />
          </div>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: '#ffffff',
              margin: '0 0 8px',
              fontFamily: "'Baloo 2', cursive",
              letterSpacing: '-0.5px',
            }}
          >
            CLIMA
          </h1>
          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Climate & Local Incident Monitoring Application
          </p>
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.75)',
              margin: '8px 0 0',
            }}
          >
            Palayan City, Nueva Ecija, Philippines
          </p>

          {/* Version Badge */}
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 8 }}>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>Version 1.0.0</span>
              <button
                onClick={copyVersion}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Copy size={14} color="#ffffff" />
              </button>
            </div>
            {copied && (
              <motion.span
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  fontSize: 11,
                  color: '#ffffff',
                  fontWeight: 700,
                }}
              >
                Copied!
              </motion.span>
            )}
          </div>

          {/* Share Button */}
          {navigator.share && (
            <button
              onClick={handleShare}
              style={{
                marginTop: 12,
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 700,
                color: '#ffffff',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Share2 size={14} />
              <span>Share CLIMA</span>
            </button>
          )}
        </div>

        {/* Content Sections */}
        <div 
          style={{ 
            padding: '20px', 
            paddingBottom: '110px',
            background: bgColor,
            position: 'relative',
            zIndex: 1,
            minHeight: '100vh',
          }}
        >
          {/* System Overview */}
          <Section title="About CLIMA" icon={Info}>
            <p style={textStyle}>
              CLIMA is a comprehensive disaster response and climate monitoring platform for
              Palayan City, Nueva Ecija, Philippines. The system enables real-time incident
              reporting, multi-agency coordination, and climate data visualization to enhance
              disaster preparedness and response capabilities.
            </p>
            <p style={{ ...textStyle, marginTop: 12 }}>
              <strong>Launch Date:</strong> TBA<br />
              <strong>Service Area:</strong> 19 Barangays of Palayan City
            </p>
          </Section>

          {/* Key Features */}
          <Section title="Key Features" icon={Award}>
            <FeatureList>
              <Feature>Real-time weather monitoring powered by KloudTech</Feature>
              <Feature>Interactive disaster mapping with 11+ layers</Feature>
              <Feature>Citizen reporting system with photo uploads</Feature>
              <Feature>Multi-department coordination (CDRRMO, BFP, Agriculture, Water, Power)</Feature>
              <Feature>Emergency hotlines directory</Feature>
              <Feature>El Nino impact monitoring dashboard</Feature>
              <Feature>Heat index tracking and advisories</Feature>
              <Feature>Dark mode support</Feature>
            </FeatureList>
          </Section>

          {/* Technology Stack */}
          <Section title="Technology Stack" icon={Code}>
            <TechRow icon={<Code size={16} />} label="Frontend" value="React 18, Vite, TailwindCSS" />
            <TechRow icon={<Database size={16} />} label="Backend" value="Supabase (PostgreSQL + Auth + Storage)" />
            <TechRow icon={<MapPin size={16} />} label="Mapping" value="Mapbox GL JS" />
            <TechRow icon={<Cloud size={16} />} label="Weather Data" value="KloudTech Climate API" />
            <TechRow icon={<Shield size={16} />} label="Security" value="Row-Level Security, JWT Auth" />
          </Section>

          {/* Acknowledgments - KloudTech */}
          <Section title="Powered by KloudTech" icon={Cloud}>
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <p style={textStyle}>
                We extend our deepest gratitude to{' '}
                <a
                  href="https://homepage.kloudtechsea.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#2563eb',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  KloudTech <ExternalLink size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </a>{' '}
                for providing real-time climate and weather data for Palayan City.
              </p>
              <p style={{ ...textStyle, marginTop: 12 }}>
                Their telemetry infrastructure enables accurate monitoring of temperature, rainfall,
                humidity, and weather conditions critical for disaster preparedness. Without
                KloudTech's reliable climate monitoring, this disaster response platform would not be
                possible.
              </p>
            </div>
          </Section>

          {/* Acknowledgments - PalaSumbong */}
          <Section title="Built on PalaSumbong" icon={Heart}>
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <p style={textStyle}>
                CLIMA stands on the shoulders of{' '}
                <strong style={{ color: 'var(--text-primary)' }}>PalaSumbong</strong>, a proven
                citizen reporting and engagement platform that served as the foundation of this project.
              </p>
              <p style={{ ...textStyle, marginTop: 12 }}>
                By leveraging PalaSumbong's robust architecture, we:
              </p>
              <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                <li style={{ ...textStyle, marginBottom: 6 }}>Cut development time by 60%</li>
                <li style={{ ...textStyle, marginBottom: 6 }}>Inherited battle-tested citizen reporting features</li>
                <li style={{ ...textStyle, marginBottom: 6 }}>Utilized existing government integrations</li>
                <li style={{ ...textStyle, marginBottom: 6 }}>Built on a stable, proven codebase</li>
              </ul>
              <p style={{ ...textStyle, marginTop: 12 }}>
                PalaSumbong's citizen-first design philosophy enabled us to focus our efforts on
                climate-specific features and multi-agency coordination rather than rebuilding core
                infrastructure from scratch.
              </p>
            </div>
          </Section>

          {/* Development Team */}
          <Section title="Development Team" icon={Users}>
            <TechRow label="ICT Division" value="Palayan City Government" />
            <div style={{ marginTop: 12 }}>
              <p style={{ ...textStyle, fontWeight: 700, marginBottom: 8 }}>Partner Agencies:</p>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li style={textStyle}>CDRRMO Palayan</li>
                <li style={textStyle}>Bureau of Fire Protection (BFP)</li>
                <li style={textStyle}>City Agriculture Office</li>
                <li style={textStyle}>City Water & Power Services</li>
                <li style={textStyle}>City Health Office</li>
                <li style={textStyle}>Palayan City Hospital</li>
              </ul>
            </div>
          </Section>

          {/* Legal & Privacy */}
          <Section title="Legal & Privacy" icon={FileText}>
            <p style={textStyle}>
              CLIMA is compliant with Republic Act 10173 (Data Privacy Act of 2012). The City
              Government of Palayan is registered with the National Privacy Commission as a Data
              Protection Officer (DPO) and operates a compliant Data Processing System (DPS).
            </p>
            <p style={{ ...textStyle, marginTop: 12 }}>
              <strong>Datos ng Pilipino, Protektado Ko!</strong>
            </p>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <a
                href="#legal"
                onClick={(e) => { e.preventDefault(); window.location.hash = ''; setTimeout(() => window.location.pathname = '/legal', 10); }}
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#2563eb',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                Privacy Policy <ExternalLink size={12} />
              </a>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>•</span>
              <a
                href="#legal"
                onClick={(e) => { e.preventDefault(); window.location.hash = ''; setTimeout(() => window.location.pathname = '/legal', 10); }}
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#2563eb',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                Terms of Service <ExternalLink size={12} />
              </a>
            </div>
          </Section>

          {/* Open Source */}
          <Section title="Open Source Libraries" icon={Code}>
            <p style={textStyle}>
              CLIMA is built with open source technologies including React, Mapbox, Supabase,
              TailwindCSS, Framer Motion, Chart.js, Lucide React, React Query, and many other
              community-driven projects. We are grateful to all open source contributors.
            </p>
          </Section>

          {/* Contact */}
          <Section title="Contact & Support" icon={Info}>
            <TechRow label="ICT Division" value="Palayan City Government" />
            <TechRow label="Address" value="2nd Floor, City Hall, Brgy. Singalat" />
            <TechRow label="Email" value="ict@palayancity.gov.ph" />
            <TechRow label="Phone" value="(044) 940-1234" />
            <p style={{ ...textStyle, marginTop: 12, fontWeight: 700 }}>
              For emergencies, use the Emergency Hotlines button at the bottom-right of the screen.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function Section({ title, icon: Icon, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        marginBottom: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <Icon size={20} strokeWidth={2.5} color="var(--text-primary)" />
        <h2
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: 'var(--text-primary)',
            margin: 0,
            fontFamily: "'Baloo 2', cursive",
          }}
        >
          {title}
        </h2>
      </div>
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 16,
          padding: 16,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}

function TechRow({ icon, label, value }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon && <span style={{ color: 'var(--text-secondary)' }}>{icon}</span>}
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-secondary)',
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--text-primary)',
          textAlign: 'right',
          flex: 1,
          marginLeft: 16,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function FeatureList({ children }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {children}
    </ul>
  );
}

function Feature({ children }) {
  return (
    <li
      style={{
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--text-primary)',
        lineHeight: 1.5,
      }}
    >
      {children}
    </li>
  );
}

const textStyle = {
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--text-primary)',
  lineHeight: 1.6,
  margin: 0,
};
