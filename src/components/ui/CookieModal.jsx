import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';

/**
 * CookieModal - Full-screen modal for cookie consent
 * Blocks interaction until user accepts or declines
 * Complies with R.A. 10173 (Data Privacy Act of 2012)
 */
export default function CookieModal() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('clima-cookie-consent');
    if (!consent) {
      setTimeout(() => setIsVisible(true), 500);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('clima-cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('clima-cookie-consent', 'declined');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              zIndex: 99998,
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Modal slides up from bottom */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 99999,
              backgroundColor: 'white',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.2)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ padding: '32px 24px', maxWidth: '600px', margin: '0 auto' }}>
              {/* Icon & Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={24} color="#16a34a" />
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#09090b', margin: 0 }}>
                    Cookie & Privacy Notice
                  </h2>
                  <p style={{ fontSize: '13px', color: '#71717a', margin: '4px 0 0' }}>
                    R.A. 10173 Compliance
                  </p>
                </div>
              </div>

              {/* Message */}
              <div style={{ marginBottom: '24px', lineHeight: '1.6' }}>
                <p style={{ fontSize: '15px', color: '#3f3f46', marginBottom: '12px' }}>
                  CLIMA uses cookies to enhance your experience, remember preferences, and provide emergency services.
                </p>
                <p style={{ fontSize: '14px', color: '#52525b' }}>
                  We comply with <strong style={{ color: '#16a34a' }}>R.A. 10173 (Data Privacy Act of 2012)</strong>.{' '}
                  <a href="/legal#privacy-policy" style={{ color: '#16a34a', textDecoration: 'underline', fontWeight: '600' }}>Learn more</a>
                </p>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
                <button onClick={handleAccept} style={{ flex: 1, padding: '14px 24px', fontSize: '15px', fontWeight: '600', color: 'white', backgroundColor: '#16a34a', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
                  Accept & Continue
                </button>
                <button onClick={handleDecline} style={{ flex: 1, padding: '14px 24px', fontSize: '15px', fontWeight: '600', color: '#52525b', backgroundColor: '#f4f4f5', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
                  Decline
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
