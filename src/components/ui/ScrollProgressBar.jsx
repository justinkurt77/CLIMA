import { useScrollProgress } from '../../hooks/useScrollProgress';

/**
 * ScrollProgressBar - Visual indicator of page scroll progress
 * Appears as a thin bar at the top of the viewport
 */
export default function ScrollProgressBar() {
  const scrollProgress = useScrollProgress();

  return (
    <div
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 transition-all duration-150 ease-out z-[100]"
      style={{
        width: `${scrollProgress}%`,
        opacity: scrollProgress > 0 ? 1 : 0,
      }}
      aria-hidden="true"
    />
  );
}
