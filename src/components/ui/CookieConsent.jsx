import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CookieConsent - Banner informing users about cookie usage
 * Complies with R.A. 10173 (Data Privacy Act of 2012)
 */
export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('clima-cookie-consent');
    if (!consent) {
      // Delay showing banner by 1 second after page load
      setTimeout(() => setIsVisible(true), 1000);
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
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 right-0 z-[9999] bg-white dark:bg-gray-800 border-t-2 border-green-600 dark:border-green-700 shadow-2xl"
        >
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Message */}
              <div className="flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  This site uses cookies to improve your experience and provide essential services. 
                  We comply with <strong>R.A. 10173 (Data Privacy Act of 2012)</strong>.{' '}
                  <a
                    href="/legal#privacy-policy"
                    className="text-green-600 dark:text-green-400 underline hover:text-green-800 dark:hover:text-green-300"
                    rel="noopener noreferrer"
                  >
                    Learn more
                  </a>
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 items-center flex-shrink-0">
                <button
                  onClick={handleDecline}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                >
                  Decline
                </button>
                <button
                  onClick={handleAccept}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
