import { motion, AnimatePresence } from 'framer-motion';
import { useCookieConsent } from '../../hooks/useCookieConsent';
import { Link } from './Link';

/**
 * Cookie consent banner (R.A. 10173 Data Privacy Act compliant)
 */
export function CookieBanner() {
  const { showBanner, acceptCookies, declineCookies } = useCookieConsent();

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t-2 border-green-600 shadow-lg p-4 md:p-6"
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 text-sm text-gray-700 dark:text-gray-300">
              <p className="font-semibold mb-1">Cookie Notice</p>
              <p>
                This website uses cookies to enhance your experience and analyze site usage in accordance with R.A. 10173 (Data Privacy Act of 2012).
                {' '}
                <Link href="/legal?section=privacy" className="text-green-600 hover:text-green-700 underline">
                  Learn more
                </Link>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={declineCookies}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
              >
                Decline
              </button>
              <button
                onClick={acceptCookies}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
              >
                Accept
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
