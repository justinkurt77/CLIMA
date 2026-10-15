import { useState, useEffect } from 'react';

/**
 * Manage cookie consent state (R.A. 10173 / GDPR compliant)
 * @returns {{hasConsent: boolean, acceptCookies: function, declineCookies: function, showBanner: boolean}}
 */
export function useCookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (consent === null) {
      // No consent recorded, show banner
      setShowBanner(true);
    } else {
      setHasConsent(consent === 'accepted');
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setHasConsent(true);
    setShowBanner(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setHasConsent(false);
    setShowBanner(false);
  };

  return { hasConsent, acceptCookies, declineCookies, showBanner };
}
