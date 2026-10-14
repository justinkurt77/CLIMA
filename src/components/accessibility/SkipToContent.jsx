/**
 * SkipToContent - Accessibility component for keyboard navigation
 * Allows keyboard users to skip directly to main content
 * Hidden by default, only visible when focused via Tab key
 */

export default function SkipToContent() {
  const handleSkip = (e) => {
    e.preventDefault();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleSkip}
      className="absolute left-[-9999px] top-auto w-[1px] h-[1px] overflow-hidden focus:left-4 focus:top-4 focus:w-auto focus:h-auto focus:overflow-visible focus:z-[10000] focus:px-4 focus:py-2 focus:bg-green-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
    >
      Skip to main content
    </a>
  );
}
