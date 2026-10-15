import { Phone } from 'lucide-react';
import { useState } from 'react';
import EmergencyContactsModal from './EmergencyContactsModal';

/**
 * FloatingContactButton - Circular emergency contact button
 * Opens emergency contacts modal with all Palayan City emergency services.
 * Positioned inside the app-shell container.
 */
export default function FloatingContactButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        title="Emergency Hotlines"
        aria-label="Emergency Hotlines"
        className="floating-contact-btn"
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

