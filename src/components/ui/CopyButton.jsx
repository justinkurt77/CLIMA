import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * CopyButton - Button that copies text to clipboard
 * Shows brief "Copied!" confirmation
 * @param {string} text - Text to copy to clipboard
 * @param {string} label - Optional aria-label for accessibility
 */
export default function CopyButton({ text, label = 'Copy to clipboard' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
      aria-label={label}
      title={copied ? 'Copied!' : label}
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
      {copied && (
        <span className="text-xs font-medium text-green-600 dark:text-green-400">
          Copied!
        </span>
      )}
    </button>
  );
}
