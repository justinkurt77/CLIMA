import { Phone } from 'lucide-react';
import { useState, useEffect } from 'react';
import EmergencyContactsModal from './EmergencyContactsModal';

/**
 * FloatingContactButton - Circular emergency contact button
 * Opens emergency contacts modal with all Palayan City emergency services.
 * Positioned inside the app-shell container.
 */
export default function FloatingContactButton() {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleContact = () => {
    setIsModalOpen(true);
  };

  const baseStyle = {
    position: 'absolute',
    bottom: isMobile ? '82px' : '24px',
    right: isMobile ? '18px' : '24px',
    zIndex: 40,
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isHovered ? '#b91c1c' : '#dc2626',
    color: '#ffffff',
    border: '2px solid rgba(255, 255, 255, 0.25)',
    boxShadow: isHovered
      ? '0 12px 28px rgba(220, 38, 38, 0.65)'
      : '0 8px 22px rgba(220, 38, 38, 0.45)',
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isHovered ? 'scale(1.08)' : 'scale(1)',
  };

  return (
    <>
      <button
        onClick={handleContact}
        title="Emergency Hotlines"
        aria-label="Emergency Hotlines"
        style={baseStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Phone size={22} color="#ffffff" strokeWidth={2.2} />
      </button>

      <EmergencyContactsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}

