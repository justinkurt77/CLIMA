<<<<<<< HEAD
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
=======
import { motion, AnimatePresence } from 'framer-motion';
>>>>>>> 09d1b26de69ea9879ec6e7c865890a199ff45dca
import {
  Info,
  Shield,
  Cloud,
  MapPin,
  Database,
  Code,
  ExternalLink,
  Share2,
  Users,
  Award,
  Zap,
  Map,
  Bell,
  BarChart3,
  Thermometer,
  ChevronDown,
  Check,
  ArrowUp,
  Radio,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import LegalModal from '../components/ui/LegalModal';
import './AboutScreen.css';

// Reusable ParallaxSection Component - Based on motion.dev/examples/react-parallax
function ParallaxSection({
  id,
  title,
  subtitle,
  image = null,
  imageSpeed = 0.35,
  bgPosition = 'center center',
  index = 0,
  isFirst = false,
  isLast = false,
  containerRef,
  children,
}) {
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    container: containerRef,
    offset: ['start end', 'end start'],
  });

  // Background parallax movement
  const i = imageSpeed * 25; // ~8.75% travel
  const y = useTransform(scrollYProgress, [0, 1], [`-${i}%`, `${i}%`]);

  // Opacity & content vertical translation
  let opacityRange = [0.12, 0.35, 0.65, 0.88];
  let opacityOutput = [0, 1, 1, 0];
  let yOutput = [35, 0, 0, -35];

  if (isFirst) {
    opacityRange = [0, 0.65, 0.88];
    opacityOutput = [1, 1, 0];
    yOutput = [0, 0, -35];
  } else if (isLast) {
    opacityRange = [0.12, 0.35, 1];
    opacityOutput = [0, 1, 1];
    yOutput = [35, 0, 0];
  }

  const opacity = useTransform(scrollYProgress, opacityRange, opacityOutput);
  const contentY = useTransform(scrollYProgress, opacityRange, yOutput);

  return (
    <section
      ref={sectionRef}
      id={id}
      className={`parallax-section ${!image ? 'parallax-section-dark' : ''}`}
    >
      {/* Parallax Background - only appears on slide when image is provided */}
      {image && (
        <>
          <motion.div className="parallax-bg" style={{ y }}>
            <img
              src={image}
              alt={title}
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
              style={{ objectPosition: bgPosition }}
            />
          </motion.div>
          <div className="parallax-overlay" />
        </>
      )}

      {/* Foreground Content */}
      <motion.div
        className="parallax-content"
        style={{ opacity, y: contentY }}
      >
        <h2 className="impact parallax-title">{title}</h2>
        {subtitle && <p className="parallax-subtitle">{subtitle}</p>}
        {children}
      </motion.div>
    </section>
  );
}

export default function AboutScreen() {
  const { isDark } = useTheme();
  const containerRef = useRef(null);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [showNPCBadge, setShowNPCBadge] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const sections = [
    { id: 'hero', label: 'CLIMA' },
    { id: 'mission', label: 'About' },
    { id: 'features', label: 'Features' },
    { id: 'kloudtech', label: 'KloudTech' },
    { id: 'tech', label: 'Tech Stack' },
    { id: 'partners', label: 'Partners' },
    { id: 'legal', label: 'Privacy' },
  ];

  // Track active section for dot navigation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollPos = container.scrollTop;
      const height = container.clientHeight || window.innerHeight;
      const idx = Math.min(
        sections.length - 1,
        Math.max(0, Math.round(scrollPos / height))
      );
      setActiveSectionIdx(idx);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [sections.length]);

  const scrollToSection = (idx) => {
    const container = containerRef.current;
    if (!container) return;
    const targetSection = container.querySelector(`#${sections[idx].id}`);
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth' });
    }
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
        // Share cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2000);
      } catch (err) {
        // Clipboard write failed
      }
    }
  };

  const features = [
    {
      icon: Cloud,
      title: 'Real-time Weather',
      desc: 'KloudTech telemetry with microclimate rain forecasting',
      color: '#38bdf8',
    },
    {
      icon: Map,
      title: 'Interactive GIS',
      desc: '11+ disaster layers: flood zones, heat index, and evacuation sites',
      color: '#4ade80',
    },
    {
      icon: Bell,
      title: 'Citizen Reports',
      desc: 'Geotagged incident reporting with live photo evidence',
      color: '#f97316',
    },
    {
      icon: Users,
      title: 'Multi-Agency Dispatch',
      desc: 'Synchronized coordination across CDRRMO, BFP, and local units',
      color: '#a855f7',
    },
    {
      icon: BarChart3,
      title: 'El Niño Tracker',
      desc: 'Drought severity & agricultural climate impact monitoring',
      color: '#eab308',
    },
    {
      icon: Thermometer,
      title: 'Heat Index Alerts',
      desc: 'Live threshold monitoring with automated public advisories',
      color: '#ef4444',
    },
  ];

