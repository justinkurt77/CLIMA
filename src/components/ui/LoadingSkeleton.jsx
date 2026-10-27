/**
 * LoadingSkeleton - Animated loading placeholder component
 * Shows shimmer animation while content is loading
 */

export default function LoadingSkeleton({ variant = 'card', count = 1 }) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  const shimmerClass = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700";

  if (variant === 'card') {
    return (
      <div className="space-y-4">
        {skeletons.map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700"
          >
            {/* Header row with avatar and title */}
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-10 h-10 rounded-full ${shimmerClass}`}></div>
              <div className="flex-1 space-y-2">
                <div className={`h-4 ${shimmerClass} rounded w-3/4`}></div>
                <div className={`h-3 ${shimmerClass} rounded w-1/2`}></div>
              </div>
            </div>
            
            {/* Content lines */}
            <div className="space-y-2">
              <div className={`h-3 ${shimmerClass} rounded w-full`}></div>
              <div className={`h-3 ${shimmerClass} rounded w-5/6`}></div>
              <div className={`h-3 ${shimmerClass} rounded w-4/6`}></div>
            </div>
            
            {/* Footer */}
            <div className="flex justify-between items-center mt-4">
              <div className={`h-6 ${shimmerClass} rounded w-20`}></div>
              <div className={`h-6 ${shimmerClass} rounded w-16`}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'row') {
    return (
      <div className="space-y-2">
        {skeletons.map((i) => (
          <div key={i} className="flex items-center space-x-3 py-2">
            <div className={`w-8 h-8 rounded ${shimmerClass}`}></div>
            <div className="flex-1 space-y-2">
              <div className={`h-4 ${shimmerClass} rounded w-3/4`}></div>
              <div className={`h-3 ${shimmerClass} rounded w-1/2`}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'avatar') {
    return (
      <div className="flex items-center space-x-3">
        <div className={`w-12 h-12 rounded-full ${shimmerClass}`}></div>
        <div className="flex-1 space-y-2">
          <div className={`h-4 ${shimmerClass} rounded w-32`}></div>
          <div className={`h-3 ${shimmerClass} rounded w-24`}></div>
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="space-y-3">
        {skeletons.map((i) => (
          <div key={i} className="grid grid-cols-4 gap-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className={`h-4 ${shimmerClass} rounded`}></div>
            <div className={`h-4 ${shimmerClass} rounded`}></div>
            <div className={`h-4 ${shimmerClass} rounded`}></div>
            <div className={`h-4 ${shimmerClass} rounded w-3/4`}></div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
