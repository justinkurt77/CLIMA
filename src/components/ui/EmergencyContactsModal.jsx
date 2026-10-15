import { X, Phone, Shield, Flame, HeartPulse, Activity, Zap, CarFront } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * EmergencyContactsModal - Full-screen modal for emergency contacts
 * Triggered by FloatingContactButton
 */
export default function EmergencyContactsModal({ isOpen, onClose }) {
  const departments = [
    {
      name: "Palayan City CDRRMO",
      desc: "Disaster Risk Reduction",
      icon: Shield,
      numbers: ["09205741581", "09669109674"],
      display: ["(0920) 574 1581", "(0966) 910 9674"],
      urgency: "critical",
      available: "24/7",
    },
    {
      name: "Palayan BFP",
      desc: "Fire Protection",
      icon: Flame,
      numbers: ["09430669962"],
      display: ["0943 066 9962"],
      urgency: "critical",
      available: "24/7",
    },
    {
      name: "City Health Office",
      desc: "Health Emergencies",
      icon: HeartPulse,
      numbers: ["09171073808", "09209472735"],
      display: ["0917 107 3808", "0920 947 2735"],
      urgency: "urgent",
      available: "8AM-5PM",
    },
    {
      name: "City Hospital",
      desc: "Medical Emergencies",
      icon: Activity,
      numbers: ["09178018247"],
      display: ["0917 801 8247"],
      urgency: "critical",
      available: "24/7",
    },
    {
      name: "NEECO",
      desc: "Electrical Emergencies",
      icon: Zap,
      numbers: ["09328893447", "09328893348"],
      display: ["0932 889 3447", "0932 889 3348"],
      urgency: "standard",
      available: "24/7",
    },
    {
      name: "City Traffic",
      desc: "Traffic & Road Incidents",
      icon: CarFront,
      numbers: ["09958741014"],
      display: ["0995 874 1014"],
      urgency: "standard",
      available: "8AM-5PM",
    },
  ];

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return '#dc2626'; // red
      case 'urgent': return '#ea580c'; // orange
      case 'standard': return '#2563eb'; // blue
      default: return '#6b7280'; // gray
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 9998,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              maxHeight: '90vh',
              backgroundColor: 'var(--bg-base)',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.2)',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    margin: 0,
                    fontFamily: "'Baloo 2', cursive",
                  }}
                >
                  Emergency Hotlines
                </h2>
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    margin: '4px 0 0 0',
                    fontWeight: 600,
                  }}
                >
                  Palayan City Emergency Services
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <X size={20} strokeWidth={2.5} color="var(--text-primary)" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 24px 24px',
              }}
            >
              {departments.map((dept, i) => {
                const IconComponent = dept.icon;
                const urgencyColor = getUrgencyColor(dept.urgency);

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    }}
                  >
                    {/* Department Header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          backgroundColor: `${urgencyColor}15`,
                          border: `1px solid ${urgencyColor}30`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                          flexShrink: 0,
                        }}
                      >
                        <IconComponent size={22} strokeWidth={2.2} color={urgencyColor} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3
                          style={{
                            fontSize: 16,
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            margin: 0,
                            lineHeight: 1.2,
                          }}
                        >
                          {dept.name}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                          <span
                            style={{
                              fontSize: 12,
                              color: 'var(--text-secondary)',
                              fontWeight: 600,
                            }}
                          >
                            {dept.desc}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: urgencyColor,
                              backgroundColor: `${urgencyColor}15`,
                              padding: '2px 6px',
                              borderRadius: 6,
                            }}
                          >
                            {dept.available}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Phone Numbers */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {dept.numbers.map((num, j) => (
                        <a
                          key={j}
                          href={`tel:${num}`}
                          onClick={onClose}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'var(--bg-base)',
                            border: '1px solid var(--border-subtle)',
                            padding: '12px 14px',
                            borderRadius: 12,
                            textDecoration: 'none',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <span
                            style={{
                              fontSize: 15,
                              fontWeight: 800,
                              color: 'var(--text-primary)',
                              letterSpacing: '0.5px',
                            }}
                          >
                            {dept.display[j]}
                          </span>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              color: '#ffffff',
                              fontWeight: 800,
                              fontSize: 13,
                              backgroundColor: urgencyColor,
                              padding: '6px 12px',
                              borderRadius: 20,
                            }}
                          >
                            <span>Call</span>
                            <Phone size={14} strokeWidth={2.5} />
                          </div>
                        </a>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