<<<<<<< HEAD
  const techStack = [
    { icon: Code, label: 'Frontend', value: 'React 18 & Vite', color: '#61dafb' },
    { icon: Database, label: 'Database', value: 'Supabase PostgreSQL', color: '#3ecf8e' },
    { icon: MapPin, label: 'Mapping', value: 'Mapbox GL JS GIS', color: '#4264fb' },
    { icon: Radio, label: 'Telemetry', value: 'KloudTech Weather API', color: '#f59e0b' },
    { icon: Shield, label: 'Security', value: 'Row-Level Security & JWT', color: '#ef4444' },
    { icon: Zap, label: 'Animation', value: 'Framer Motion 12', color: '#a855f7' },
  ];
=======
>>>>>>> 09d1b26de69ea9879ec6e7c865890a199ff45dca

  const agencies = [
    'CDRRMO Palayan',
    'Bureau of Fire Protection (BFP)',
    'City Agriculture Office',
    'City Water & Power Services',
    'City Health Office',
    'Palayan City Hospital',
  ];

  return (
    <div className="about-screen-wrapper">
      {/* Scrollable Viewport */}
      <div ref={containerRef} className="about-scroll-viewport hide-scroll">
        <div className="parallax-page">
          {/* ───────────────────────────────────────────────────────────── */}
          {/* SECTION 1: HERO                                              */}
          {/* ───────────────────────────────────────────────────────────── */}
          <ParallaxSection
            id="hero"
            title="CLIMA"
            subtitle="Climate & Local Incident Monitoring Application"
            image="/images/legal/clima-bg.png"
            bgPosition="center 20%"
            index={0}
            isFirst={true}
            containerRef={containerRef}
          >
            {/* Connected Logos Badge */}
            <div className="parallax-logos-pill">
              <img
                src="/images/legal/palayan-city-seal.png"
                alt="Palayan City Seal"
                style={{ width: 64, height: 64, objectFit: 'contain' }}
              />
              <img
                src="/logo.webp"
                alt="CLIMA Logo"
                style={{ width: 84, height: 84, objectFit: 'contain' }}
              />
              <img
                src="/images/legal/ict-division-logo.png"
                alt="ICT Division Logo"
                style={{ width: 64, height: 64, objectFit: 'contain' }}
              />
            </div>

            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: isDark ? 'rgba(255, 255, 255, 0.95)' : '#18181b',
                marginBottom: 16,
                letterSpacing: '0.04em',
                textShadow: isDark ? '0 2px 8px rgba(0,0,0,0.8)' : 'none',
              }}
            >
              Palayan City, Nueva Ecija, Philippines
            </div>

            {/* Version & Share Badges */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  background: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
                  backdropFilter: 'blur(12px)',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(0, 0, 0, 0.12)',
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 800,
                  color: isDark ? '#ffffff' : '#09090b',
                }}
              >
                Version 1.0.0
              </div>

              <button
                onClick={handleShare}
                style={{
                  background: copiedShare
                    ? '#16a34a'
                    : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  border: 'none',
                  padding: '7px 18px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 16px rgba(249, 115, 22, 0.4)',
                  transition: 'all 0.2s ease',
                }}
              >
                {copiedShare ? <Check size={14} /> : <Share2 size={14} />}
                <span>{copiedShare ? 'Link Copied!' : 'Share CLIMA'}</span>
              </button>
            </div>

            {/* Bouncing Scroll Cue */}
            <div
              onClick={() => scrollToSection(1)}
              className="parallax-scroll-indicator"
            >
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
              >
                <ChevronDown size={22} color="#f97316" />
              </motion.div>
              <span>Scroll to Explore</span>
            </div>
          </ParallaxSection>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* SECTION 2: MISSION & OVERVIEW                                */}
          {/* ───────────────────────────────────────────────────────────── */}
          <ParallaxSection
            id="mission"
            title="ABOUT CLIMA"
            subtitle="Palayan City Disaster Resilience & Climate Safety"
            index={1}
            containerRef={containerRef}
          >
            <div className="parallax-glass-card">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 16,
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 20px rgba(249, 115, 22, 0.35)',
                  }}
                >
                  <Info size={22} color="#ffffff" strokeWidth={2.5} />
                </div>
                <h3
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: isDark ? '#ffffff' : '#09090b',
                    margin: 0,
                    letterSpacing: '-0.3px',
                  }}
                >
                  Empowering Community Resilience
                </h3>
              </div>

              <p
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  lineHeight: 1.7,
                  color: isDark ? 'rgba(255, 255, 255, 0.92)' : '#27272a',
                  marginBottom: 20,
                  maxWidth: 720,
                  marginInline: 'auto',
                }}
              >
                CLIMA is a unified climate intelligence and disaster response platform built for
                Palayan City, Nueva Ecija, Philippines. By combining real-time meteorological
                sensor telemetry, spatial GIS mapping, citizen incident reporting, and multi-agency
                dispatch, CLIMA empowers city leadership and citizens to act swiftly before, during,
                and after climate emergencies.
              </p>

