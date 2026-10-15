import { Phone } from 'lucide-react';
import { useState, useEffect } from 'react';
import EmergencyContactsModal from './EmergencyContactsModal';

/**
 * FloatingContactButton - Fixed emergency contact button
 * Opens emergency contacts modal with all Palayan City services
 */
export default function FloatingContactButton() {
  const [isHovered, setIsHovered] = useState(false);
  const [showText, setShowText] = useState(window.innerWidth >= 640);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setShowText(window.innerWidth >= 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleContact = () => {
    setIsModalOpen(true);
  };

  const baseStyle = {
    position: 'fixed',
    bottom: '140px',
    right: '24px',
    zIndex: 40,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: isHovered ? '#b91c1c' : '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '9999px',
    boxShadow: '0 10px 25px rgba(220, 38, 38, 0.4)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '14px',
    fontWeight: '600',
    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
  };

  return (
    <>
      <button
        onClick={handleContact}
        aria-label="Emergency Contacts"
        style={baseStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Phone style={{ width: '20px', height: '20px' }} />
        {showText && <span>Emergency</span>}
      </button>

      <EmergencyContactsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
