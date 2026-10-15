import { motion, AnimatePresence } from 'framer-motion';
import {
  Info,
  Shield,
  Cloud,
  MapPin,
  Database,
  Code,
  ExternalLink,
  Share2,
  FileText,
  Users,
  Award,
  Heart,
  Zap,
  Map,
  Bell,
  BarChart3,
  Thermometer,
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import './AboutScreen.css';

export default function AboutScreen() {
  const { isDark } = useTheme();
  const [showNPCBadge, setShowNPCBadge] = useState(false);

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

  const features = [
    { icon: Cloud, label: 'Real-time Weather', desc: 'KloudTech powered monitoring' },
    { icon: Map, label: 'Interactive Maps', desc: '11+ disaster layers' },
    { icon: Bell, label: 'Citizen Reports', desc: 'Photo upload system' },
    { icon: Users, label: 'Multi-Agency', desc: 'CDRRMO, BFP coordination' },
    { icon: Info, label: 'Emergency Hotlines', desc: 'Quick access directory' },
    { icon: BarChart3, label: 'El Niño Dashboard', desc: 'Impact monitoring' },
    { icon: Thermometer, label: 'Heat Index', desc: 'Live advisories' },
  ];

  const techStack = [
    { icon: Code, label: 'Frontend', value: 'React 18, Vite', color: '#61dafb' },
    { icon: Database, label: 'Backend', value: 'Supabase PostgreSQL', color: '#3ecf8e' },
    { icon: MapPin, label: 'Mapping', value: 'Mapbox GL JS', color: '#4264fb' },
    { icon: Cloud, label: 'Weather', value: 'KloudTech API', color: '#f59e0b' },
    { icon: Shield, label: 'Security', value: 'RLS + JWT Auth', color: '#ef4444' },
    { icon: Zap, label: 'Animation', value: 'Framer Motion', color: '#a855f7' },
  ];

  const agencies = [
    'CDRRMO Palayan',
    'Bureau of Fire Protection (BFP)',
    'City Agriculture Office',
    'City Water & Power Services',
    'City Health Office',
    'Palayan City Hospital',
  ];

  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 9999,
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg-app)',
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
          background: 'var(--bg-app)',
        }}
      >
        {/* Header Section with Logos */}
        <div
          style={{
            background: 'var(--bg-app)',
            padding: '40px 20px 32px',
            marginTop: 'env(safe-area-inset-top, 0px)',
            textAlign: 'center',
            boxShadow: isDark 
              ? '0 4px 16px rgba(0, 0, 0, 0.3)' 
              : '0 4px 16px rgba(0, 0, 0, 0.2)',
            position: 'relative',
            zIndex: 1,
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
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
              color: isDark ? '#ffffff' : '#09090b',
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
              color: isDark ? 'rgba(255, 255, 255, 0.9)' : '#18181b',
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
              color: isDark ? 'rgba(255, 255, 255, 0.75)' : '#52525b',
              margin: '8px 0 0',
            }}
          >
            Palayan City, Nueva Ecija, Philippines
          </p>

          {/* Version Badge */}
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 8 }}>
            <div
              style={{
                background: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                backdropFilter: 'blur(10px)',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(0, 0, 0, 0.12)',
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                color: isDark ? '#ffffff' : '#09090b',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>Version 1.0.0</span>
            </div>
          </div>

          {/* Share Button */}
          {navigator.share && (
            <button
              onClick={handleShare}
              style={{
                marginTop: 12,
                background: '#000000',
                backdropFilter: 'blur(10px)',
                border: '1px solid #000000',
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
            background: 'var(--bg-app)',
            position: 'relative',
            zIndex: 1,
            minHeight: '100vh',
          }}
        >
          {/* System Overview Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              background: 'var(--bg-card)',
              borderRadius: 16,
              padding: 20,
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Info size={20} color="#ffffff" strokeWidth={2.5} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                About CLIMA
              </h2>
            </div>
            <p style={{ ...textStyle, lineHeight: 1.7, marginBottom: 16 }}>
              CLIMA is a comprehensive disaster response and climate monitoring platform for
              Palayan City, Nueva Ecija, Philippines. The system enables real-time incident
              reporting, multi-agency coordination, and climate data visualization to enhance
              disaster preparedness and response capabilities.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <InfoPill label="Launch Date" value="TBA" />
              <InfoPill label="Service Area" value="19 Barangays" />
            </div>
          </motion.div>

          {/* Key Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{ marginBottom: 20 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Award size={20} strokeWidth={2.5} color="var(--text-primary)" />
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Key Features
              </h2>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 12,
              }}
            >
              {features.map((feature, idx) => (
                <FeatureCard key={idx} icon={feature.icon} label={feature.label} desc={feature.desc} delay={idx * 0.05} />
              ))}
            </div>
          </motion.div>

          {/* Technology Stack Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            style={{ marginBottom: 20 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Code size={20} strokeWidth={2.5} color="var(--text-primary)" />
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Technology Stack
              </h2>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 12,
              }}
            >
              {techStack.map((tech, idx) => (
                <TechCard key={idx} icon={tech.icon} label={tech.label} value={tech.value} color={tech.color} delay={idx * 0.05} />
              ))}
            </div>
          </motion.div>

          {/* KloudTech Acknowledgment Hero Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 16,
              padding: 24,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.25)',
              marginBottom: 20,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                filter: 'blur(40px)',
              }}
            />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Cloud size={24} color="#ffffff" strokeWidth={2.5} />
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', margin: 0 }}>
                  Powered by KloudTech
                </h2>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255, 255, 255, 0.95)', lineHeight: 1.7, marginBottom: 12 }}>
                We extend our deepest gratitude to{' '}
                <a
                  href="https://homepage.kloudtechsea.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#ffffff',
                    fontWeight: 800,
                    textDecoration: 'underline',
                    textDecorationColor: 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  KloudTech <ExternalLink size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </a>{' '}
                for providing real-time climate and weather data for Palayan City.
              </p>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.7, margin: 0 }}>
                Their telemetry infrastructure enables accurate monitoring of temperature, rainfall,
                humidity, and weather conditions critical for disaster preparedness. Without
                KloudTech's reliable climate monitoring, this disaster response platform would not be
                possible.
              </p>
            </div>
          </motion.div>

          {/* Development Team Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            style={{
              background: 'var(--bg-card)',
              borderRadius: 16,
              padding: 20,
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Users size={20} strokeWidth={2.5} color="var(--text-primary)" />
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Development Team
              </h2>
            </div>
            <div style={{
              background: 'var(--bg-card-subtle)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 14,
              border: '1px solid var(--border-subtle)',
            }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                ICT Division
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Palayan City Government
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
              Partner Agencies:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
              {agencies.map((agency, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 10,
                    padding: '10px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    textAlign: 'center',
                  }}
                >
                  {agency}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Legal & Privacy Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            style={{
              background: 'var(--bg-card)',
              borderRadius: 16,
              padding: 20,
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Shield size={20} strokeWidth={2.5} color="var(--text-primary)" />
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Legal & Privacy
              </h2>
            </div>
            <p style={{ ...textStyle, lineHeight: 1.7, marginBottom: 12 }}>
              CLIMA is compliant with Republic Act 10173 (Data Privacy Act of 2012). The City
              Government of Palayan is registered with the National Privacy Commission as a Data
              Protection Officer (DPO) and operates a compliant Data Processing System (DPS).
            </p>
            <div
              onClick={() => setShowNPCBadge(true)}
              style={{
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                padding: 12,
                marginBottom: 12,
                fontSize: 13,
                fontWeight: 800,
                color: 'var(--text-primary)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
                e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isDark ? 'var(--bg-card-subtle)' : 'var(--bg-card-subtle)';
                e.currentTarget.style.borderColor = isDark ? 'var(--border-subtle)' : 'var(--border-subtle)';
              }}
            >
              🇵🇭 Datos ng Pilipino, Protektado Ko! 👁️
            </div>

            {/* NPC Badge Modal */}
            <AnimatePresence>
              {showNPCBadge && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowNPCBadge(false)}
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
                    cursor: 'pointer',
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      maxWidth: '90vw',
                      maxHeight: '90vh',
                      position: 'relative',
                    }}
                  >
                    <img
                      src="/images/legal/npm-dpo-dps-badge.png"
                      alt="NPC DPO/DPS Compliance Badge"
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '90vh',
                        objectFit: 'contain',
                        borderRadius: 8,
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                      }}
                    />
                    <button
                      onClick={() => setShowNPCBadge(false)}
                      style={{
                        position: 'absolute',
                        top: -12,
                        right: -12,
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: '#ffffff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 20,
                        fontWeight: 700,
                        color: '#000000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                      }}
                    >
                      ×
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a
                href="#legal"
                onClick={(e) => { e.preventDefault(); window.location.hash = ''; setTimeout(() => window.location.pathname = '/legal', 10); }}
                style={{
                  flex: 1,
                  minWidth: 140,
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#2563eb',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Privacy Policy <ExternalLink size={12} />
              </a>
              <a
                href="#legal"
                onClick={(e) => { e.preventDefault(); window.location.hash = ''; setTimeout(() => window.location.pathname = '/legal', 10); }}
                style={{
                  flex: 1,
                  minWidth: 140,
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#2563eb',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Terms of Service <ExternalLink size={12} />
              </a>
            </div>
          </motion.div>

          {/* Open Source Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            style={{
              background: 'var(--bg-card)',
              borderRadius: 16,
              padding: 20,
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Code size={20} strokeWidth={2.5} color="var(--text-primary)" />
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Open Source
              </h2>
            </div>
            <p style={{ ...textStyle, lineHeight: 1.7 }}>
              CLIMA is built with open source technologies including React, Mapbox, Supabase,
              TailwindCSS, Framer Motion, Chart.js, Lucide React, React Query, and many other
              community-driven projects. We are grateful to all open source contributors.
            </p>
          </motion.div>

          {/* Contact Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            style={{
              background: 'var(--bg-card)',
              borderRadius: 16,
              padding: 20,
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Info size={20} strokeWidth={2.5} color="var(--text-primary)" />
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Contact & Support
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <ContactRow label="ICT Division" value="Palayan City Government" />
              <ContactRow label="Address" value="2nd Floor, City Hall, Brgy. Singalat" />
              <ContactRow label="Email" value="ict@palayancity.gov.ph" />
              <ContactRow label="Phone" value="09288038973" />
            </div>
            <div
              style={{
                marginTop: 16,
                padding: 12,
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                textAlign: 'center',
              }}
            >
              ⚠️ For emergencies, use the Emergency Hotlines button
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function FeatureCard({ icon: Icon, label, desc, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
      style={{
        background: 'var(--bg-card)',
        borderRadius: 16,
        padding: 16,
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        cursor: 'default',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: 'var(--bg-card-subtle)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={20} strokeWidth={2.5} color="var(--text-primary)" />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {desc}
        </div>
      </div>
    </motion.div>
  );
}

function TechCard({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
      style={{
        background: 'var(--bg-card)',
        borderRadius: 16,
        padding: 16,
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        cursor: 'default',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: `${color}15`,
          border: `1px solid ${color}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={20} strokeWidth={2.5} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>
          {value}
        </div>
      </div>
    </motion.div>
  );
}

function InfoPill({ label, value }) {
  return (
    <div
      style={{
        background: 'var(--bg-card-subtle)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 10,
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
        {label}:
      </span>
      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  );
}

function ContactRow({ label, value }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 14px',
        background: 'var(--bg-card-subtle)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 10,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', textAlign: 'right', flex: 1, marginLeft: 16 }}>
        {value}
      </span>
    </div>
  );
}

const textStyle = {
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--text-primary)',
  lineHeight: 1.6,
  margin: 0,
};