<<<<<<< HEAD
              {/* Stat Highlights */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f4f4f6',
                    borderRadius: 14,
                    padding: '12px 16px',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#f97316', textTransform: 'uppercase' }}>
                    Service Coverage
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: isDark ? '#ffffff' : '#09090b', marginTop: 2 }}>
                    19 Barangays
                  </div>
                </div>
=======
>>>>>>> 09d1b26de69ea9879ec6e7c865890a199ff45dca

                <div
                  style={{
                    background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f4f4f6',
                    borderRadius: 14,
                    padding: '12px 16px',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                    Telemetry Source
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: isDark ? '#ffffff' : '#09090b', marginTop: 2 }}>
                    KloudTech Sensors
                  </div>
                </div>

                <div
                  style={{
                    background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f4f4f6',
                    borderRadius: 14,
                    padding: '12px 16px',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase' }}>
                    Readiness
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: isDark ? '#ffffff' : '#09090b', marginTop: 2 }}>
                    24/7 Operations
                  </div>
                </div>
              </div>
            </div>
          </ParallaxSection>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* SECTION 3: KEY CAPABILITIES                                  */}
          {/* ───────────────────────────────────────────────────────────── */}
          <ParallaxSection
            id="features"
            title="CAPABILITIES"
            subtitle="Comprehensive Monitoring & Early Warning Suite"
            index={2}
            containerRef={containerRef}
          >
            <div className="parallax-features-grid">
              {features.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div key={idx} className="parallax-feature-chip">
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: `${feat.color}20`,
                        border: `1px solid ${feat.color}40`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={20} color={feat.color} strokeWidth={2.4} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: isDark ? '#ffffff' : '#09090b',
                          marginBottom: 3,
                        }}
                      >
                        {feat.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: isDark ? 'rgba(255, 255, 255, 0.75)' : '#52525b',
                          lineHeight: 1.45,
                        }}
                      >
                        {feat.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ParallaxSection>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* SECTION 4: KLOUDTECH PARTNERSHIP                             */}
          {/* ───────────────────────────────────────────────────────────── */}
          <ParallaxSection
            id="kloudtech"
            title="KLOUDTECH"
            subtitle="Meteorological Telemetry & Sensor Infrastructure"
            index={3}
            containerRef={containerRef}
          >
            <div className="parallax-kloudtech-card">
              <div className="parallax-glow-circle" />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      background: 'rgba(255, 255, 255, 0.18)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    <Cloud size={24} color="#ffffff" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', margin: 0 }}>
                      Powered by KloudTech
                    </h3>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255, 255, 255, 0.9)' }}>
                      Official Climate Intelligence Partner
                    </div>
                  </div>
                </div>

                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.95)',
                    lineHeight: 1.7,
                    marginBottom: 14,
                  }}
                >
                  We extend our deepest gratitude to{' '}
                  <strong style={{ color: '#ffffff' }}>KloudTech SEA</strong> for providing live
                  meteorological data and sensor infrastructure for Palayan City.
                </p>

                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: 'rgba(255, 255, 255, 0.9)',
                    lineHeight: 1.7,
                    marginBottom: 20,
                  }}
                >
                  Their automated weather telemetry stations enable high-resolution monitoring of
                  temperature, humidity, atmospheric pressure, rainfall volume, and wind vectors.
                  Without KloudTech’s reliable telemetry, our proactive disaster response and early
                  heat advisories would not be possible.
                </p>

                <a
                  href="https://homepage.kloudtechsea.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#ffffff',
                    color: '#4338ca',
                    padding: '10px 20px',
                    borderRadius: 30,
                    fontSize: 13,
                    fontWeight: 800,
                    textDecoration: 'none',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.25)';
                  }}
                >
                  <span>Visit KloudTech SEA</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </ParallaxSection>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* SECTION 5: TECH STACK                                        */}
          {/* ───────────────────────────────────────────────────────────── */}
          <ParallaxSection
            id="tech"
            title="TECH STACK"
            subtitle="Engineered for Mission-Critical Reliability"
            index={4}
            containerRef={containerRef}
          >
            <div className="parallax-tech-grid">
              {techStack.map((tech, idx) => {
                const Icon = tech.icon;
                return (
                  <div key={idx} className="parallax-tech-card">
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: `${tech.color}20`,
                        border: `1px solid ${tech.color}40`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
<<<<<<< HEAD
                      <Icon size={22} color={tech.color} strokeWidth={2.4} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#71717a',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {tech.label}
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: isDark ? '#ffffff' : '#09090b',
                          marginTop: 2,
                        }}
                      >
                        {tech.value}
                      </div>
                    </div>
                  </div>
                );
              })}
