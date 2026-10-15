import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * FAQSection - Accordion component for frequently asked questions
 * @param {Array} items - Array of FAQ objects with { id, question, answer }
 */
export default function FAQSection({ items = [] }) {
  const [openId, setOpenId] = useState(null);

  const toggleItem = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden"
        >
          {/* Question Button */}
          <button
            onClick={() => toggleItem(item.id)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
            aria-expanded={openId === item.id}
          >
            <span className="font-semibold text-gray-900 dark:text-white pr-4">
              {item.question}
            </span>
            <ChevronDown
              className={`w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                openId === item.id ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Answer Content */}
          <AnimatePresence initial={false}>
            {openId === item.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0 text-gray-700 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-700">
                  {item.answer}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
