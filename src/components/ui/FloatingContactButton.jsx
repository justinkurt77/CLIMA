import { Phone } from 'lucide-react';

/**
 * FloatingContactButton - Fixed emergency contact button
 * Provides quick access to emergency services
 */
export default function FloatingContactButton() {
  const handleContact = () => {
    // Emergency hotline for Palayan City (example - update with real number)
    // Or navigate to emergency screen
    window.location.href = 'tel:911';
  };

  return (
    <button
      onClick={handleContact}
      className="fixed bottom-32 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 animate-pulse-slow"
      aria-label="Emergency Contact"
      style={{
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }}
    >
      <Phone className="w-5 h-5" />
      <span className="font-semibold text-sm hidden sm:inline">Emergency</span>
    </button>
  );
}