=======
                      ×
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a
                href="#legal"
                onClick={(e) => { e.preventDefault(); setShowPrivacyPolicy(true); }}
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
                onClick={(e) => { e.preventDefault(); setShowTermsOfService(true); }}
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
>>>>>>> 09d1b26de69ea9879ec6e7c865890a199ff45dca
            </div>

<<<<<<< HEAD
            {/* Open Source Acknowledgement Pill */}
=======
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
>>>>>>> 09d1b26de69ea9879ec6e7c865890a199ff45dca
            <div
              style={{
                marginTop: 20,
                background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f4f4f6',
                backdropFilter: 'blur(12px)',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: 16,
                padding: '12px 24px',
                maxWidth: 820,
                fontSize: 13,
                fontWeight: 600,
                color: isDark ? 'rgba(255, 255, 255, 0.85)' : '#27272a',
                lineHeight: 1.6,
              }}
            >
              ❤️ Built on open-source foundations including React, Framer Motion, Mapbox GL, Lucide
              Icons, and PostgreSQL. We are deeply grateful to the open-source community.
            </div>
          </ParallaxSection>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* SECTION 6: PARTNER AGENCIES                                  */}
          {/* ───────────────────────────────────────────────────────────── */}
          <ParallaxSection
            id="partners"
            title="PARTNERS"
            subtitle="Palayan City Government & First Responders"
            index={5}
            containerRef={containerRef}
          >
            <div className="parallax-glass-card">
              {/* Lead Division */}
              <div
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(234, 88, 12, 0.15) 100%)'
                    : 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(234, 88, 12, 0.06) 100%)',
                  border: isDark ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid rgba(249, 115, 22, 0.25)',
                  borderRadius: 16,
                  padding: '16px 20px',
                  marginBottom: 18,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: '#f97316',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Users size={22} color="#ffffff" strokeWidth={2.4} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: isDark ? '#ffffff' : '#09090b' }}>
                    Information & Communications Technology (ICT) Division
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#52525b' }}>
                    City Government of Palayan • System Development & Engineering
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: isDark ? 'rgba(255, 255, 255, 0.85)' : '#27272a',
                  marginBottom: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  textAlign: 'left',
                }}
              >
                Coordinating City Agencies & Public Safety Units:
              </div>

              {/* Agencies Grid */}
              <div className="parallax-agencies-grid">
                {agencies.map((agency, idx) => (
                  <div key={idx} className="parallax-agency-chip">
                    {agency}
                  </div>
                ))}
              </div>
            </div>
          </ParallaxSection>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* SECTION 7: DATA PRIVACY & COMPLIANCE                         */}
          {/* ───────────────────────────────────────────────────────────── */}
          <ParallaxSection
            id="legal"
            title="GOVERNANCE"
            subtitle="Republic Act 10173 • National Privacy Commission Registered"
            index={6}
            isLast={true}
            containerRef={containerRef}
          >
            <div className="parallax-glass-card">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 14,
                  justifyContent: 'center',
                }}
              >
                <Shield size={22} color="#38bdf8" strokeWidth={2.5} />
                <h3 style={{ fontSize: 20, fontWeight: 800, color: isDark ? '#ffffff' : '#09090b', margin: 0 }}>
                  Data Privacy & Protection
                </h3>
              </div>

              <p
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: isDark ? 'rgba(255, 255, 255, 0.9)' : '#27272a',
                  lineHeight: 1.65,
                  marginBottom: 16,
                  maxWidth: 680,
                  marginInline: 'auto',
                }}
              >
                CLIMA strictly adheres to Republic Act 10173 (Data Privacy Act of 2012). The City
                Government of Palayan is formally registered with the National Privacy Commission as
                a Data Protection Officer (DPO) and operates a verified Data Processing System (DPS).
              </p>

              {/* Interactive NPC Compliance Badge Banner */}
              <button
                onClick={() => setShowNPCBadge(true)}
                style={{
                  width: '100%',
                  background: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(56, 189, 248, 0.12)',
                  border: isDark ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: 14,
                  padding: '12px 18px',
                  marginBottom: 16,
                  fontSize: 14,
                  fontWeight: 800,
                  color: isDark ? '#ffffff' : '#0284c7',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(56, 189, 248, 0.28)' : 'rgba(56, 189, 248, 0.22)';
                  e.currentTarget.style.borderColor = isDark ? 'rgba(56, 189, 248, 0.7)' : '#0284c7';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(56, 189, 248, 0.12)';
                  e.currentTarget.style.borderColor = isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(56, 189, 248, 0.35)';
                }}
              >
                <span>🇵🇭 Datos ng Pilipino, Protektado Ko! 👁️</span>
                <span style={{ fontSize: 11, opacity: 0.8 }}>(View NPC Seal)</span>
              </button>

              {/* Legal Modals Action Row */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
                <button
                  onClick={() => setShowPrivacyPolicy(true)}
                  style={{
                    flex: 1,
                    minWidth: 140,
                    background: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f4f4f6',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.12)',
                    borderRadius: 12,
                    padding: '10px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    color: isDark ? '#ffffff' : '#09090b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.2)' : '#e4e4e7')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.1)' : '#f4f4f6')}
                >
                  <span>Privacy Policy</span>
                  <ExternalLink size={12} />
                </button>

                <button
                  onClick={() => setShowTermsOfService(true)}
                  style={{
                    flex: 1,
                    minWidth: 140,
                    background: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f4f4f6',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.12)',
                    borderRadius: 12,
                    padding: '10px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    color: isDark ? '#ffffff' : '#09090b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.2)' : '#e4e4e7')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.1)' : '#f4f4f6')}
                >
                  <span>Terms of Service</span>
                  <ExternalLink size={12} />
                </button>
              </div>

              {/* City Hall Contact */}
              <div
                style={{
                  padding: '12px 16px',
                  background: isDark ? 'rgba(0, 0, 0, 0.45)' : '#f4f4f6',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                  borderRadius: 14,
                  fontSize: 12,
                  fontWeight: 600,
                  color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#27272a',
                  lineHeight: 1.6,
                }}
              >
                📍 2nd Floor, City Hall, Brgy. Singalat, Palayan City • ✉️ ict@palayancity.gov.ph • 📞 09288038973
                <div style={{ marginTop: 4, color: '#f97316', fontWeight: 700 }}>
                  ⚠️ In active emergencies, dial the Hotline button directly from the main dashboard.
                </div>
              </div>
            </div>
          </ParallaxSection>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* FLOATING VERTICAL DOT NAVIGATION                              */}
      {/* ───────────────────────────────────────────────────────────── */}
      <nav className="parallax-dot-nav" aria-label="About page section navigation">
        {sections.map((sec, idx) => (
          <button
            key={sec.id}
            onClick={() => scrollToSection(idx)}
            className={`parallax-dot-btn ${activeSectionIdx === idx ? 'active' : ''}`}
            title={sec.label}
            aria-label={`Jump to ${sec.label}`}
          />
        ))}
      </nav>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* BACK TO TOP BUTTON (Appears when scrolled down)               */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeSectionIdx > 0 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => scrollToSection(0)}
          style={{
            position: 'absolute',
            left: '24px',
            bottom: '24px',
            zIndex: 60,
            background: isDark ? 'rgba(18, 18, 18, 0.9)' : '#ffffff',
            backdropFilter: 'blur(12px)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.14)',
            borderRadius: '50%',
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDark ? '#ffffff' : '#09090b',
            cursor: 'pointer',
            boxShadow: isDark ? '0 8px 24px rgba(0, 0, 0, 0.6)' : '0 8px 24px rgba(0, 0, 0, 0.12)',
          }}
          title="Back to Top"
        >
          <ArrowUp size={20} />
        </motion.button>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODALS                                                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      {/* Privacy Policy Modal */}
      <LegalModal
        isOpen={showPrivacyPolicy}
        onClose={() => setShowPrivacyPolicy(false)}
        title="Privacy Policy"
        contentUrl="/legal/privacy-policy.md"
      />

      {/* Terms of Service Modal */}
      <LegalModal
        isOpen={showTermsOfService}
        onClose={() => setShowTermsOfService(false)}
        title="Terms of Service"
        contentUrl="/legal/terms-of-service.md"
      />

      {/* NPC Seal Fullscreen Modal */}
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
              background: 'rgba(0, 0, 0, 0.88)',
              backdropFilter: 'blur(12px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              cursor: 'pointer',
            }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '90vw',
                maxHeight: '90vh',
                position: 'relative',
              }}
            >
              <img
                src="/images/legal/npm-dpo-dps-badge.png"
                alt="National Privacy Commission DPO / DPS Compliance Badge"
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '88vh',
                  objectFit: 'contain',
                  borderRadius: 12,
                  boxShadow: '0 25px 70px rgba(0, 0, 0, 0.8)',
                }}
              />
              <button
                onClick={() => setShowNPCBadge(false)}
                style={{
                  position: 'absolute',
                  top: -14,
                  right: -14,
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                }}
                aria-label="Close"
              >
                ×
              </button>
            </motion.div>
          </motion.div>
<<<<<<< HEAD
        )}
      </AnimatePresence>
    </div>
  );
}
=======
        </div>
      </div>

      {/* Legal Modals */}
      <LegalModal
        isOpen={showPrivacyPolicy}
        onClose={() => setShowPrivacyPolicy(false)}
        title="Privacy Policy"
        contentUrl="/legal/privacy-policy.md"
      />
      <LegalModal
        isOpen={showTermsOfService}
        onClose={() => setShowTermsOfService(false)}
        title="Terms of Service"
        contentUrl="/legal/terms-of-service.md"
      />
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
>>>>>>> 09d1b26de69ea9879ec6e7c865890a199ff45dca
